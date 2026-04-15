require("dotenv").config();

const errors = [];
const warnings = [];

function requireValue(key) {
  if (!process.env[key]) {
    errors.push(`Missing required environment variable: ${key}`);
  }
}

function rejectPlaceholder(key, placeholders) {
  if (placeholders.includes(process.env[key])) {
    errors.push(`${key} is still using a placeholder value`);
  }
}

function requireBooleanPair(flagKey, dependentKey, message) {
  if (String(process.env[flagKey] || "false").toLowerCase() === "true" && !process.env[dependentKey]) {
    errors.push(message || `${dependentKey} is required when ${flagKey}=true`);
  }
}

function validateNumber(key, { min = null, max = null } = {}) {
  if (!process.env[key]) {
    return;
  }

  const value = Number(process.env[key]);
  if (!Number.isFinite(value)) {
    errors.push(`${key} must be a valid number`);
    return;
  }

  if (min !== null && value < min) {
    errors.push(`${key} must be >= ${min}`);
  }

  if (max !== null && value > max) {
    errors.push(`${key} must be <= ${max}`);
  }
}

requireValue("DISCORD_TOKEN");
requireValue("CLIENT_ID");
rejectPlaceholder("DISCORD_TOKEN", ["your_bot_token"]);
rejectPlaceholder("CLIENT_ID", ["your_application_id"]);

const databaseMode = process.env.DATABASE_MODE || "json";
if (!["json", "sqlite"].includes(databaseMode)) {
  errors.push("DATABASE_MODE must be either json or sqlite");
}

if (databaseMode === "sqlite") {
  try {
    require.resolve("better-sqlite3");
  } catch {
    warnings.push("DATABASE_MODE=sqlite but better-sqlite3 is not installed. Bot will fall back to JSON.");
  }
}

if (String(process.env.DASHBOARD_ENABLED || "false").toLowerCase() === "true") {
  validateNumber("DASHBOARD_PORT", { min: 1, max: 65535 });
  if ((process.env.DASHBOARD_TOKEN || "change_me") === "change_me") {
    errors.push("Set a custom DASHBOARD_TOKEN before enabling the dashboard");
  }
}

requireBooleanPair("AI_ENABLED", "OPENAI_API_KEY", "OPENAI_API_KEY is required when AI_ENABLED=true");
validateNumber("HEARTBEAT_MAX_AGE_MS", { min: 10000 });

if (errors.length) {
  for (const item of errors) {
    console.error(`[env:error] ${item}`);
  }
  for (const item of warnings) {
    console.warn(`[env:warn] ${item}`);
  }
  process.exit(1);
}

for (const item of warnings) {
  console.warn(`[env:warn] ${item}`);
}

console.log("Environment validation passed.");
