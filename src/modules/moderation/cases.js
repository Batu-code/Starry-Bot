const { getGuildConfig, patchGuildConfig } = require("../../data/store");

function getCases(guildId) {
  return getGuildConfig(guildId).moderation.cases || [];
}

function addCase(guildId, payload) {
  const guildConfig = getGuildConfig(guildId);
  const cases = guildConfig.moderation.cases || [];
  const entry = {
    id: cases.length + 1,
    createdAt: Date.now(),
    ...payload,
  };

  cases.push(entry);
  patchGuildConfig(guildId, {
    moderation: {
      cases,
    },
  });

  return entry;
}

function getMemberCases(guildId, userId) {
  return getCases(guildId).filter((entry) => entry.targetId === userId);
}

function getModeratorStats(guildId) {
  const stats = {};
  for (const entry of getCases(guildId)) {
    if (!entry.moderatorId) {
      continue;
    }
    if (!stats[entry.moderatorId]) {
      stats[entry.moderatorId] = {
        total: 0,
        byType: {},
        lastActionAt: 0,
      };
    }
    stats[entry.moderatorId].total += 1;
    stats[entry.moderatorId].byType[entry.type] = (stats[entry.moderatorId].byType[entry.type] || 0) + 1;
    stats[entry.moderatorId].lastActionAt = Math.max(stats[entry.moderatorId].lastActionAt, entry.createdAt || 0);
  }
  return stats;
}

function getModerationSummary(guildId) {
  const summary = {
    total: 0,
    byType: {},
  };
  for (const entry of getCases(guildId)) {
    summary.total += 1;
    summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
  }
  return summary;
}

function setJailed(guildId, userId, payload) {
  const guildConfig = getGuildConfig(guildId);
  const jailedMembers = guildConfig.moderation.jailedMembers || {};

  jailedMembers[userId] = {
    ...payload,
    jailedAt: Date.now(),
  };

  patchGuildConfig(guildId, {
    moderation: {
      jailedMembers,
    },
  });
}

function clearJailed(guildId, userId) {
  const guildConfig = getGuildConfig(guildId);
  const jailedMembers = guildConfig.moderation.jailedMembers || {};
  delete jailedMembers[userId];

  patchGuildConfig(guildId, {
    moderation: {
      jailedMembers,
    },
  });
}

function getJailedEntry(guildId, userId) {
  return getGuildConfig(guildId).moderation.jailedMembers?.[userId] || null;
}

module.exports = {
  getCases,
  addCase,
  getMemberCases,
  getModeratorStats,
  getModerationSummary,
  setJailed,
  clearJailed,
  getJailedEntry,
};
