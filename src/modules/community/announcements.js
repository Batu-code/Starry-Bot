const { getGuildConfig, patchGuildConfig } = require("../../data/store");

function scheduleAnnouncement(guildId, announcement) {
  const config = getGuildConfig(guildId);
  const scheduledAnnouncements = [
    ...(config.automation.scheduledAnnouncements || []),
    announcement,
  ];

  patchGuildConfig(guildId, {
    automation: {
      scheduledAnnouncements,
    },
  });

  return announcement;
}

async function processAnnouncements(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    const due = (config.automation.scheduledAnnouncements || []).filter((item) => item.sendAt <= Date.now());
    if (!due.length) {
      continue;
    }

    const remaining = (config.automation.scheduledAnnouncements || []).filter((item) => item.sendAt > Date.now());
    patchGuildConfig(guild.id, {
      automation: {
        scheduledAnnouncements: remaining,
      },
    });

    for (const item of due) {
      const channel = await guild.channels.fetch(item.channelId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel.send({ content: `📢 **Planli Duyuru**\n${item.message}` }).catch(() => null);
      }
    }
  }
}

module.exports = {
  scheduleAnnouncement,
  processAnnouncements,
};

