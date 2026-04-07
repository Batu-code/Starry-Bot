function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}g`);
  if (hours) parts.push(`${hours}sa`);
  if (minutes) parts.push(`${minutes}dk`);
  if (seconds || parts.length === 0) parts.push(`${seconds}sn`);
  return parts.join(" ");
}

function parseDuration(input) {
  const regex = /(\d+)\s*(s|sn|m|dk|h|sa|d|g)/gi;
  let match;
  let total = 0;

  while ((match = regex.exec(input))) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (["s", "sn"].includes(unit)) total += value * 1000;
    if (["m", "dk"].includes(unit)) total += value * 60 * 1000;
    if (["h", "sa"].includes(unit)) total += value * 60 * 60 * 1000;
    if (["d", "g"].includes(unit)) total += value * 24 * 60 * 60 * 1000;
  }

  return total;
}

function now() {
  return Date.now();
}

module.exports = {
  formatDuration,
  parseDuration,
  now,
};
