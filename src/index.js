const { BotClient } = require("./structures/BotClient");
const { ensureDataLayout } = require("./data/store");
const { loadCommands } = require("./handlers/loadCommands");
const { loadEvents } = require("./handlers/loadEvents");
const { registerCommands } = require("./handlers/registerCommands");
const { startDashboard } = require("./web/dashboard");
const config = require("./config");
const logger = require("./utils/logger");
const {
  markStarting,
  markShutdown,
  markCrash,
} = require("./modules/system/runtimeHealth");

let activeClient = null;
let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  try {
    markShutdown(signal);
  } catch (error) {
    logger.warn("Failed to write shutdown heartbeat", { message: error.message });
  }

  try {
    if (activeClient?.services?.dashboard) {
      activeClient.services.dashboard.close();
    }
  } catch (error) {
    logger.warn("Failed to close dashboard", { message: error.message });
  }

  try {
    if (activeClient) {
      activeClient.destroy();
    }
  } catch (error) {
    logger.warn("Failed to destroy Discord client", { message: error.message });
  }

  process.exit(exitCode);
}

async function bootstrap() {
  ensureDataLayout();
  markStarting();
  const client = new BotClient();
  activeClient = client;

  const payload = loadCommands(client);
  loadEvents(client);

  client.once("ready", async () => {
    await registerCommands(payload);
    client.services.dashboard = startDashboard(client);
  });

  await client.login(config.token);
}

bootstrap().catch((error) => {
  markCrash(error, "bootstrap");
  logger.error("Bot startup failed", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("SIGINT", () => {
  shutdown("SIGINT", 0).catch(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM", 0).catch(() => process.exit(0));
});

process.on("unhandledRejection", (error) => {
  markCrash(error, "unhandledRejection");
  logger.error("Unhandled promise rejection", {
    message: error?.message || String(error),
    stack: error?.stack || null,
  });
});

process.on("uncaughtException", (error) => {
  markCrash(error, "uncaughtException");
  logger.error("Uncaught exception", {
    message: error.message,
    stack: error.stack,
  });
  shutdown("uncaughtException", 1).catch(() => process.exit(1));
});
