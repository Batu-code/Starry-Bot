const { ChannelType } = require("discord.js");
const { getGuildConfig, getRuntime, saveRuntime, patchGuildConfig } = require("../../data/store");
const { createBackup } = require("./backups");

function listSnapshots() {
  return getRuntime("snapshots", []);
}

function saveSnapshots(items) {
  saveRuntime("snapshots", items);
}

function serializeChannel(channel) {
  return {
    name: channel.name,
    type: channel.type,
    parentName: channel.parent?.name || null,
    topic: "topic" in channel ? channel.topic || null : null,
    nsfw: "nsfw" in channel ? Boolean(channel.nsfw) : false,
    rateLimitPerUser: "rateLimitPerUser" in channel ? channel.rateLimitPerUser || 0 : 0,
    bitrate: "bitrate" in channel ? channel.bitrate || null : null,
    userLimit: "userLimit" in channel ? channel.userLimit || null : null,
    position: channel.position,
    permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => ({
      id: overwrite.id,
      type: overwrite.type,
      allow: overwrite.allow.bitfield.toString(),
      deny: overwrite.deny.bitfield.toString(),
    })),
  };
}

async function createSnapshot(guild) {
  const config = getGuildConfig(guild.id);
  if (!config.security.snapshots.enabled) {
    throw new Error("Snapshot sistemi kapali.");
  }

  const entry = {
    id: `snapshot-${Date.now()}`,
    guildId: guild.id,
    createdAt: Date.now(),
    guildMeta: {
      name: guild.name,
      verificationLevel: guild.verificationLevel,
      explicitContentFilter: guild.explicitContentFilter,
      defaultMessageNotifications: guild.defaultMessageNotifications,
      afkTimeout: guild.afkTimeout,
      preferredLocale: guild.preferredLocale,
    },
    roles: guild.roles.cache
      .filter((role) => role.id !== guild.id)
      .sort((a, b) => a.position - b.position)
      .map((role) => ({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: role.permissions.bitfield.toString(),
        position: role.position,
      })),
    channels: guild.channels.cache
      .sort((a, b) => a.position - b.position)
      .map((channel) => serializeChannel(channel)),
    settings: {
      security: config.security,
      communityLogChannelId: config.community.logChannelId,
    },
  };

  const kept = config.security.snapshots.keepLast || 5;
  const existing = listSnapshots();
  const own = existing.filter((item) => item.guildId === guild.id).slice(0, kept - 1);
  const others = existing.filter((item) => item.guildId !== guild.id);
  const snapshots = [entry, ...own, ...others];
  saveSnapshots(snapshots);
  return entry;
}

function getSnapshot(guildId, id) {
  return listSnapshots().find((entry) => entry.guildId === guildId && entry.id === id) || null;
}

async function restoreSnapshot(guild, snapshot) {
  const existingCategories = new Map(
    guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildCategory)
      .map((channel) => [channel.name, channel.id]),
  );

  for (const role of snapshot.roles) {
    const current = guild.roles.cache.find((item) => item.name === role.name);
    if (!current) {
      await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: BigInt(role.permissions),
        reason: "Snapshot geri yukleme",
      }).catch(() => null);
    }
  }

  for (const channel of snapshot.channels) {
    const exists = guild.channels.cache.find((item) => item.name === channel.name && item.type === channel.type);
    if (exists) {
      continue;
    }

    let parent = null;
    if (channel.parentName) {
      parent = existingCategories.get(channel.parentName) || null;
    }

    const created = await guild.channels.create({
      name: channel.name,
      type: channel.type,
      parent: parent || undefined,
      topic: channel.topic || undefined,
      nsfw: channel.nsfw || undefined,
      rateLimitPerUser: channel.rateLimitPerUser || undefined,
      bitrate: channel.bitrate || undefined,
      userLimit: channel.userLimit || undefined,
      reason: "Snapshot geri yukleme",
    }).catch(() => null);

    if (created?.type === ChannelType.GuildCategory) {
      existingCategories.set(created.name, created.id);
    }
  }
}

async function processAutoSnapshots(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    const settings = config.security.snapshots;
    if (!settings.enabled || !settings.autoCreateEnabled) {
      continue;
    }

    const intervalMs = Math.max(1, settings.autoCreateIntervalHours || 12) * 60 * 60 * 1000;
    if (Date.now() - (settings.lastAutoSnapshotAt || 0) < intervalMs) {
      continue;
    }

    await createSnapshot(guild).catch(() => null);
    await createBackup(guild).catch(() => null);

    patchGuildConfig(guild.id, {
      security: {
        snapshots: {
          lastAutoSnapshotAt: Date.now(),
        },
      },
    });
  }
}

module.exports = {
  listSnapshots,
  createSnapshot,
  getSnapshot,
  restoreSnapshot,
  processAutoSnapshots,
};
