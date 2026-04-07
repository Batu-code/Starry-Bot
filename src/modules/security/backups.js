const { getRuntime, saveRuntime } = require("../../data/store");

function listBackups() {
  return getRuntime("backups", []);
}

function saveBackups(items) {
  saveRuntime("backups", items);
}

async function createBackup(guild) {
  const roles = guild.roles.cache
    .filter((role) => role.id !== guild.id)
    .map((role) => ({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions.bitfield.toString(),
      position: role.position,
    }));

  const channels = guild.channels.cache.map((channel) => ({
    name: channel.name,
    type: channel.type,
    parentName: channel.parent?.name || null,
    topic: "topic" in channel ? channel.topic || null : null,
    position: channel.position,
  }));

  const entry = {
    id: `${Date.now()}`,
    guildId: guild.id,
    createdAt: Date.now(),
    roles,
    channels,
  };

  const backups = [entry, ...listBackups()].slice(0, 10);
  saveBackups(backups);
  return entry;
}

function getBackup(id, guildId) {
  return listBackups().find((entry) => entry.id === id && entry.guildId === guildId) || null;
}

async function restoreBackup(guild, backup) {
  const existingCategories = new Map(
    guild.channels.cache
      .filter((channel) => channel.type === 4)
      .map((channel) => [channel.name, channel.id]),
  );

  for (const role of backup.roles) {
    const current = guild.roles.cache.find((item) => item.name === role.name);
    if (!current) {
      await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: BigInt(role.permissions),
        reason: "Yedek geri yukleme",
      }).catch(() => null);
    }
  }

  for (const channel of backup.channels) {
    const current = guild.channels.cache.find((item) => item.name === channel.name && item.type === channel.type);
    if (current) {
      continue;
    }

    let parent = null;
    if (channel.parentName) {
      parent = existingCategories.get(channel.parentName) || null;
    }

    const created = await guild.channels.create({
      name: channel.name,
      type: channel.type,
      topic: channel.topic || undefined,
      parent: parent || undefined,
    }).catch(() => null);

    if (created?.type === 4) {
      existingCategories.set(created.name, created.id);
    }
  }
}

module.exports = {
  createBackup,
  listBackups,
  getBackup,
  restoreBackup,
};

