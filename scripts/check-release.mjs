import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
async function files(dir) {
  const found = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = dir + "/" + e.name;
    if (e.isDirectory()) found.push(...(await files(path)));
    else if (/\.js$/.test(e.name)) found.push(path);
  }
  return found;
}
function containsSecret(content, secrets) {
  return secrets.some((s) => content.includes(s));
}
assert.equal(
  containsSecret("synthetic-key-in-bundle", ["synthetic-key-in-bundle"]),
  true,
  "Positive leak control must detect a secret",
);
assert.equal(
  containsSecret("ordinary public content", ["synthetic-key-in-bundle"]),
  false,
);
const secrets = [
  process.env.CLERK_SECRET_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
].filter(Boolean);
assert.equal(
  secrets.length,
  2,
  "Load local configuration to check both secret keys",
);
const bundles = await files(".next/static");
assert.ok(bundles.length > 0);
for (const path of bundles)
  assert.equal(
    containsSecret(await readFile(path, "utf8"), secrets),
    false,
    "A browser bundle contains a server secret",
  );
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split(
  "\n",
);
assert.ok(
  !tracked.some((p) => /^\.env/.test(p) && p !== ".env.example"),
  "Environment secrets must not be tracked",
);
for (const path of tracked.filter((p) => p && !/^\.env/.test(p)))
  assert.equal(
    containsSecret(await readFile(path, "utf8"), secrets),
    false,
    "A tracked repository file contains a server secret",
  );
console.log(
  `Release secret checks passed: ${bundles.length} browser bundles and tracked files; positive leak control passed; environment files excluded.`,
);
