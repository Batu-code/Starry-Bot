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

function findBlockedWord(content, blockedWords = []) {
  const normalized = (content || "").toLowerCase();
  return blockedWords.find((word) => normalized.includes(word.toLowerCase())) || null;
}

function isPartnershipChannel(message, guildConfig) {
  const partnership = guildConfig.community?.partnership;
  const channelName = message.channel?.name?.toLowerCase() || "";
  const parentName = message.channel?.parent?.name?.toLowerCase() || "";

  if (channelName.includes("partner") || parentName.includes("partner")) {
    return true;
  }

  if (!partnership) {
    return false;
  }

  return (
    message.channelId === partnership.partnerChannelId ||
    message.channelId === partnership.panelChannelId ||
    message.channel?.parentId === partnership.categoryId ||
    message.channel?.parentId === partnership.archiveCategoryId
  );
}

async function handleMessageSecurity(client, message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  const guildConfig = getGuildConfig(message.guild.id);
  const antiSpam = guildConfig.security.antiSpam;
  const autoMute = guildConfig.security.autoMute;

  if (!antiSpam.enabled && !(autoMute.enabled && autoMute.blockedWords?.length)) {
    return false;
  }

  if (
    autoMute.ignoredRoleIds?.length &&
    message.member?.roles?.cache?.some((role) => autoMute.ignoredRoleIds.includes(role.id))
  ) {
    return false;
  }

  const state = getState(client, message.guild.id, message.author.id);
  const current = Date.now();

  if (antiSpam.enabled) {
    state.timestamps.push(current);
    state.contents.push({
      content: message.content,
      createdAt: current,
    });

    state.timestamps = state.timestamps.filter((entry) => current - entry <= antiSpam.burstWindowMs);
    state.contents = state.contents.filter((entry) => current - entry.createdAt <= antiSpam.burstWindowMs);
  }

  const duplicateCount = antiSpam.enabled
    ? state.contents.filter((entry) => entry.content && entry.content === message.content).length
    : 0;
  const inviteBlocked =
    antiSpam.enabled &&
    antiSpam.inviteBlockEnabled &&
    containsInvite(message.content) &&
    !isPartnershipChannel(message, guildConfig);
  const blockedWord = findBlockedWord(message.content, autoMute.blockedWords);

  const shouldPunish =
    (antiSpam.enabled && state.timestamps.length >= antiSpam.messageBurstLimit) ||
    (antiSpam.enabled && duplicateCount >= antiSpam.duplicateLimit) ||
    (antiSpam.enabled && message.mentions.users.size >= antiSpam.mentionLimit) ||
    inviteBlocked ||
    Boolean(blockedWord);

  if (!shouldPunish) {
    return false;
  }

  if (autoMute.deleteMessage) {
    await message.delete().catch(() => null);
  }
  await addRiskScore(
    message.guild,
    message.author.id,
    20,
    blockedWord ? `Yasakli kelime kullanimi (${blockedWord})` : "Spam davranisi",
  );

  if (autoMute.enabled && message.member?.moderatable) {
    const reason = blockedWord
      ? `Oto mute: yasakli kelime (${blockedWord})`
      : "Oto mute: anti-spam sistemi";
    const duration = autoMute.durationMs || antiSpam.timeoutMs;
    await timeoutMember(message.member, message.client.user, duration, reason).catch(() => null);
  }

  await sendLog(message.guild, {
    color: COLORS.warning,
    title: blockedWord ? "Oto Mute Tetiklendi" : "Anti-Spam Islem Yapti",
    description: `${message.author.tag} icin koruma tetiklendi.`,
    fields: [
      { name: "Kanal", value: `${message.channel}`, inline: true },
      { name: "Kullanici", value: `${message.author}`, inline: true },
      { name: "Sebep", value: blockedWord ? `Yasakli kelime: ${blockedWord}` : "Spam / flood", inline: true },
      { name: "Icerik", value: message.content.slice(0, 1024) || "Bos", inline: false },
    ],
  });

  return true;
}

module.exports = {
  handleMessageSecurity,
};
