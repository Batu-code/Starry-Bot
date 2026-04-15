const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { buildTemplateContext, applyTemplate } = require("./templates");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

function listAutoMessages(guildId) {
  return getGuildConfig(guildId).community.autoMessages || [];
}

function addAutoMessage(guildId, autoMessage) {
  const items = listAutoMessages(guildId);
  const nextItem = {
    id: autoMessage.id || `auto-message-${Date.now()}`,
    channelId: autoMessage.channelId,
    content: autoMessage.content,
    intervalMinutes: autoMessage.intervalMinutes,
    enabled: autoMessage.enabled !== false,
    lastSentAt: autoMessage.lastSentAt || 0,
  };

  patchGuildConfig(guildId, {
    community: {
      autoMessages: [...items, nextItem],
    },
  });

  return nextItem;
}

function removeAutoMessage(guildId, id) {
  const items = listAutoMessages(guildId);
  const nextItems = items.filter((item) => item.id !== id);

  patchGuildConfig(guildId, {
    community: {
      autoMessages: nextItems,
    },
  });

  return nextItems.length !== items.length;
}

function updateAutoMessage(guildId, id, patch) {
  const items = listAutoMessages(guildId);
  const nextItems = items.map((item) => (item.id === id ? { ...item, ...patch } : item));

  patchGuildConfig(guildId, {
    community: {
      autoMessages: nextItems,
    },
  });
}

async function processAutoMessages(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    const items = config.community.autoMessages || [];

    for (const item of items) {
      if (!item.enabled) {
        continue;
      }

      const intervalMs = Math.max(5, item.intervalMinutes || 0) * 60 * 1000;
      if (item.lastSentAt && Date.now() - item.lastSentAt < intervalMs) {
        continue;
      }

      const channel = await guild.channels.fetch(item.channelId).catch(() => null);
      if (!channel?.isTextBased()) {
        continue;
      }

      const boostCount = guild.premiumSubscriptionCount || 0;
      const memberCount = guild.memberCount || 0;
      const content = applyTemplate(
        item.content,
        buildTemplateContext({
          guild: guild.name,
          memberCount,
          boostCount,
        }),
      );

      await channel.send({ content }).catch(() => null);
      updateAutoMessage(guild.id, item.id, { lastSentAt: Date.now() });

      await sendLog(guild, {
        color: COLORS.primary,
        title: "Oto Mesaj Gonderildi",
        description: `Zamanlanmis oto mesaj ${channel} kanalina iletildi.`,
        fields: [{ name: "Mesaj ID", value: item.id, inline: true }],
      });
    }
  }
}

module.exports = {
  listAutoMessages,
  addAutoMessage,
  removeAutoMessage,
  processAutoMessages,
};
