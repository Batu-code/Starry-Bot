const os = require("os");
const config = require("../../config");
const { getRuntime, saveRuntime } = require("../../data/store");

function nowPayload(status, extra = {}) {
  const current = Date.now();
  const existing = getRuntime("heartbeat", {});

  return {
    ...existing,
    status,
    updatedAt: current,
    startedAt: existing.startedAt || current,
    pid: process.pid,
    hostname: os.hostname(),
    nodeVersion: process.version,
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    env: config.nodeEnv,
    ...extra,
  };
}

function saveHeartbeat(status, extra = {}) {
  const payload = nowPayload(status, extra);
  saveRuntime("heartbeat", payload);
  return payload;
}

function markStarting() {
  return saveHeartbeat("starting");
}

function markReady(client) {
  return saveHeartbeat("ready", {
    guildCount: client?.guilds?.cache?.size || 0,
  });
}

function markHeartbeat(client) {
  return saveHeartbeat("ready", {
    guildCount: client?.guilds?.cache?.size || 0,
    uptimeSeconds: Math.floor(process.uptime()),
  });
}

function markShutdown(signal = "shutdown") {
  return saveHeartbeat("stopping", {
    signal,
  });
}

function markCrash(error, source = "runtime") {
  return saveHeartbeat("crashed", {
    source,
    lastError: {
      message: error?.message || String(error),
      stack: error?.stack || null,
      at: Date.now(),
    },
  });
}

function getHeartbeat() {
  return getRuntime("heartbeat", {});
}

function buildProdStatus() {
  const heartbeat = getHeartbeat();
  const ageMs = heartbeat.updatedAt ? Date.now() - heartbeat.updatedAt : null;
  return {
    status: heartbeat.status || "unknown",
    updatedAt: heartbeat.updatedAt || 0,
    ageMs,
    healthy: Boolean(ageMs !== null && ageMs <= config.runtimeHealth.maxAgeMs && heartbeat.status !== "crashed"),
    pid: heartbeat.pid || null,
    memoryMb: heartbeat.memoryMb || 0,
    env: heartbeat.env || config.nodeEnv,
    guildCount: heartbeat.guildCount || 0,
    uptimeSeconds: heartbeat.uptimeSeconds || 0,
    lastError: heartbeat.lastError || null,
  };
}

module.exports = {
  markStarting,
  markReady,
  markHeartbeat,
  markShutdown,
  markCrash,
  getHeartbeat,
  buildProdStatus,
};
