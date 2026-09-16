import { spawnSync } from "node:child_process";
import { appendFile } from "node:fs/promises";
const result = spawnSync(
  "npx.cmd",
  [
    "supabase",
    "projects",
    "api-keys",
    "--project-ref",
    "pmpekvgfhlixpivwfyfs",
    "--output",
    "json",
    "--agent",
    "no",
    "--output-format",
    "text",
  ],
  { shell: true, encoding: "utf8", windowsHide: true },
);
if (result.status !== 0) {
  console.error(
    "Could not retrieve Supabase project keys. Check CLI project access.",
  );
  process.exit(1);
}
try {
  const keys = JSON.parse(result.stdout);
  const service = keys.find((k) => k.name === "service_role")?.api_key;
  if (!service) throw new Error("Server key unavailable");
  await appendFile(
    ".env.local",
    `\nNEXT_PUBLIC_SUPABASE_URL=https://pmpekvgfhlixpivwfyfs.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=${service}\nDOWNLOAD_PAYMENT_GATE_ENABLED=false\n`,
  );
  console.log(
    "Supabase server configuration saved locally. No key values displayed.",
  );
} catch {
  console.error("Could not configure Supabase server credentials.");
  process.exit(1);
}
