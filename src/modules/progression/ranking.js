const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { completeTask } = require("./profiles");

function xpForNextLevel(level) {
  return 100 + level * 50 + level * level * 25;
}

function resolveLevelFromXp(xp = 0) {
  let level = 0;
  let spentXp = 0;
  let required = xpForNextLevel(level);

  while (xp >= spentXp + required) {
    spentXp += required;
    level += 1;
    required = xpForNextLevel(level);
  }

  return {
    level,
    currentLevelXp: xp - spentXp,
    neededXp: required,
    totalXp: xp,
  };
}

function ensureMessageStats(entry = {}) {
  const progress = resolveLevelFromXp(entry.xp || 0);
  return {
    xp: entry.xp || 0,
    level: progress.level,
    messageCount: entry.messageCount || 0,
    lastMessageAt: entry.lastMessageAt || 0,
  };
}

function ensureVoiceStats(entry = {}, voiceXpPerMinute = 4) {
  const activeSeconds = entry.activeSeconds || 0;
  const xp = entry.xp || Math.floor(activeSeconds / 60) * voiceXpPerMinute;
  const progress = resolveLevelFromXp(xp);
  return {
    totalSeconds: entry.totalSeconds || 0,
    activeSeconds,
    mutedSeconds: entry.mutedSeconds || 0,
    deafenedSeconds: entry.deafenedSeconds || 0,
    streamSeconds: entry.streamSeconds || 0,
    xp,
    level: progress.level,
    lastActivityAt: entry.lastActivityAt || 0,
    lastJoinAt: entry.lastJoinAt || 0,
    lastLeaveAt: entry.lastLeaveAt || 0,
  };
}

function ensurePartnerStats(entry = {}) {
  return {
    score: entry.score || 0,
    approvedCount: entry.approvedCount || 0,
    renewalCount: entry.renewalCount || 0,
    lastApprovedAt: entry.lastApprovedAt || 0,
    lastRenewedAt: entry.lastRenewedAt || 0,
  };
}

function getMessageStats(guildId, userId) {
  const config = getGuildConfig(guildId);
  return ensureMessageStats(config.stats.messages[userId]);
}

function getVoiceStats(guildId, userId) {
  const config = getGuildConfig(guildId);
  return ensureVoiceStats(
    config.stats.voiceSeconds[userId],
    config.progression.leveling.voiceXpPerMinute,
  );
}

function getPartnerStats(guildId, userId) {
  const config = getGuildConfig(guildId);
  return ensurePartnerStats(config.stats.partnerScores[userId]);
}

function getInviteCount(guildId, userId) {
  return getGuildConfig(guildId).stats.invites[userId] || 0;
}

function getCombinedRankProfile(guildId, userId) {
  return {
    message: getMessageStats(guildId, userId),
    voice: getVoiceStats(guildId, userId),
    partner: getPartnerStats(guildId, userId),
    invites: getInviteCount(guildId, userId),
  };
}

function calculateLeaderboardScore(kind, entry) {
  if (kind === "chat") {
    return entry.xp || 0;
  }

  if (kind === "voice") {
    return entry.xp || 0;
  }

  if (kind === "partner") {
    return entry.score || 0;
  }

  if (kind === "invite") {
    return entry || 0;
  }

  return 0;
}

function getLeaderboardEntries(guildId, kind) {
  const config = getGuildConfig(guildId);
  let entries = [];

  if (kind === "chat") {
    entries = Object.entries(config.stats.messages || {}).map(([userId, value]) => ({
      userId,
      stats: ensureMessageStats(value),
    }));
  } else if (kind === "voice") {
    entries = Object.entries(config.stats.voiceSeconds || {}).map(([userId, value]) => ({
      userId,
      stats: ensureVoiceStats(value, config.progression.leveling.voiceXpPerMinute),
    }));
  } else if (kind === "partner") {
    entries = Object.entries(config.stats.partnerScores || {}).map(([userId, value]) => ({
      userId,
      stats: ensurePartnerStats(value),
    }));
  } else if (kind === "invite") {
    entries = Object.entries(config.stats.invites || {}).map(([userId, value]) => ({
      userId,
      stats: value,
    }));
  }

  return entries
    .sort((left, right) => {
      const scoreDiff =
        calculateLeaderboardScore(kind, right.stats) -
        calculateLeaderboardScore(kind, left.stats);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return left.userId.localeCompare(right.userId);
    });
}

function getLeaderboard(guildId, kind, limit = 10) {
  return getLeaderboardEntries(guildId, kind).slice(0, limit);
}

function getUserRankPosition(guildId, userId, kind) {
  const entries = getLeaderboardEntries(guildId, kind);
  const index = entries.findIndex((entry) => entry.userId === userId);
  return index === -1 ? null : index + 1;
}

async function sendLevelUpMessage(message, level) {
  const config = getGuildConfig(message.guild.id);
  const settings = config.progression.leveling;
  if (!settings.announceLevelUps) {
    return;
  }

  const targetChannel = settings.levelUpChannelId
    ? await message.guild.channels.fetch(settings.levelUpChannelId).catch(() => null)
    : message.channel;

  if (!targetChannel?.isTextBased()) {
    return;
  }

  await targetChannel.send({
    content: `Tebrikler ${message.author}, chat seviyen **${level}** oldu.`,
  }).catch(() => null);
}

