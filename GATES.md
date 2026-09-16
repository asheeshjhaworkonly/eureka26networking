# Gates: Eureka 26 login path

OWNS: src/proxy.ts, src/lib/auth-redirect.ts, src/components/auth-screen.tsx, src/app/sign-in/**, src/app/sign-up/**, next.config.ts, tests/**, README.md

Scope: Fix the deployed Clerk login path at its cause rather than patching symptoms. Signed-out visitors must reach a working sign-in page from any protected route on any host the app is served from, a signed-in visitor must never loop on the auth page, and no Clerk-hosted URL that cannot resolve may sit on the critical path. Diagnose why the browser holds a session the server cannot see and state the one configuration change only the owner can make.

- [ ] G1: Protected routes send signed-out visitors to the app's own sign-in page instead of a 404
  CHECK: npm run verify:auth
  EXPECT: Auth path checks passed
  EVIDENCE:

- [ ] G2: Redirect targets are same-origin only and carry no hardcoded hostname
  CHECK: npm test
  EXPECT: tests passed
  EVIDENCE:

- [ ] G3: Production build and TypeScript validation pass
  CHECK: npm run build
  EXPECT: Compiled successfully
  EVIDENCE:

- [ ] G4: Lint passes over the changed source
  CHECK: npm run lint
  EXPECT: LINT CLEAN
  EVIDENCE:

- [ ] G5: The live cause is measured, not assumed: the Clerk instance's own URLs are shown to be unreachable
  EVIDENCE:

- [ ] G6: Changes are pushed and the required owner action is documented in the README
  EVIDENCE:
