const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { addCase, getMemberCases } = require("./cases");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { formatDuration } = require("../../utils/time");
const { jailMember, unjailMember } = require("./jail");
const { recordModeratorIncident } = require("../security/moderatorAudit");

function addTimedAction(guildId, action) {
  const config = getGuildConfig(guildId);
  const timedActions = [...(config.moderation.timedActions || []), action];
  patchGuildConfig(guildId, {
    moderation: {
      timedActions,
    },
  });
}

function removeTimedAction(guildId, id) {
  const config = getGuildConfig(guildId);
  const timedActions = (config.moderation.timedActions || []).filter((entry) => entry.id !== id);
  patchGuildConfig(guildId, {
    moderation: {
      timedActions,
    },
  });
}

async function evaluateEscalation(member, moderator, sourceType, reason) {
  const config = getGuildConfig(member.guild.id).moderation.escalation;
  if (!config?.enabled) {
    return null;
  }

  const windowMs = config.windowDays * 24 * 60 * 60 * 1000;
  const recentCases = getMemberCases(member.guild.id, member.id).filter(
    (entry) => Date.now() - (entry.createdAt || 0) <= windowMs,
  );
  const autoReasonPrefix = "[Otomatik Ceza Merdiveni]";

  if (sourceType === "warn") {
    const warnCount = recentCases.filter((entry) => entry.type === "warn").length;
    if (warnCount >= config.warnToTimeout && member.moderatable && !member.isCommunicationDisabled()) {
      await timeoutMember(
        member,
        moderator,
        config.timeoutDurationMs,
        `${autoReasonPrefix} Tekrarlayan uyari vakalari: ${reason}`,
      );
      return "timeout";
    }
  }

  if (sourceType === "timeout") {
    const timeoutCount = recentCases.filter((entry) => entry.type === "timeout").length;
    if (timeoutCount >= config.timeoutToJail && getGuildConfig(member.guild.id).security.jailRoleId) {
      await tempJailMember(
        member,
        moderator,
        config.jailDurationMs,
        `${autoReasonPrefix} Tekrarlayan timeout vakalari: ${reason}`,
      );
      return "jail";
    }
  }

  if (sourceType === "jail") {
    const jailCount = recentCases.filter((entry) => entry.type === "jail").length;
    if (jailCount >= config.jailToBan && member.bannable) {
      await banMember(member, moderator, `${autoReasonPrefix} Tekrarlayan agir ihlaller`);
      return "ban";
    }
  }

  return null;
}

async function timeoutMember(member, moderator, durationMs, reason) {
  await member.timeout(durationMs, reason).catch(() => null);
  const entry = addCase(member.guild.id, {
    type: "timeout",
    targetId: member.id,
    moderatorId: moderator.id,
    reason,
    durationMs,
  });

  addTimedAction(member.guild.id, {
    id: `timeout-${Date.now()}-${member.id}`,
    type: "untimeout",
    userId: member.id,
    executeAt: Date.now() + durationMs,
  });

  await sendLog(member.guild, {
    color: COLORS.warning,
    title: "Timeout Verildi",
    description: `${member.user.tag} susturuldu.`,
    fields: [
      { name: "Case", value: `#${entry.id}`, inline: true },
      { name: "Sure", value: formatDuration(durationMs), inline: true },
      { name: "Sebep", value: reason, inline: false },
    ],
  });
  recordModeratorIncident(member.guild.id, {
    moderatorId: moderator.id,
    type: "timeout",
    source: "moderation",
    reason,
    targetId: member.id,
  });

  await evaluateEscalation(member, moderator, "timeout", reason).catch(() => null);
  return entry;
}

async function kickMember(member, moderator, reason) {
  const entry = addCase(member.guild.id, {
    type: "kick",
    targetId: member.id,
    moderatorId: moderator.id,
    reason,
  });

  await member.kick(reason).catch(() => null);
  await sendLog(member.guild, {
    color: COLORS.warning,
    title: "Kick Uygulandi",
    description: `${member.user.tag} sunucudan atildi.`,
    fields: [
      { name: "Case", value: `#${entry.id}`, inline: true },
      { name: "Sebep", value: reason, inline: false },
    ],
  });
  recordModeratorIncident(member.guild.id, {
    moderatorId: moderator.id,
    type: "kick",
    source: "moderation",
    reason,
    targetId: member.id,
  });

  return entry;
}

async function banMember(member, moderator, reason, deleteMessageSeconds = 0) {
  const entry = addCase(member.guild.id, {
    type: "ban",
    targetId: member.id,
    moderatorId: moderator.id,
    reason,
  });

  await member.ban({ reason, deleteMessageSeconds }).catch(() => null);
  await sendLog(member.guild, {
    color: COLORS.danger,
    title: "Ban Uygulandi",
    description: `${member.user.tag} banlandi.`,
    fields: [
      { name: "Case", value: `#${entry.id}`, inline: true },
      { name: "Sebep", value: reason, inline: false },
    ],
  });
  recordModeratorIncident(member.guild.id, {
    moderatorId: moderator.id,
    type: "ban",
    source: "moderation",
    reason,
    targetId: member.id,
  });

  return entry;
}

async function tempJailMember(member, moderator, durationMs, reason) {
  const entry = await jailMember(member, moderator, reason);
  addTimedAction(member.guild.id, {
    id: `jail-${Date.now()}-${member.id}`,
    type: "unjail",
    userId: member.id,
    executeAt: Date.now() + durationMs,
    reason: "Gecici jail suresi doldu",
  });
  await evaluateEscalation(member, moderator, "jail", reason).catch(() => null);
  return entry;
}

async function processTimedActions(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    const due = (config.moderation.timedActions || []).filter((entry) => entry.executeAt <= Date.now());
    for (const action of due) {
      const member = await guild.members.fetch(action.userId).catch(() => null);
      if (action.type === "untimeout" && member) {
        await member.timeout(null, "Sure doldu").catch(() => null);
      }
      if (action.type === "unjail" && member) {
        await unjailMember(member, client.user, action.reason || "Sure doldu").catch(() => null);
      }
      removeTimedAction(guild.id, action.id);
    }
  }
}

module.exports = {
  timeoutMember,
  kickMember,
  banMember,
  tempJailMember,
  processTimedActions,
  evaluateEscalation,
};
