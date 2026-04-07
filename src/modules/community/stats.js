const { ChannelType } = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");

async function refreshStats(guild) {
  const guildConfig = getGuildConfig(guild.id);
  const settings = guildConfig.community.stats;
  if (!settings.enabled || !settings.categoryId) {
    return;
  }

  const totalMembers = guild.memberCount;
  const botCount = guild.members.cache.filter((member) => member.user.bot).size;
  const onlineCount = guild.members.cache.filter(
    (member) => member.presence && member.presence.status !== "offline",
  ).size;

  async function ensureCounter(channelId, name) {
    const existing = channelId
      ? await guild.channels.fetch(channelId).catch(() => null)
      : null;

    if (existing) {
      await existing.setName(name).catch(() => null);
      return existing.id;
    }

    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: settings.categoryId,
    });
    return channel.id;
  }

  const memberChannelId = await ensureCounter(settings.memberChannelId, `Toplam: ${totalMembers}`);
  const botChannelId = await ensureCounter(settings.botChannelId, `Bot: ${botCount}`);
  const onlineChannelId = await ensureCounter(settings.onlineChannelId, `Online: ${onlineCount}`);

  patchGuildConfig(guild.id, {
    community: {
      stats: {
        ...settings,
        memberChannelId,
        botChannelId,
        onlineChannelId,
      },
    },
  });
}

module.exports = {
  refreshStats,
};

