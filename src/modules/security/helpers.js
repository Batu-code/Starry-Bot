const { AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { hasDangerousPermissions } = require("../../utils/permissions");

function isTrusted(guild, userId) {
  const guildConfig = getGuildConfig(guild.id);
  if (guild.ownerId === userId) {
    return true;
  }

  return guildConfig.security.trustedUserIds.includes(userId);
}

async function punishExecutor(member, reason) {
  if (!member || !member.moderatable) {
    return false;
  }

  const removableRoles = member.roles.cache.filter(
    (role) => role.editable && role.id !== member.guild.id && hasDangerousPermissions(role),
  );

  if (removableRoles.size) {
    await member.roles.remove(removableRoles, reason).catch(() => null);
  }

  await member.timeout(28 * 24 * 60 * 60 * 1000, reason).catch(() => null);
  return true;
}

async function fetchAuditExecutor(guild, type) {
  const audit = await guild.fetchAuditLogs({ type, limit: 1 }).catch(() => null);
  return audit?.entries.first() || null;
}

function canLockChannel(channel) {
  return channel
    .permissionsFor(channel.guild.members.me)
    ?.has(PermissionFlagsBits.ManageChannels);
}

module.exports = {
  AuditLogEvent,
  isTrusted,
  punishExecutor,
  fetchAuditExecutor,
  canLockChannel,
};

