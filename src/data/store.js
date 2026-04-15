const { DEFAULT_GUILD_CONFIG } = require("../constants");
const { deepMerge } = require("../utils/deepMerge");
const { getProvider } = require("./provider");

function ensureDataLayout() {
  const provider = getProvider();
  provider.ensure();
  provider.readRuntime("reminders", []);
  provider.readRuntime("giveaways", []);
  provider.readRuntime("backups", []);
  provider.readRuntime("snapshots", []);
  provider.readRuntime("heartbeat", {});
}

function getGuildConfig(guildId) {
  ensureDataLayout();
  const provider = getProvider();
  const current = provider.readGuild(guildId, DEFAULT_GUILD_CONFIG);
  const merged = deepMerge(DEFAULT_GUILD_CONFIG, current);
  provider.writeGuild(guildId, merged);
  return merged;
}

function saveGuildConfig(guildId, value) {
  ensureDataLayout();
  return getProvider().writeGuild(guildId, value);
}

function patchGuildConfig(guildId, patch) {
  const current = getGuildConfig(guildId);
  const next = deepMerge(current, patch);
  return saveGuildConfig(guildId, next);
}

function getRuntime(name, fallback) {
  ensureDataLayout();
  return getProvider().readRuntime(name, fallback);
}

function saveRuntime(name, value) {
  ensureDataLayout();
  return getProvider().writeRuntime(name, value);
}

module.exports = {
  ensureDataLayout,
  getGuildConfig,
  saveGuildConfig,
  patchGuildConfig,
  getRuntime,
  saveRuntime,
};
