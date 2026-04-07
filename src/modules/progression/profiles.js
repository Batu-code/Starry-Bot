const { getGuildConfig, patchGuildConfig } = require("../../data/store");

function getProfile(guildId, userId) {
  const config = getGuildConfig(guildId);
  return config.progression.profiles[userId] || {
    coins: 0,
    badges: [],
    completedTasks: {},
    achievements: [],
    bio: "",
  };
}

function saveProfile(guildId, userId, profile) {
  const config = getGuildConfig(guildId);
  const profiles = {
    ...config.progression.profiles,
    [userId]: profile,
  };

  patchGuildConfig(guildId, {
    progression: {
      profiles,
    },
  });
}

function updateProfile(guildId, userId, updater) {
  const current = getProfile(guildId, userId);
  const next = updater(current);
  saveProfile(guildId, userId, next);
  return next;
}

function grantBadge(guildId, userId, badgeId) {
  return updateProfile(guildId, userId, (profile) => ({
    ...profile,
    badges: profile.badges.includes(badgeId) ? profile.badges : [...profile.badges, badgeId],
  }));
}

function completeTask(guildId, userId, taskId) {
  return updateProfile(guildId, userId, (profile) => ({
    ...profile,
    completedTasks: {
      ...profile.completedTasks,
      [taskId]: Date.now(),
    },
  }));
}

module.exports = {
  getProfile,
  saveProfile,
  updateProfile,
  grantBadge,
  completeTask,
};

