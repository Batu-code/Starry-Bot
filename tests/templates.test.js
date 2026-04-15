const test = require("node:test");
const assert = require("node:assert/strict");
const { buildTemplateContext, applyTemplate } = require("../src/modules/community/templates");

test("applyTemplate fills known placeholders and keeps unknown ones", () => {
  const context = buildTemplateContext({
    user: "@bocchi",
    userTag: "bocchi#0001",
    memberCount: 42,
    boostCount: 9,
  });

  const rendered = applyTemplate(
    "Hos geldin {user} | {userTag} | {memberCount} | {boostCount} | {unknown}",
    context,
  );

  assert.equal(rendered, "Hos geldin @bocchi | bocchi#0001 | 42 | 9 | {unknown}");
});
