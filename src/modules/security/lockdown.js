const { PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { LOCKABLE_CHANNEL_TYPES } = require("../../constants");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

async function setLockdown(guild, enabled, reason = "Manuel islem") {
  const me = guild.members.me;
  const everyoneRole = guild.roles.everyone;

  for (const channel of guild.channels.cache.values()) {
    if (!LOCKABLE_CHANNEL_TYPES.has(channel.type)) {
      continue;
    }

    const permissions = channel.permissionsFor(me);
    if (!permissions?.has(PermissionFlagsBits.ManageChannels)) {
      continue;
    }

    const overwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
    const deny = new Set(overwrite?.deny?.toArray() || []);

    if (channel.isVoiceBased()) {
      if (enabled) deny.add(PermissionFlagsBits.Connect.toString());
      else deny.delete(PermissionFlagsBits.Connect.toString());
    } else {
      if (enabled) deny.add(PermissionFlagsBits.SendMessages.toString());
      else deny.delete(PermissionFlagsBits.SendMessages.toString());
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: deny.has(PermissionFlagsBits.SendMessages.toString()) ? false : null,
      Connect: deny.has(PermissionFlagsBits.Connect.toString()) ? false : null,
    }).catch(() => null);
  }

  patchGuildConfig(guild.id, {
    security: {
      lockdown: {
        active: enabled,
        reason,
        startedAt: enabled ? Date.now() : null,
      },
    },
    state: {
      raidModeUntil: enabled ? Date.now() + 15 * 60 * 1000 : null,
    },
  });

  await sendLog(guild, {
    color: enabled ? COLORS.danger : COLORS.success,
    title: enabled ? "Sunucu Lockdown Aktif" : "Sunucu Lockdown Kaldirildi",
    description: `Sebep: ${reason}`,
  });
}

module.exports = {
  setLockdown,
};

