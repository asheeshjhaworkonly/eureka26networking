import assert from "node:assert/strict";
const origin = process.env.QA_ORIGIN || "http://localhost:3000";
for (const path of [
  "/api/profiles",
  "/api/profiles/me",
  "/api/export",
  "/api/export/status",
  "/api/profiles/00000000-0000-0000-0000-000000000001/contact",
  "/api/profiles/00000000-0000-0000-0000-000000000001/photo",
]) {
  const response = await fetch(origin + path, { redirect: "manual" });
  assert.equal(response.status, 401, `${path} must reject signed-out requests`);
  assert.equal((await response.json()).error, "Sign in to continue.");
}
for (const path of [
  "/directory",
  "/profile/edit",
  "/p/00000000-0000-0000-0000-000000000001",
  "/download",
]) {
  const response = await fetch(origin + path, { redirect: "manual" });
  assert.ok(
    [302, 303, 307, 308].includes(response.status),
    `${path} must redirect signed-out users`,
  );
  assert.ok(response.headers.get("location")?.includes("sign-in"));
}
const home = await fetch(origin);
assert.equal(home.status, 200);
assert.equal(home.headers.get("x-frame-options"), "DENY");
console.log(
  "Signed-out access protection passed: six APIs, four pages, and public landing headers.",
);
