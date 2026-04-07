const test = require("node:test");
const assert = require("node:assert/strict");
const { parseDuration, formatDuration } = require("../src/utils/time");

test("parseDuration understands Turkish-friendly short units", () => {
  const ms = parseDuration("1sa 30dk 15sn");
  assert.equal(ms, ((1 * 60 * 60) + (30 * 60) + 15) * 1000);
});

test("formatDuration returns compact readable text", () => {
  const text = formatDuration(((2 * 60 * 60) + (5 * 60) + 4) * 1000);
  assert.match(text, /2sa/);
  assert.match(text, /5dk/);
  assert.match(text, /4sn/);
});

