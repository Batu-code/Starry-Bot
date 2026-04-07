const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { addBalance } = require("../economy/system");
const { completeTask, grantBadge } = require("../progression/profiles");

function levelFromXp(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

async function handleLeveling(client, message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  const guildConfig = getGuildConfig(message.guild.id);
  const settings = guildConfig.community.leveling;
  if (!settings.enabled) {
    return;
  }

  const key = `${message.guild.id}:${message.author.id}`;
  const current = Date.now();
  const last = client.runtime.levelCooldowns.get(key) || 0;
  if (current - last < settings.cooldownMs) {
    return;
  }

  client.runtime.levelCooldowns.set(key, current);

  const xpMap = guildConfig.stats.messages;
  const currentXp = xpMap[message.author.id]?.xp || 0;
  const previousLevel = levelFromXp(currentXp);
  const gain = 8 + Math.floor(Math.random() * 8);
  const nextXp = currentXp + gain;
  const nextLevel = levelFromXp(nextXp);

  addBalance(message.guild.id, message.author.id, 5);

  xpMap[message.author.id] = {
    xp: nextXp,
    level: nextLevel,
    lastMessageAt: current,
  };

  patchGuildConfig(message.guild.id, {
    stats: {
      messages: xpMap,
    },
  });

  if (nextXp >= 100) {
    completeTask(message.guild.id, message.author.id, "chat_10");
  }

  if (nextLevel >= 10) {
    grantBadge(message.guild.id, message.author.id, "veteran");
  }

  if (nextLevel > previousLevel) {
    const channelId = settings.levelUpChannelId || message.channelId;
    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (channel?.isTextBased()) {
      await channel.send({
        content: `${message.author} seviye atladi. Yeni seviye: **${nextLevel}**`,
      }).catch(() => null);
    }

    await sendLog(message.guild, {
      color: COLORS.success,
      title: "Level Atlandi",
      description: `${message.author.tag} seviye ${nextLevel} oldu.`,
    });
  }
}

module.exports = {
  handleLeveling,
  levelFromXp,
};
