const { getGuildConfig } = require("../../data/store");
const {
  getCombinedRankProfile,
  getLeaderboard,
  getUserRankPosition,
} = require("../progression/ranking");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

function resolveTargetUser(message, rawValue) {
  if (message.mentions.users.first()) {
    return message.mentions.users.first();
  }

  if (!rawValue) {
    return message.author;
  }

  const normalized = rawValue.replace(/[<@!>]/g, "");
  if (/^\d{16,20}$/.test(normalized)) {
    return message.client.users.cache.get(normalized) || message.author;
  }

  return message.author;
}

function buildRankDescription(guildId, userId) {
  const profile = getCombinedRankProfile(guildId, userId);
  const chatRank = getUserRankPosition(guildId, userId, "chat");
  const voiceRank = getUserRankPosition(guildId, userId, "voice");
  const partnerRank = getUserRankPosition(guildId, userId, "partner");

  return [
    `Chat: seviye **${profile.message.level}** | XP **${profile.message.xp}** | sira **#${chatRank || "-"}**`,
    `Mesaj: **${profile.message.messageCount}**`,
    `Ses: seviye **${profile.voice.level}** | XP **${profile.voice.xp}** | sira **#${voiceRank || "-"}**`,
    `Aktif ses: **${formatDuration(profile.voice.activeSeconds * 1000)}**`,
    `Deafen suresi: **${formatDuration(profile.voice.deafenedSeconds * 1000)}**`,
    `Partner: puan **${profile.partner.score}** | sira **#${partnerRank || "-"}**`,
    `Davet: **${profile.invites}**`,
  ].join("\n");
}

function buildLeaderboard(kind, guildId) {
  const entries = getLeaderboard(guildId, kind, 10);
  if (!entries.length) {
    return "Heniz veri yok.";
  }

  return entries
    .map((entry, index) => {
      if (kind === "chat") {
        return `#${index + 1} <@${entry.userId}> - seviye ${entry.stats.level} (${entry.stats.xp} XP)`;
      }

      if (kind === "voice") {
        return `#${index + 1} <@${entry.userId}> - seviye ${entry.stats.level} (${formatDuration(entry.stats.activeSeconds * 1000)})`;
      }

      if (kind === "partner") {
        return `#${index + 1} <@${entry.userId}> - ${entry.stats.score} puan`;
      }

      return `#${index + 1} <@${entry.userId}> - ${entry.stats}`;
    })
    .join("\n");
}

async function handlePrefixCommand(message) {
  const guildConfig = getGuildConfig(message.guild.id);
  const acceptedPrefixes = new Set([".", guildConfig.general.prefix || "!"]);
  const prefix = [...acceptedPrefixes].find((item) => message.content.startsWith(item));
  if (!prefix) {
    return false;
  }

  const body = message.content.slice(prefix.length).trim();
  if (!body) {
    return false;
  }

  const parts = body.split(/\s+/);
  const commandName = parts.shift().toLowerCase();
  const argument = parts.join(" ");

  if (commandName === "rank") {
    const target = resolveTargetUser(message, argument);
    await message.reply({
      embeds: [infoEmbed(`${target.username} rank karti`, buildRankDescription(message.guild.id, target.id))],
    }).catch(() => null);
    return true;
  }

  if (commandName === "sesrank") {
    const target = resolveTargetUser(message, argument);
    const profile = getCombinedRankProfile(message.guild.id, target.id);
    const rank = getUserRankPosition(message.guild.id, target.id, "voice");
    await message.reply({
      embeds: [
        infoEmbed(
          `${target.username} ses rank`,
          [
            `Seviye: **${profile.voice.level}**`,
            `XP: **${profile.voice.xp}**`,
            `Sira: **#${rank || "-"}**`,
            `Aktif ses: **${formatDuration(profile.voice.activeSeconds * 1000)}**`,
            `Deafen: **${formatDuration(profile.voice.deafenedSeconds * 1000)}**`,
            `Mute: **${formatDuration(profile.voice.mutedSeconds * 1000)}**`,
          ].join("\n"),
        ),
      ],
    }).catch(() => null);
    return true;
  }

  if (commandName === "partnerrank") {
    const target = resolveTargetUser(message, argument);
    const profile = getCombinedRankProfile(message.guild.id, target.id);
    const rank = getUserRankPosition(message.guild.id, target.id, "partner");
    await message.reply({
      embeds: [
        infoEmbed(
          `${target.username} partner rank`,
          [
            `Puan: **${profile.partner.score}**`,
            `Sira: **#${rank || "-"}**`,
            `Onayli partner: **${profile.partner.approvedCount}**`,
            `Yenileme: **${profile.partner.renewalCount}**`,
          ].join("\n"),
        ),
      ],
    }).catch(() => null);
    return true;
  }

  if (commandName === "top") {
    const kindMap = {
      chat: "chat",
      ses: "voice",
      voice: "voice",
      partner: "partner",
      davet: "invite",
      invite: "invite",
    };
    const kind = kindMap[(parts[0] || "chat").toLowerCase()];
    if (!kind) {
      return false;
    }

    await message.reply({
      embeds: [infoEmbed(`Bocchi ${parts[0] || "chat"} top`, buildLeaderboard(kind, message.guild.id))],
    }).catch(() => null);
    return true;
  }

  return false;
}

module.exports = {
  handlePrefixCommand,
};
