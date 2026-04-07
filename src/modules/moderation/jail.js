const { PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { addCase, setJailed, clearJailed, getJailedEntry } = require("./cases");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { recordModeratorIncident } = require("../security/moderatorAudit");

async function jailMember(member, moderator, reason) {
  const guildConfig = getGuildConfig(member.guild.id);
  const jailRoleId = guildConfig.security.jailRoleId;

  if (!jailRoleId) {
    throw new Error("Jail rolu ayarlanmamis.");
  }

  const jailRole = member.guild.roles.cache.get(jailRoleId);
  if (!jailRole) {
    throw new Error("Jail rolu bulunamadi.");
  }

  const removableRoleIds = member.roles.cache
    .filter(
      (role) =>
        role.id !== member.guild.id &&
        role.id !== jailRoleId &&
        role.editable &&
        !role.permissions.has(PermissionFlagsBits.Administrator),
    )
    .map((role) => role.id);

  if (removableRoleIds.length) {
    await member.roles.remove(removableRoleIds, "Jail sistemi").catch(() => null);
  }

  await member.roles.add(jailRole, reason).catch(() => null);

  setJailed(member.guild.id, member.id, {
    roleIds: removableRoleIds,
    reason,
    moderatorId: moderator.id,
  });

  const entry = addCase(member.guild.id, {
    type: "jail",
    targetId: member.id,
    moderatorId: moderator.id,
    reason,
  });

  await sendLog(member.guild, {
    color: COLORS.warning,
    title: "Jail Uygulandi",
    description: `${member.user.tag} jail'e alindi.`,
    fields: [
      { name: "Case", value: `#${entry.id}`, inline: true },
      { name: "Yetkili", value: `<@${moderator.id}>`, inline: true },
      { name: "Sebep", value: reason, inline: false },
    ],
  });
  recordModeratorIncident(member.guild.id, {
    moderatorId: moderator.id,
    type: "jail",
    source: "moderation",
    reason,
    targetId: member.id,
  });

  return entry;
}

async function unjailMember(member, moderator, reason) {
  const guildConfig = getGuildConfig(member.guild.id);
  const jailRoleId = guildConfig.security.jailRoleId;
  const entry = getJailedEntry(member.guild.id, member.id);

  if (!entry) {
    throw new Error("Bu uye jail'de degil.");
  }

  if (jailRoleId) {
    const jailRole = member.guild.roles.cache.get(jailRoleId);
    if (jailRole && member.roles.cache.has(jailRole.id)) {
      await member.roles.remove(jailRole, reason).catch(() => null);
    }
  }

  const restorableRoles = (entry.roleIds || []).filter((roleId) =>
    member.guild.roles.cache.has(roleId),
  );

  if (restorableRoles.length) {
    await member.roles.add(restorableRoles, "Jail kaldirildi").catch(() => null);
  }

  clearJailed(member.guild.id, member.id);

  const caseEntry = addCase(member.guild.id, {
    type: "unjail",
    targetId: member.id,
    moderatorId: moderator.id,
    reason,
  });

  await sendLog(member.guild, {
    color: COLORS.success,
    title: "Jail Kaldirildi",
    description: `${member.user.tag} normal rollerine donduruldu.`,
    fields: [
      { name: "Case", value: `#${caseEntry.id}`, inline: true },
      { name: "Yetkili", value: `<@${moderator.id}>`, inline: true },
      { name: "Sebep", value: reason, inline: false },
    ],
  });

  return caseEntry;
}

module.exports = {
  jailMember,
  unjailMember,
};
