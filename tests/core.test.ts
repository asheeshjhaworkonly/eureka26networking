import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyProfile,
  profileSchema,
  filterProfiles,
  profilesCsv,
  csvCell,
  vcard,
  safeUrl,
  sameOrigin,
  wordCount,
  type Profile,
} from "../src/lib/core";
import { safeAuthRedirect, signInDestination } from "../src/lib/auth-redirect";
const base = {
  ...emptyProfile,
  name: "Yash Sharma",
  email: "yash@example.com",
  phone: "+91 98765 43210",
  linkedin: "https://www.linkedin.com/in/yash",
  company: "Naya Labs",
  district: "Pune",
  state: "Maharashtra",
  description: "Affordable tools for small businesses.",
};
const a: Profile = {
  ...base,
  id: "00000000-0000-0000-0000-000000000001",
  photo: false,
  createdAt: "2026-09-16",
  updatedAt: "2026-09-16",
};
const b: Profile = {
  ...a,
  id: "00000000-0000-0000-0000-000000000002",
  name: "Aditi Mehta",
  company: "Yash Mobility",
  centre: "Delhi",
  sector: "Mobility",
  district: "Gurugram",
  email: "aditi@example.com",
};
test("valid profile accepted; consent, unsafe URLs, bad email, phone and 51 words rejected", () => {
  assert.equal(profileSchema.safeParse(base).success, true);
  for (const change of [
    { consent: false },
    { website: "javascript:alert(1)" },
    { linkedin: "https://linkedin.com.attacker.test/x" },
    { linkedin: "not a url" },
    { email: "broken" },
    { phone: "abc" },
    { description: Array(51).fill("word").join(" ") },
    { status: "Other", statusOther: "" },
    { socials: [{ label: "Instagram", url: "data:text/html,evil" }] },
  ])
    assert.equal(
      profileSchema.safeParse({ ...base, ...change }).success,
      false,
    );
  assert.equal(
    profileSchema.safeParse({
      ...base,
      description: Array(50).fill("word").join(" "),
    }).success,
    true,
  );
});

test("auth redirects keep same-origin destinations and reject external hosts", () => {
  const origin = "https://example-deployment.vercel.app";
  assert.equal(
    safeAuthRedirect(
      "https://example-deployment.vercel.app/profile/edit?step=1",
      "/directory",
      origin,
    ),
    "/profile/edit?step=1",
  );
  assert.equal(
    safeAuthRedirect("/download#pledge", "/directory", origin),
    "/download#pledge",
  );
  assert.equal(
    safeAuthRedirect(
      "https://attacker.example/profile/edit",
      "/directory",
      origin,
    ),
    "/directory",
  );
  assert.equal(
    safeAuthRedirect("//attacker.example", "/directory", origin),
    "/directory",
  );
});
test("auth redirects accept only the origin the request arrived on", () => {
  // The app is served from more than one hostname, so the destination is
  // validated against the live origin instead of a compiled-in domain.
  assert.equal(
    safeAuthRedirect(
      "https://example-deployment.vercel.app/directory",
      "/directory",
      "https://other-deployment.vercel.app",
    ),
    "/directory",
  );
  assert.equal(
    safeAuthRedirect(
      "https://other-deployment.vercel.app/profile/edit",
      "/directory",
      "https://other-deployment.vercel.app",
    ),
    "/profile/edit",
  );
  assert.equal(
    safeAuthRedirect("https://example-deployment.vercel.app/p/1", "/directory"),
    "/directory",
  );
  assert.equal(safeAuthRedirect("/p/1", "/directory"), "/p/1");
});

test("sign-in destinations keep the target and never point at themselves", () => {
  assert.equal(
    signInDestination("/p/abc?ref=card"),
    "/sign-in?redirect_url=%2Fp%2Fabc%3Fref%3Dcard",
  );
  assert.equal(
    signInDestination("/directory"),
    "/sign-in?redirect_url=%2Fdirectory",
  );
  assert.equal(signInDestination("/sign-in"), "/sign-in");
  assert.equal(
    signInDestination("/sign-in?redirect_url=%2Fdirectory"),
    "/sign-in",
  );
  assert.equal(signInDestination("https://attacker.example/x"), "/sign-in");
});

