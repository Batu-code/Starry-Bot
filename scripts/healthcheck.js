const config = require("../src/config");
const { getRuntime } = require("../src/data/store");

const heartbeat = getRuntime("heartbeat", {});
if (!heartbeat.updatedAt) {
  console.error("Heartbeat missing.");
  process.exit(1);
}

const ageMs = Date.now() - heartbeat.updatedAt;
if (ageMs > config.runtimeHealth.maxAgeMs) {
  console.error(`Heartbeat stale: ${ageMs}ms`);
  process.exit(1);
}

if (heartbeat.status === "crashed") {
  console.error("Runtime marked as crashed.");
  process.exit(1);
}

console.log(`Heartbeat healthy: ${ageMs}ms`);
