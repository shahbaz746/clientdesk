const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/models/User");

test("enforces at most one developer account with a partial unique index", () => {
  const developerIndex = User.schema.indexes().find(
    ([, options]) => options.name === "one_global_developer"
  );

  assert.ok(developerIndex);
  assert.deepEqual(developerIndex[0], { role: 1 });
  assert.equal(developerIndex[1].unique, true);
  assert.deepEqual(developerIndex[1].partialFilterExpression, {
    role: "developer",
  });
});