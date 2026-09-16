import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
const servers = [];
async function start(enabled) {
  const port = await freePort();
  const url = `http://localhost:${port}`;
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "0.0.0.0",
      "--port",
      String(port),
    ],
    {
      env: { ...process.env, DOWNLOAD_PAYMENT_GATE_ENABLED: String(enabled) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  servers.push(server);
  let output = "";
  let lastStatus = "no response";
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-4000);
    });
  let exited = false;
  server.on("exit", () => {
    exited = true;
  });
  const until = Date.now() + 30000;
  while (Date.now() < until && !exited) {
    try {
      const response = await fetch(url + "/api/export/status", {
        redirect: "manual",
        signal: AbortSignal.timeout(2000),
      });
      lastStatus = String(response.status);
      if (response.status === 401) return url;
    } catch (error) {
      lastStatus = error.name + ":" + (error.cause?.code || error.message);
    }
    await sleep(200);
  }
  for (const value of [
    process.env.CLERK_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter(Boolean))
    output = output.replaceAll(value, "[redacted]");
  throw new Error(
    "Integration server failed; last HTTP status=" + lastStatus + ". " + output,
  );
}
try {
  const origin = await start(false);
  const gateOrigin = await start(true);
  const test = spawn(
    process.execPath,
    ["--import", "tsx", "tests/integration.mts"],
    {
      env: { ...process.env, QA_ORIGIN: origin, QA_GATE_ORIGIN: gateOrigin },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    test.once("error", reject);
    test.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  for (const server of servers) server.kill();
}
