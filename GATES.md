# Gates: Eureka 26 login path

OWNS: src/proxy.ts, src/lib/auth-redirect.ts, src/lib/request-origin.ts, src/components/auth-screen.tsx, src/app/sign-in/**, src/app/sign-up/**, next.config.ts, scripts/check-auth-path.mjs, tests/core.test.ts, README.md

Scope: Fix the deployed Clerk login path at its cause rather than patching symptoms. Signed-out visitors must reach a working sign-in page from any protected route on any host the app is served from, a signed-in visitor must never loop on the auth page, and no Clerk-hosted URL that cannot resolve may sit on the critical path. Diagnose why the browser held a session the server could not see, and record the configuration change that cause requires.

- [x] G1: Protected routes send signed-out visitors to the app's own sign-in page instead of a 404
  CHECK: npm run verify:auth
  EXPECT: Auth path checks passed
  EVIDENCE: exit=0 locally against a fresh production build. Also run against both deployed hosts with `npm run verify:auth:live -- <origin>`: eureka26networking.vercel.app and eureka26network.vercel.app each reported "Auth path checks passed: 4 protected routes offer sign-in, public routes stay open, API stays JSON." Live /directory now answers 307 to /sign-in?redirect_url=%2Fdirectory; before the change it answered 404 with X-Clerk-Auth-Reason "protect-rewrite". Negative control: restoring the previous bare auth.protect() middleware and rebuilding made the same check fail on all four protected routes, so the gate can fail honestly.

- [x] G2: Redirect targets are same-origin only and carry no hardcoded hostname
  CHECK: npm test
  EXPECT: tests pass
  EVIDENCE: exit=0; 12 tests pass, 0 fail. Added cases prove an absolute destination is accepted only when it matches the origin the request arrived on, that a destination for a different deployment alias falls back, that a bare relative path is kept, and that sign-in destinations preserve path and query while never pointing at themselves. CANONICAL_ORIGIN and the next.config host redirect are removed, so no deployment hostname is compiled into the app.

- [x] G3: Production build and TypeScript validation pass
  CHECK: npm run build
  EXPECT: Compiled successfully
  EVIDENCE: exit=0; "Compiled successfully"; 17 routes emitted including /sign-in, /sign-up and the proxy middleware. tsc --noEmit reported no errors.

- [x] G4: Lint passes over the changed source
  CHECK: npm run lint
  EXPECT: LINT CLEAN
  EVIDENCE: exit=0; "LINT CLEAN". Two real defects were found and fixed rather than suppressed: an unused-expression statement, and a synchronous setState inside an effect. The retry marker moved from sessionStorage into the URL, which removed the state entirely and keeps server and client renders in agreement.

- [x] G5: The live cause is measured, not assumed
  EVIDENCE: The deployed publishable key decoded to frontend API host clerk.eureka26network.vercel.app, and the instance's own environment named accounts.eureka26network.vercel.app for sign-in, sign-up, sign-out and user profile. Both hosts resolve through Vercel's wildcard DNS but return connection/TLS failure (curl exit code 000), so neither serves Clerk. vercel.app is on the Public Suffix List, so those names cannot be claimed. A request carrying __client_uat with no session token returned X-Clerk-Auth-Reason "protect-rewrite, client-uat-but-no-session-token": the server could never complete the handshake that issues a session, which is exactly the reported symptom of a signed-in header over a signed-out server. After moving the deployment to the development instance, a session minted through the Clerk backend API was accepted by the live server on /api/export/status, /api/profiles/me and /api/export, all 200. The disposable user was deleted.

- [x] G6: Changes are pushed and the required owner action is documented
  EVIDENCE: Pushed to origin/main and origin/master. README gained a "Clerk instance and domain" section explaining why a production instance cannot work on a *.vercel.app address, what each failure looks like, why the /__clerk proxy does not solve it, and the exact steps to move to a production instance on a custom domain. It also documents the two verification commands.
