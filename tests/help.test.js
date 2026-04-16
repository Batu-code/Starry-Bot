const test = require("node:test");
const assert = require("node:assert/strict");
const { buildHelpEmbed } = require("../src/modules/community/help");

test("help embed contains key command families", () => {
  const embed = buildHelpEmbed();
  const text = embed.data.description;
  assert.match(text, /\/guvenlik-paneli/);
  assert.match(text, /\/partnerlik-kur/);
  assert.match(text, /\/setup-sihirbazi/);
  assert.match(text, /\/ticket-v2-kur/);
  assert.doesNotMatch(text, /\*\*Ekonomi\*\*/);
  assert.doesNotMatch(text, /\*\*Muzik\*\*/);
});
