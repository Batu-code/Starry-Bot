const { BotClient } = require("./structures/BotClient");
const { ensureDataLayout } = require("./data/store");
const { loadCommands } = require("./handlers/loadCommands");
const { loadEvents } = require("./handlers/loadEvents");
const { registerCommands } = require("./handlers/registerCommands");
const { startDashboard } = require("./web/dashboard");
const config = require("./config");
const logger = require("./utils/logger");

async function bootstrap() {
  ensureDataLayout();
  const client = new BotClient();

  const payload = loadCommands(client);
  loadEvents(client);

  client.once("ready", async () => {
    await registerCommands(payload);
    client.services.dashboard = startDashboard(client);
  });

  await client.login(config.token);
}

bootstrap().catch((error) => {
  logger.error("Bot startup failed", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
