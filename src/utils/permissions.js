const { PermissionFlagsBits } = require("discord.js");

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

module.exports = {
  hasDangerousPermissions,
  canManageMember,
};

