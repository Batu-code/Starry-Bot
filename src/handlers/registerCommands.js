const { REST, Routes } = require("discord.js");
const config = require("../config");
const logger = require("../utils/logger");

async function registerCommands(commandPayload) {
  const rest = new REST({ version: "10" }).setToken(config.token);
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  await rest.put(route, { body: commandPayload });
  logger.info("Slash commands registered", {
    scope: config.guildId ? "guild" : "global",
    count: commandPayload.length,
  });
}

module.exports = {
  registerCommands,
};

