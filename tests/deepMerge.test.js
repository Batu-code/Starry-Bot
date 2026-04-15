const test = require("node:test");
const assert = require("node:assert/strict");
const { deepMerge } = require("../src/utils/deepMerge");

test("deepMerge merges nested objects without mutating arrays by reference", () => {
  const base = {
    a: 1,
    nested: {
      enabled: true,
      values: [1, 2],
    },
  };

  const patch = {
    nested: {
      enabled: false,
      extra: "ok",
      values: [9],
    },
  };

  const result = deepMerge(base, patch);

  assert.equal(result.a, 1);
  assert.equal(result.nested.enabled, false);
  assert.equal(result.nested.extra, "ok");
  assert.deepEqual(result.nested.values, [9]);
  assert.notEqual(result.nested.values, patch.nested.values);
});

test("deepMerge ignores undefined values in overrides", () => {
  const result = deepMerge(
    {
      community: {
        welcomeMessage: "merhaba",
      },
    },
    {
      community: {
        welcomeMessage: undefined,
      },
    },
  );

  assert.equal(result.community.welcomeMessage, "merhaba");
});
