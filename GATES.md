# Gates: Eureka 26 networking

OWNS: **

Scope: Build and verify the authenticated participant directory, editable profiles, QR/contact sharing, Supabase persistence, and free testing CSV exports; prepare GitHub and Vercel handoff without deploying or adding Razorpay.

- [x] G1: Production build and TypeScript validation pass
  CHECK: npm run build
  EXPECT: Generating static pages
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=E:\eureka 26 networking; path=6fed3d8e542f/46 entries; output=○  (Static)   prerendered as static content | ƒ  (Dynamic)  server-rendered on demand

- [x] G2: Profile validation, cross-field search, filters, safe CSV and contact exports pass behavioral tests
  CHECK: npm test
  EXPECT: tests passed
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=E:\eureka 26 networking; path=6fed3d8e542f/46 entries; output=# todo 0 | # duration_ms 598.7767

- [x] G3: Supabase persistence and storage are configured and access controls reviewed
  CHECK: npm run test:integration
  EXPECT: Live integration passed
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=E:\eureka 26 networking; path=6fed3d8e542f/46 entries; output=> node --env-file=.env --env-file=.env.local --import tsx tests/integration.mts | Live integration passed: validation, persistence, shared IDs, ownership, origin checks, private photos, contacts, fresh safe CSV, stable links, and removal.

- [x] G4: Browser checks cover responsive directory, form, profile, export, and signed-out protection
  EVIDENCE: CUA browser verified signed-in directory, all four form steps, required consent, persisted detail and QR, search plus combined filters, keyboard modal dismissal, removal confirmation cancellation, and free CSV success. Responsive checks at 360/390/768 and desktop; QR decoration overflow fixed and rechecked. Signed-out APIs/pages verified by check-access. Disposable profile and Clerk account removed. See QA-EVIDENCE.md.

- [ ] G5: GitHub contains the verified app with environment files excluded; Vercel setup is documented
  EVIDENCE: pending

- [x] G6: Production browser bundles exclude server secrets and environment files are not tracked
  CHECK: npm run verify:release
  EXPECT: Release secret checks passed
  EVIDENCE: Final production build followed by npm run verify:release exit=0; Release secret checks passed: 23 browser bundles and tracked files; positive leak control passed; environment files excluded. ESLint passed for the updated check script.
