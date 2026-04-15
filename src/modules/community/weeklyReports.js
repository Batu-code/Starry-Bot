const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { getLeaderboard } = require("../progression/ranking");
const { getStaffLeaderboard } = require("./staffStats");
const { COLORS } = require("../../constants");
const { formatDuration } = require("../../utils/time");

function getLocalParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday: weekdayMap[map.weekday],
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function getDateKey(timestamp, timeZone) {
  if (!timestamp) {
    return null;
  }
  const parts = getLocalParts(new Date(timestamp), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatLeaderboard(entries, formatter) {
  return entries.length
    ? entries.map((entry, index) => formatter(entry, index)).join("\n")
    : "Veri yok.";
}

function buildWeeklyReportEmbed(guild) {
  const config = getGuildConfig(guild.id);
  const topChat = getLeaderboard(guild.id, "chat", 5);
  const topVoice = getLeaderboard(guild.id, "voice", 5);
  const topInvites = getLeaderboard(guild.id, "invite", 5);
  const topStaff = getStaffLeaderboard(guild.id, 5);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentTickets = Object.values(config.community.ticket.records || {}).filter(
    (entry) => (entry.createdAt || 0) >= oneWeekAgo,
  );
  const recentApplications = Object.values(config.community.applications.records || {}).filter(
    (entry) => (entry.createdAt || 0) >= oneWeekAgo,
  );
  const recentFeedback = Object.values(config.community.feedback.items || {}).filter(
    (entry) => (entry.createdAt || 0) >= oneWeekAgo,
  );
  const recentCases = (config.moderation.cases || []).filter(
    (entry) => (entry.createdAt || 0) >= oneWeekAgo,
  );

  return {
    color: COLORS.primary,
    title: `${guild.name} Haftalik Bocchi Raporu`,
    description: "Son 7 gunun topluluk ve yonetim ozeti.",
    fields: [
      {
        name: "Chat Top 5",
        value: formatLeaderboard(topChat, (entry, index) => `#${index + 1} <@${entry.userId}> - ${entry.stats.level}lv / ${entry.stats.xp}xp`),
        inline: false,
      },
      {
        name: "Ses Top 5",
        value: formatLeaderboard(topVoice, (entry, index) => `#${index + 1} <@${entry.userId}> - ${formatDuration(entry.stats.activeSeconds * 1000)}`),
        inline: false,
      },
      {
        name: "Davet Top 5",
        value: formatLeaderboard(topInvites, (entry, index) => `#${index + 1} <@${entry.userId}> - ${entry.stats} davet`),
        inline: false,
      },
      {
        name: "Yetkili Top 5",
        value: formatLeaderboard(topStaff, ({ userId, entry }, index) => `#${index + 1} <@${userId}> - ${entry.score} puan`),
        inline: false,
      },
      {
        name: "Haftalik Ozet",
        value: [
          `Ticket: **${recentTickets.length}**`,
          `Basvuru: **${recentApplications.length}**`,
          `Geri Bildirim: **${recentFeedback.length}**`,
          `Moderasyon Vaka: **${recentCases.length}**`,
        ].join("\n"),
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

async function sendWeeklyReport(guild, targetChannel = null) {
  const config = getGuildConfig(guild.id);
  const weekly = config.automation.weeklyReports;
  const channel = targetChannel || (weekly.channelId ? await guild.channels.fetch(weekly.channelId).catch(() => null) : null);
  if (!channel?.isTextBased()) {
    return false;
  }

  await channel.send({
    embeds: [buildWeeklyReportEmbed(guild)],
  }).catch(() => null);

  patchGuildConfig(guild.id, {
    automation: {
      weeklyReports: {
        lastSentAt: Date.now(),
      },
    },
  });

  return true;
}

async function processWeeklyReports(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    const weekly = config.automation.weeklyReports;
    if (!weekly.enabled || !weekly.channelId) {
      continue;
    }

    const parts = getLocalParts(new Date(), weekly.timeZone || "Europe/Istanbul");
    const currentKey = `${parts.year}-${parts.month}-${parts.day}`;
    const lastKey = getDateKey(weekly.lastSentAt, weekly.timeZone || "Europe/Istanbul");
    const withinWindow = parts.hour === weekly.hour && parts.minute >= weekly.minute && parts.minute < weekly.minute + 20;

    if (parts.weekday !== weekly.dayOfWeek || !withinWindow || currentKey === lastKey) {
      continue;
    }

    await sendWeeklyReport(guild).catch(() => null);
  }
}

module.exports = {
  buildWeeklyReportEmbed,
  sendWeeklyReport,
  processWeeklyReports,
};
