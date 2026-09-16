import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import jsQR from "jsqr";
import { emptyProfile, type Profile } from "../src/lib/core";
import { participantCardSvg } from "../src/lib/participant-card";

const profile: Profile = {
  ...emptyProfile,
  id: "ad1ab932-aab7-4d0f-8086-f81d42101543",
  name: "Yash Sharma",
  company: "Ideas & People <Network>",
  role: "Founder",
  centre: "Mumbai",
  photo: false,
  createdAt: "2026-09-16T00:00:00Z",
  updatedAt: "2026-09-16T00:00:00Z",
};

test("printable 4:5 participant card includes holder details and a decodable profile QR", async () => {
  const svg = participantCardSvg(profile, "https://network.example.com");
  assert.ok(svg.includes("Yash Sharma"));
  assert.ok(svg.includes("Ideas &amp; People &lt;Network&gt;"));
  assert.ok(svg.includes("Mumbai"), "Card names the zonal centre");
  assert.ok(
    !svg.includes("EUREKA ID"),
    "Participants are no longer asked for a Eureka ID",
  );
  assert.ok(
    !svg.includes("<text"),
    "Card lettering is outlined using bundled fonts, independent of host fonts",
  );
  const png = await sharp(Buffer.from(svg))
    .png()
    .withMetadata({ density: 300 })
    .toBuffer();
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 1500);
  assert.equal(metadata.density, 300);
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  assert.equal(decoded?.data, "https://network.example.com/p/" + profile.id);
});

test("card escapes profile markup and accommodates long Unicode holder details", async () => {
  const long = {
    ...profile,
    name: "आ".repeat(100),
    company: '<script>alert("test")</script>' + "W".repeat(100),
    role: "Chief Collaborator ".repeat(5),
    centre: "Bengaluru" as const,
  };
  const svg = participantCardSvg(long, "https://network.example.com");
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes(long.name));
  const metadata = await sharp(Buffer.from(svg)).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 1500);
});
