const path = require("path");
require("dotenv").config();

const required = ["DISCORD_TOKEN", "CLIENT_ID"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.DEFAULT_PREFIX || "!",
  rootDir: path.resolve(__dirname, ".."),
  dataDir: path.resolve(__dirname, "..", "data"),
  databaseMode: process.env.DATABASE_MODE || "json",
  databasePath: path.resolve(__dirname, "..", process.env.DATABASE_PATH || "./data/bot.sqlite"),
  dashboard: {
    enabled: String(process.env.DASHBOARD_ENABLED || "false").toLowerCase() === "true",
    port: Number(process.env.DASHBOARD_PORT || 3000),
    token: process.env.DASHBOARD_TOKEN || "change_me",
  },
  ai: {
    enabled: String(process.env.AI_ENABLED || "false").toLowerCase() === "true",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  },
};
