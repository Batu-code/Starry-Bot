function log(level, message, extra = null) {
  const timestamp = new Date().toISOString();
  const payload = extra ? ` ${JSON.stringify(extra)}` : "";
  console[level](`[${timestamp}] ${message}${payload}`);
}

module.exports = {
  info(message, extra) {
    log("log", message, extra);
  },
  warn(message, extra) {
    log("warn", message, extra);
  },
  error(message, extra) {
    log("error", message, extra);
  },
};

