const logger = require("../utils/logger");
const config = require("../config");
const jsonProvider = require("./providers/jsonProvider");
const { createProvider } = require("./providers/sqliteProvider");

let provider = null;

function getProvider() {
  if (provider) {
    return provider;
  }

  if (config.databaseMode === "sqlite") {
    const sqlite = createProvider();
    if (sqlite) {
      provider = sqlite;
      logger.info("Using SQLite storage provider", {
        path: config.databasePath,
      });
      return provider;
    }
  }

  provider = jsonProvider;
  logger.info("Using JSON storage provider");
  return provider;
}

module.exports = {
  getProvider,
};
