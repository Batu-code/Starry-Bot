const { ChannelType, PermissionsBitField } = require("discord.js");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

function serializePermissionOverwrites(channel) {
  return channel.permissionOverwrites.cache.map((overwrite) => ({
    id: overwrite.id,
    allow: overwrite.allow.bitfield.toString(),
    deny: overwrite.deny.bitfield.toString(),
    type: overwrite.type,
  }));
}

async function restoreDeletedChannel(channel) {
  if (!channel.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    return null;
  }

  const recreated = await channel.guild.channels.create({
    name: channel.name,
    type: channel.type,
    topic: channel.topic || undefined,
    nsfw: channel.nsfw || false,
    bitrate: channel.bitrate || undefined,
    userLimit: channel.userLimit || undefined,
    rateLimitPerUser: channel.rateLimitPerUser || undefined,
    parent: channel.parentId || undefined,
    position: channel.position,
    permissionOverwrites: serializePermissionOverwrites(channel),
  }).catch(() => null);

  if (recreated) {
    await sendLog(channel.guild, {
      color: COLORS.warning,
      title: "Kanal Geri Yuklendi",
      description: `${channel.name} silindikten sonra tekrar olusturuldu.`,
    });
  }

  return recreated;
}

async function restoreDeletedRole(role) {
  if (!role.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return null;
  }

  const recreated = await role.guild.roles.create({
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissions: role.permissions.bitfield,
    reason: "Anti-nuke rollback",
  }).catch(() => null);

  if (recreated) {
    await recreated.setPosition(role.position).catch(() => null);
    await sendLog(role.guild, {
      color: COLORS.warning,
      title: "Rol Geri Yuklendi",
      description: `${role.name} silindikten sonra tekrar olusturuldu.`,
    });
  }

  return recreated;
}

async function removeCreatedChannel(channel) {
  await channel.delete("Anti-nuke rollback").catch(() => null);
}

async function removeCreatedRole(role) {
  await role.delete("Anti-nuke rollback").catch(() => null);
}

module.exports = {
  restoreDeletedChannel,
  restoreDeletedRole,
  removeCreatedChannel,
  removeCreatedRole,
};

