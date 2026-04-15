const { getGuildConfig, patchGuildConfig } = require("../../data/store");

const ACTION_WEIGHTS = {
  ticketClaim: 3,
  ticketClose: 5,
  applicationApprove: 6,
  applicationReject: 4,
  suggestionReview: 2,
  complaintReview: 3,
  moderation: 4,
};

function getDefaultStaffEntry() {
  return {
    score: 0,
    actions: {},
    recent: [],
    lastActionAt: 0,
  };
}

function getStaffEntry(guildId, userId) {
  const config = getGuildConfig(guildId);
  return config.stats.staff[userId] || getDefaultStaffEntry();
}

function recordStaffAction(guildId, userId, actionType, metadata = {}) {
  if (!userId) {
    return null;
  }

  const config = getGuildConfig(guildId);
  const current = getStaffEntry(guildId, userId);
  const next = {
    ...current,
    score: current.score + (ACTION_WEIGHTS[actionType] || 1),
    actions: {
      ...current.actions,
      [actionType]: (current.actions[actionType] || 0) + 1,
    },
    recent: [
      {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        actionType,
        createdAt: Date.now(),
        metadata,
      },
      ...(current.recent || []),
    ].slice(0, 25),
    lastActionAt: Date.now(),
  };

  patchGuildConfig(guildId, {
    stats: {
      staff: {
        ...config.stats.staff,
        [userId]: next,
      },
    },
  });

  return next;
}

function getStaffLeaderboard(guildId, limit = 10) {
  const config = getGuildConfig(guildId);
  return Object.entries(config.stats.staff || {})
    .sort((left, right) => {
      const scoreDiff = (right[1].score || 0) - (left[1].score || 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return (right[1].lastActionAt || 0) - (left[1].lastActionAt || 0);
    })
    .slice(0, limit)
    .map(([userId, entry]) => ({ userId, entry }));
}

module.exports = {
  getStaffEntry,
  recordStaffAction,
  getStaffLeaderboard,
};
