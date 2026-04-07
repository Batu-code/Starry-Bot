const fs = require("fs");
const path = require("path");
const config = require("../../config");
const logger = require("../../utils/logger");

let DatabaseCtor = null;
try {
  DatabaseCtor = require("better-sqlite3");
} catch (error) {
  logger.warn("better-sqlite3 not available, SQLite provider disabled", {
    message: error.message,
  });
}

function createProvider() {
  if (!DatabaseCtor) {
    return null;
  }

  const dbPath = config.databasePath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseCtor(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_configs (
      guild_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runtime_docs (
      name TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const readGuildStmt = db.prepare("SELECT payload FROM guild_configs WHERE guild_id = ?");
  const writeGuildStmt = db.prepare(`
    INSERT INTO guild_configs (guild_id, payload, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `);

  const readRuntimeStmt = db.prepare("SELECT payload FROM runtime_docs WHERE name = ?");
  const writeRuntimeStmt = db.prepare(`
    INSERT INTO runtime_docs (name, payload, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `);

  return {
    type: "sqlite",
    ensure() {
      return;
    },
    readGuild(guildId, fallback) {
      const row = readGuildStmt.get(guildId);
      if (!row) {
        this.writeGuild(guildId, fallback);
        return fallback;
      }
      try {
        return JSON.parse(row.payload);
      } catch {
        this.writeGuild(guildId, fallback);
        return fallback;
      }
    },
    writeGuild(guildId, value) {
      writeGuildStmt.run(guildId, JSON.stringify(value), Date.now());
      return value;
    },
    readRuntime(name, fallback) {
      const row = readRuntimeStmt.get(name);
      if (!row) {
        this.writeRuntime(name, fallback);
        return fallback;
      }
      try {
        return JSON.parse(row.payload);
      } catch {
        this.writeRuntime(name, fallback);
        return fallback;
      }
    },
    writeRuntime(name, value) {
      writeRuntimeStmt.run(name, JSON.stringify(value), Date.now());
      return value;
    },
  };
}

module.exports = {
  createProvider,
};