test("search matches names, company, email, location, and social links; terms combine", () => {
  assert.equal(filterProfiles([a, b], "yash", {}).length, 2);
  assert.deepEqual(
    filterProfiles([a, b], "aditi@example", {}).map((p) => p.name),
    ["Aditi Mehta"],
  );
  assert.equal(filterProfiles([a, b], "pune", {}).length, 1);
  assert.equal(filterProfiles([a, b], "YASH mobility", {}).length, 1);
  assert.equal(
    filterProfiles(
      [
        {
          ...a,
          socials: [
            { label: "Discord", url: "https://discord.gg/rarecommunity" },
          ],
        },
      ],
      "rarecommunity",
      {},
    ).length,
    1,
  );
  assert.equal(filterProfiles([a, b], "nomatch", {}).length, 0);
});
test("combined filters and query narrow the list; blank filters are neutral", () => {
  assert.equal(
    filterProfiles([a, b], "", { centre: "Delhi", sector: "Mobility" }).length,
    1,
  );
  assert.equal(
    filterProfiles([a, b], "Yash", { centre: "Mumbai", sector: "Mobility" })
      .length,
    0,
  );
  assert.equal(filterProfiles([a, b], "", { state: "" }).length, 2);
  assert.equal(
    filterProfiles(
      [{ ...a, sector: "Other", sectorOther: "Space technology" }],
      "",
      { sector: "Space technology" },
    ).length,
    1,
  );
});
test("CSV quotes commas/newlines and blocks formulas, including positive controls", () => {
  assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"');
  for (const s of [
    "=1+1",
    "+SUM(A1)",
    "-1",
    "@evil",
    '  =HYPERLINK("bad")',
    "\tcommand",
  ])
    assert.ok(csvCell(s).startsWith("\"'"));
  assert.equal(csvCell("ordinary"), '"ordinary"');
  const csv = profilesCsv([a, b], "https://test.example");
  assert.ok(csv.startsWith("\uFEFFid,"));
  assert.ok(csv.includes("Yash Sharma"));
  assert.ok(csv.includes("Aditi Mehta"));
  assert.ok(csv.includes("companyEmail"));
  assert.ok(!csv.includes("owner_id"));
  const fresh = profilesCsv(
    [a, b, { ...a, name: "New participant" }],
    "https://test.example",
  );
  assert.ok(fresh.includes("New participant"));
  assert.ok(!csv.includes("New participant"));
});
test("vCard preserves phone, email, escaped text and prevents line injection", () => {
  const contact = vcard({
    ...base,
    name: "Yash; Sharma",
    company: "A,B",
    description: "hello\nBEGIN:VCARD",
  });
  assert.ok(contact.includes("FN:Yash\\; Sharma"));
  assert.ok(contact.includes("ORG:A\\,B"));
  assert.ok(contact.includes("TEL;TYPE=CELL:+919876543210"));
  assert.ok(contact.includes("NOTE:hello\\nBEGIN:VCARD"));
  assert.equal(
    contact.split("\r\n").filter((l) => l === "BEGIN:VCARD").length,
    1,
  );
});
test("URL handling disallows embedded credentials and non-web protocols", () => {
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
  for (const s of [
    "javascript:alert(1)",
    "data:text/plain,x",
    "https://user:password@example.com",
    "garbage",
  ])
    assert.equal(safeUrl(s), null);
  assert.equal(wordCount("  one\n two   three "), 3);
});
process.on("beforeExit", () => console.log("Behavioral tests passed"));
test("origin checks accept the public request host and reject foreign hosts, ports, schemes and invalid input", () => {
  assert.equal(
    sameOrigin("http://localhost:3000", "localhost:3000", "http"),
    true,
  );
  assert.equal(
    sameOrigin("https://network.example", "network.example", "https"),
    true,
  );
  for (const origin of [
    "https://foreign.example",
    "http://network.example",
    "https://network.example:8080",
    null,
    "broken",
    "https://user:pass@network.example",
  ])
    assert.equal(sameOrigin(origin, "network.example", "https"), false);
});
