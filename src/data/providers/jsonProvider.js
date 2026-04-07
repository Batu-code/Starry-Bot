const fs = require("fs");
const path = require("path");
const config = require("../../config");

const guildDir = path.join(config.dataDir, "guilds");
const runtimeDir = path.join(config.dataDir, "runtime");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function guildPath(guildId) {
  return path.join(guildDir, `${guildId}.json`);
}

function runtimePath(name) {
  return path.join(runtimeDir, `${name}.json`);
}

function ensure() {
  ensureDir(config.dataDir);
  ensureDir(guildDir);
  ensureDir(runtimeDir);
}

module.exports = {
  type: "json",
  ensure,
  readGuild(guildId, fallback) {
    ensure();
    return readJson(guildPath(guildId), fallback);
  },
  writeGuild(guildId, value) {
    ensure();
    writeJson(guildPath(guildId), value);
    return value;
  },
  readRuntime(name, fallback) {
    ensure();
    return readJson(runtimePath(name), fallback);
  },
  writeRuntime(name, value) {
    ensure();
    writeJson(runtimePath(name), value);
    return value;
  },
};

