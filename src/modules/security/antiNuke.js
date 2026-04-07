const { getGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { recordModeratorIncident } = require("./moderatorAudit");
const {
  isTrusted,
  punishExecutor,
  fetchAuditExecutor,
  AuditLogEvent,
} = require("./helpers");

function pushAction(client, guildId, userId, action, windowMs) {
  const key = `${guildId}:${userId}:${action}`;
  const current = Date.now();

  if (!client.runtime.antiNuke.has(key)) {
    client.runtime.antiNuke.set(key, []);
  }

  const list = client.runtime.antiNuke.get(key);
  list.push(current);

  while (list.length && current - list[0] > windowMs) {
    list.shift();
  }

  return list.length;
}

async function handleNukeSignal(client, guild, action, auditType, targetName) {
  const guildConfig = getGuildConfig(guild.id);
  const antiNuke = guildConfig.security.antiNuke;

  if (!antiNuke.enabled || !antiNuke.monitoredActions.includes(action)) {
    return { triggered: false, rollbackEnabled: antiNuke.rollbackEnabled };
  }

  const entry = await fetchAuditExecutor(guild, auditType);
  const executorId = entry?.executor?.id;

  if (!executorId || executorId === client.user.id || isTrusted(guild, executorId)) {
    return { triggered: false, rollbackEnabled: antiNuke.rollbackEnabled };
  }

  const count = pushAction(client, guild.id, executorId, action, antiNuke.windowMs);
  if (count < antiNuke.actionLimit) {
    return { triggered: false, rollbackEnabled: antiNuke.rollbackEnabled };
  }

  const member = await guild.members.fetch(executorId).catch(() => null);
  await punishExecutor(member, `Anti-nuke: ${action}`);
  recordModeratorIncident(guild.id, {
    moderatorId: executorId,
    type: "antinuke",
    source: "security",
    reason: action,
    targetName: targetName || "Bilinmiyor",
  });

  await sendLog(guild, {
    color: COLORS.danger,
    title: "Anti-Nuke Islem Yapti",
    description: `${entry.executor.tag} kullanicisi siniri asti ve cezalandirildi.`,
    fields: [
      { name: "Aksiyon", value: action, inline: true },
      { name: "Hedef", value: targetName || "Bilinmiyor", inline: true },
      { name: "Esik", value: `${count}/${antiNuke.actionLimit}`, inline: true },
    ],
  });

  return {
    triggered: true,
    rollbackEnabled: antiNuke.rollbackEnabled,
    executorId,
    action,
  };
}

module.exports = {
  AuditLogEvent,
  handleNukeSignal,
};
