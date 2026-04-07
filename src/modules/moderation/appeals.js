const { getGuildConfig, patchGuildConfig } = require("../../data/store");

function addAppeal(guildId, appeal) {
  const config = getGuildConfig(guildId);
  const appeals = [...(config.moderation.appeals || []), appeal];
  patchGuildConfig(guildId, {
    moderation: {
      appeals,
    },
  });
  return appeal;
}

module.exports = {
  addAppeal,
};

