import assert from "node:assert/strict";
import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { emptyProfile } from "../src/lib/core";
const origin = process.env.QA_ORIGIN || "http://localhost:3000";
assert.ok(
  process.env.CLERK_SECRET_KEY?.startsWith("sk_test_"),
  "Use a Clerk development instance only",
);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
const users: string[] = [];
const sessions: string[] = [];
async function identity() {
  const user = await clerk.users.createUser({
    externalId: `eureka-qa-${crypto.randomUUID()}`,
    firstName: "Disposable",
    lastName: "QA",
    skipPasswordRequirement: true,
    privateMetadata: { eurekaQaOnly: true },
  });
  users.push(user.id);
  const session = await clerk.sessions.createSession({ userId: user.id });
  sessions.push(session.id);
  return session.id;
}
async function request(
  session: string,
  path: string,
  options: RequestInit = {},
) {
  const token = await clerk.sessions.getToken(session);
  return fetch(origin + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.jwt}`,
      Origin: origin,
      ...options.headers,
    },
    redirect: "manual",
  });
}
async function json(session: string, path: string, options: RequestInit = {}) {
  const res = await request(session, path, options);
  return { status: res.status, body: await res.json() };
}
const base = {
  ...emptyProfile,
  eurekaId: `QA-${Date.now()}`,
  name: "Yash Test Participant",
  email: "qa@example.com",
  phone: "+91 90000 00000",
  linkedin: "https://www.linkedin.com/in/eureka-qa",
  company: "Disposable Network QA",
  district: "Pune",
  state: "Maharashtra",
  description: "A fictional company for temporary integration checks.",
  socials: [{ label: "Discord", url: "https://discord.gg/temporaryqa" }],
};
const post = (data: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
try {
  const first = await identity(),
    second = await identity();
  const rejectedConsent = await json(
    first,
    "/api/profiles",
    post({ ...base, consent: false }),
  );
  assert.equal(rejectedConsent.status, 400, rejectedConsent.body.error);
  assert.equal(
    (
      await json(
        first,
        "/api/profiles",
        post({ ...base, description: Array(51).fill("word").join(" ") }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await json(first, "/api/profiles", {
        method: "POST",
        body: "invalid json",
      })
    ).status,
    400,
  );
  const created = await json(first, "/api/profiles", post(base));
  assert.equal(created.status, 200);
  const id = created.body.id;
  assert.match(id, /^[0-9a-f-]{36}$/);
  const teammate = await json(
    second,
    "/api/profiles",
    post({
      ...base,
      name: "Aditi Test Participant",
      centre: "Delhi",
      company: "Disposable Team QA",
    }),
  );
  assert.equal(teammate.status, 200, "Teammates can share a Eureka ID");
  assert.notEqual(teammate.body.id, id);
  const listed = await json(first, "/api/profiles");
  assert.equal(listed.status, 200);
  assert.ok(listed.body.profiles.some((p: { id: string }) => p.id === id));
  assert.ok(!JSON.stringify(listed.body).includes("owner_id"));
  const foreign = await request(first, "/api/profiles", {
    ...post(base),
    headers: { Origin: "https://foreign.example" },
  });
  assert.equal(foreign.status, 403);
  const file = new File(
    [
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WQAAAABJRU5ErkJggg==",
        "base64",
      ),
    ],
    "qa.png",
    { type: "image/png" },
  );
  const photoBody = new FormData();
  photoBody.set("photo", file);
  assert.equal(
    (
      await request(second, `/api/profiles/${id}/photo`, {
        method: "POST",
        body: photoBody,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(first, `/api/profiles/${id}/photo`, {
        method: "POST",
        body: photoBody,
      })
    ).status,
    200,
  );
  const image = await request(second, `/api/profiles/${id}/photo`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  const contact = await request(second, `/api/profiles/${id}/contact`);
  assert.equal(contact.status, 200);
  assert.ok((await contact.text()).includes("TEL;TYPE=CELL:+919000000000"));
  const status = await json(first, "/api/export/status");
  assert.deepEqual(status.body, { testMode: true, unlocked: true });
  const oldExport = await request(first, "/api/export");
  assert.equal(oldExport.status, 200);
  assert.equal(oldExport.headers.get("cache-control"), "private, no-store");
  const oldCsv = await oldExport.text();
  assert.ok(oldCsv.includes("Disposable Network QA"));
  const edit = await json(
    first,
    "/api/profiles",
    post({ ...base, company: '=HYPERLINK("test")' }),
  );
  assert.equal(edit.body.id, id, "Profile URL must remain stable");
  const updated = await json(first, `/api/profiles/${id}`);
  assert.equal(
    updated.body.profile.photo,
    true,
    "Editing text preserves the photo",
  );
  const newExport = await request(first, "/api/export");
  const newCsv = await newExport.text();
  assert.ok(newCsv.includes('"\'=HYPERLINK(""test"")"'));
  assert.ok(oldCsv.includes("Disposable Network QA"));
  assert.equal(
    (await json(first, "/api/profiles/me", { method: "DELETE" })).status,
    200,
  );
  assert.equal((await json(second, `/api/profiles/${id}`)).status, 404);
  const { data: photos } = await supabase.storage
    .from("founder-photos")
    .list(users[0]);
  assert.equal(photos?.length, 0);
  console.log(
    "Live integration passed: validation, persistence, shared IDs, ownership, origin checks, private photos, contacts, fresh safe CSV, stable links, and removal.",
  );
} finally {
  for (const uid of users) {
    await supabase.storage.from("founder-photos").remove([`${uid}/profile`]);
    await supabase.from("profiles").delete().eq("owner_id", uid);
    const user = await clerk.users.getUser(uid);
    if (user.privateMetadata.eurekaQaOnly) await clerk.users.deleteUser(uid);
  }
}
