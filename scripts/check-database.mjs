import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && key, "Supabase server configuration is required");
const client = createClient(url, key, { auth: { persistSession: false } });
for (const table of ["profiles", "purchases"]) {
  const { error } = await client.from(table).select("*").limit(1);
  assert.ok(!error, `${table}: ${error?.code || "query failed"}`);
}
const { data: bucket, error: bucketError } =
  await client.storage.getBucket("founder-photos");
assert.ok(!bucketError, "Private photo bucket must exist");
assert.equal(bucket.public, false);
assert.equal(bucket.file_size_limit, 5242880);
const payload = JSON.parse(
  Buffer.from(key.split(".")[1], "base64url").toString(),
);
// Verify the service role key matches the configured project URL
const projectRefFromUrl = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
assert.equal(
  payload.ref,
  projectRefFromUrl,
  "Service role key must match project URL",
);
assert.equal(payload.role, "service_role");
console.log("Supabase schema and private storage passed.");
if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  const anon = createClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  for (const table of ["profiles", "purchases"]) {
    const { error, data } = await anon.from(table).select("*").limit(1);
    assert.ok(
      error && !data,
      `${table} must reject direct anonymous reads`,
    );
  }
  console.log("Anonymous database access rejected for both tables.");
}
