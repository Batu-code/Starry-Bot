const { PermissionFlagsBits } = require("discord.js");

const PERMISSION_LABELS = {
  [PermissionFlagsBits.Administrator.toString()]: "Administrator",
  [PermissionFlagsBits.ManageChannels.toString()]: "ManageChannels",
  [PermissionFlagsBits.ManageGuild.toString()]: "ManageGuild",
  [PermissionFlagsBits.ManageRoles.toString()]: "ManageRoles",
  [PermissionFlagsBits.ManageWebhooks.toString()]: "ManageWebhooks",
  [PermissionFlagsBits.BanMembers.toString()]: "BanMembers",
  [PermissionFlagsBits.KickMembers.toString()]: "KickMembers",
  [PermissionFlagsBits.ModerateMembers.toString()]: "ModerateMembers",
  [PermissionFlagsBits.ViewAuditLog.toString()]: "ViewAuditLog",
  [PermissionFlagsBits.ViewChannel.toString()]: "ViewChannel",
  [PermissionFlagsBits.SendMessages.toString()]: "SendMessages",
  [PermissionFlagsBits.ReadMessageHistory.toString()]: "ReadMessageHistory",
  [PermissionFlagsBits.EmbedLinks.toString()]: "EmbedLinks",
  [PermissionFlagsBits.AttachFiles.toString()]: "AttachFiles",
  [PermissionFlagsBits.MoveMembers.toString()]: "MoveMembers",
  [PermissionFlagsBits.Connect.toString()]: "Connect",
  [PermissionFlagsBits.Speak.toString()]: "Speak",
};

function hasDangerousPermissions(role) {
  return [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageWebhooks,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ModerateMembers,
  ].some((permission) => role.permissions.has(permission));
}

function canManageMember(member) {
  return Boolean(member?.manageable);
}

function formatPermission(permission) {
  return PERMISSION_LABELS[permission.toString()] || permission.toString();
}

function listMissingPermissions(permissions, required = []) {
  return required.filter((permission) => !permissions?.has(permission));
}

module.exports = {
  hasDangerousPermissions,
  canManageMember,
  formatPermission,
  listMissingPermissions,
};
