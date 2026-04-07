const { getGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { addRiskScore } = require("./risk");
const { timeoutMember } = require("../moderation/actions");

function getState(client, guildId, userId) {
  const key = `${guildId}:${userId}`;
  if (!client.runtime.antiSpam.has(key)) {
    client.runtime.antiSpam.set(key, {
      timestamps: [],
      contents: [],
    });
  }

  return client.runtime.antiSpam.get(key);
}

function containsInvite(content) {
  return /(discord\.gg|discord\.com\/invite)\/[a-z0-9-]+/i.test(content);
}

async function handleMessageSecurity(client, message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  const guildConfig = getGuildConfig(message.guild.id);
  const antiSpam = guildConfig.security.antiSpam;

  if (!antiSpam.enabled) {
    return;
  }

  const state = getState(client, message.guild.id, message.author.id);
  const current = Date.now();

  state.timestamps.push(current);
  state.contents.push({
    content: message.content,
    createdAt: current,
  });

  state.timestamps = state.timestamps.filter((entry) => current - entry <= antiSpam.burstWindowMs);
  state.contents = state.contents.filter((entry) => current - entry.createdAt <= antiSpam.burstWindowMs);

  const duplicateCount = state.contents.filter(
    (entry) => entry.content && entry.content === message.content,
  ).length;

  const shouldPunish =
    state.timestamps.length >= antiSpam.messageBurstLimit ||
    duplicateCount >= antiSpam.duplicateLimit ||
    message.mentions.users.size >= antiSpam.mentionLimit ||
    (antiSpam.inviteBlockEnabled && containsInvite(message.content));

  if (!shouldPunish) {
    return;
  }

  await message.delete().catch(() => null);
  await addRiskScore(message.guild, message.author.id, 20, "Spam davranisi");

  if (message.member?.moderatable) {
    await timeoutMember(message.member, message.client.user, antiSpam.timeoutMs, "Anti-spam sistemi").catch(() => null);
  }

  await sendLog(message.guild, {
    color: COLORS.warning,
    title: "Anti-Spam Islem Yapti",
    description: `${message.author.tag} icin koruma tetiklendi.`,
    fields: [
      { name: "Kanal", value: `${message.channel}`, inline: true },
      { name: "Kullanici", value: `${message.author}`, inline: true },
      { name: "Icerik", value: message.content.slice(0, 1024) || "Bos", inline: false },
    ],
  });
}

module.exports = {
  handleMessageSecurity,
};