async function recordMessageActivity(client, message) {
  const config = getGuildConfig(message.guild.id);
  const settings = config.progression.leveling;
  if (!settings?.enabled) {
    return {
      leveledUp: false,
      stats: getMessageStats(message.guild.id, message.author.id),
      gainedXp: 0,
    };
  }

  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  const lastXpAt = client.runtime.levelCooldowns.get(key) || 0;
  const currentStats = ensureMessageStats(config.stats.messages[message.author.id]);
  const nextStats = {
    ...currentStats,
    messageCount: currentStats.messageCount + 1,
    lastMessageAt: now,
  };

  let gainedXp = 0;
  if (now - lastXpAt >= settings.messageCooldownMs) {
    const min = Math.min(settings.messageXpMin, settings.messageXpMax);
    const max = Math.max(settings.messageXpMin, settings.messageXpMax);
    gainedXp = Math.floor(Math.random() * (max - min + 1)) + min;
    nextStats.xp += gainedXp;
    client.runtime.levelCooldowns.set(key, now);
  }

  const previousLevel = currentStats.level;
  const nextLevelState = resolveLevelFromXp(nextStats.xp);
  nextStats.level = nextLevelState.level;

  patchGuildConfig(message.guild.id, {
    stats: {
      messages: {
        ...config.stats.messages,
        [message.author.id]: nextStats,
      },
    },
  });

  if (nextStats.messageCount >= 10) {
    completeTask(message.guild.id, message.author.id, "chat_10");
  }

  if (nextStats.level > previousLevel) {
    await sendLevelUpMessage(message, nextStats.level);
  }

  return {
    leveledUp: nextStats.level > previousLevel,
    stats: nextStats,
    gainedXp,
  };
}

function updateVoiceStats(guildId, userId, seconds, state = {}) {
  const config = getGuildConfig(guildId);
  const settings = config.progression.leveling;
  const currentStats = ensureVoiceStats(
    config.stats.voiceSeconds[userId],
    settings.voiceXpPerMinute,
  );

  const nextStats = {
    ...currentStats,
    totalSeconds: currentStats.totalSeconds + seconds,
    lastActivityAt: Date.now(),
  };

  if (state.deafened) {
    nextStats.deafenedSeconds += seconds;
  } else if (state.muted) {
    nextStats.mutedSeconds += seconds;
  } else {
    nextStats.activeSeconds += seconds;
  }

  if (state.streaming) {
    nextStats.streamSeconds += seconds;
  }

  nextStats.xp = Math.floor(nextStats.activeSeconds / 60) * settings.voiceXpPerMinute;
  nextStats.level = resolveLevelFromXp(nextStats.xp).level;

  patchGuildConfig(guildId, {
    stats: {
      voiceSeconds: {
        ...config.stats.voiceSeconds,
        [userId]: nextStats,
      },
    },
  });

  return {
    leveledUp: nextStats.level > currentStats.level,
    stats: nextStats,
  };
}

function markVoiceSessionStart(guildId, userId) {
  const config = getGuildConfig(guildId);
  const currentStats = ensureVoiceStats(
    config.stats.voiceSeconds[userId],
    config.progression.leveling.voiceXpPerMinute,
  );

  patchGuildConfig(guildId, {
    stats: {
      voiceSeconds: {
        ...config.stats.voiceSeconds,
        [userId]: {
          ...currentStats,
          lastJoinAt: Date.now(),
        },
      },
    },
  });
}

function markVoiceSessionEnd(guildId, userId) {
  const config = getGuildConfig(guildId);
  const currentStats = ensureVoiceStats(
    config.stats.voiceSeconds[userId],
    config.progression.leveling.voiceXpPerMinute,
  );

  patchGuildConfig(guildId, {
    stats: {
      voiceSeconds: {
        ...config.stats.voiceSeconds,
        [userId]: {
          ...currentStats,
          lastLeaveAt: Date.now(),
        },
      },
    },
  });
}

function addPartnerScore(guildId, userId, patch) {
  const config = getGuildConfig(guildId);
  const currentStats = ensurePartnerStats(config.stats.partnerScores[userId]);
  const nextStats = {
    ...currentStats,
    score: currentStats.score + (patch.score || 0),
    approvedCount: currentStats.approvedCount + (patch.approvedCount || 0),
    renewalCount: currentStats.renewalCount + (patch.renewalCount || 0),
    lastApprovedAt: patch.lastApprovedAt || currentStats.lastApprovedAt,
    lastRenewedAt: patch.lastRenewedAt || currentStats.lastRenewedAt,
  };

  patchGuildConfig(guildId, {
    stats: {
      partnerScores: {
        ...config.stats.partnerScores,
        [userId]: nextStats,
      },
    },
  });

  return nextStats;
}

function recordPartnerApproval(guildId, userId) {
  const config = getGuildConfig(guildId);
  return addPartnerScore(guildId, userId, {
    score: config.progression.partnering.approvalPoints,
    approvedCount: 1,
    lastApprovedAt: Date.now(),
  });
}

function recordPartnerRenewal(guildId, userId) {
  const config = getGuildConfig(guildId);
  return addPartnerScore(guildId, userId, {
    score: config.progression.partnering.renewalPoints,
    renewalCount: 1,
    lastRenewedAt: Date.now(),
  });
}

module.exports = {
  xpForNextLevel,
  resolveLevelFromXp,
  getMessageStats,
  getVoiceStats,
  getPartnerStats,
  getInviteCount,
  getCombinedRankProfile,
  getLeaderboard,
  getUserRankPosition,
  recordMessageActivity,
  updateVoiceStats,
  markVoiceSessionStart,
  markVoiceSessionEnd,
  recordPartnerApproval,
  recordPartnerRenewal,
};
