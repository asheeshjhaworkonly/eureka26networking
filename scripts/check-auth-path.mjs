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

let child;
async function start() {
  const port = await freePort();
  const origin = `http://localhost:${port}`;
  child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--port", String(port)],
    { env: process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  let output = "";
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-4000);
    });
  for (let i = 0; i < 90; i += 1) {
    try {
      const res = await fetch(`${origin}/privacy`, { redirect: "manual" });
      if (res.status < 500) return origin;
    } catch {
      // not listening yet
    }
    await sleep(500);
  }
  throw new Error(`server did not start:\n${output}`);
}

const failures = [];
function check(name, condition, detail) {
  if (!condition) failures.push(`${name}: ${detail}`);
}

async function visit(origin, path) {
  const res = await fetch(origin + path, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") };
}

const PROTECTED = [
  "/directory",
  "/download",
  "/profile/edit",
  "/p/2f1d2a4e-0000-4000-8000-000000000000",
];

try {
  // With no argument the checks run against a freshly started local build.
  // Passing an origin checks a real deployment instead, which is the only
  // place a misconfigured auth provider can turn a protected route into a 404.
  const target = process.argv[2];
  const origin = target ? target.replace(/\/$/, "") : await start();
  console.log(`Checking auth path on ${origin}`);

  for (const path of PROTECTED) {
    const { status, location } = await visit(origin, path);
    check(
      `${path} is not a dead end`,
      status !== 404,
      `returned 404; a signed-out visitor must be offered sign-in`,
    );
    check(
      `${path} redirects`,
      status === 307 || status === 308 || status === 302,
      `expected a redirect, got ${status}`,
    );
    const target = new URL(location ?? "/", origin);
    check(
      `${path} redirects to this app's sign-in`,
      target.origin === origin && target.pathname === "/sign-in",
      `redirected to ${location}`,
    );
    check(
      `${path} keeps the original destination`,
      target.searchParams.get("redirect_url") === path,
      `redirect_url was ${target.searchParams.get("redirect_url")}`,
    );
  }

  // Positive controls: the middleware must not redirect everything, or the
  // checks above would pass for a server that is simply broken.
  for (const path of ["/", "/privacy", "/sign-in", "/sign-up"]) {
    const { status } = await visit(origin, path);
    check(`${path} stays public`, status === 200, `returned ${status}`);
  }

  // API routes answer, they do not redirect a browser-style login.
  const api = await visit(origin, "/api/export");
  check(
    "/api/export answers with 401",
    api.status === 401,
    `returned ${api.status}`,
  );

  if (failures.length) {
    console.error("Auth path checks failed:");
    for (const line of failures) console.error(`  - ${line}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Auth path checks passed: ${PROTECTED.length} protected routes offer sign-in, public routes stay open, API stays JSON.`,
    );
  }
} catch (error) {
  console.error("Auth path checks failed:", error.message);
  process.exitCode = 1;
} finally {
  child?.kill();
}
