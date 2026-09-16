# Gates: Eureka 26 networking

OWNS: **

Scope: Add a server-controlled download payment toggle that hides all payment messaging when off, retains the download page, restores messaging and entitlement checks when on, and downloads a printable 4:5 participant QR card. Verify both modes and push the changes to master. Razorpay collection remains deferred.

- [x] G1: Production build and TypeScript validation pass
  CHECK: npm run build
  EXPECT: Generating static pages
  EVIDENCE: npm run build exited 0 in the workspace PowerShell; compiled successfully and TypeScript completed. Production routes include authenticated card generation and request-time privacy rendering. Bundled fonts are included by output tracing.

- [x] G2: Behavioral tests verify validation, exports, printable 4:5 card dimensions and decoded QR destination
  CHECK: npm test
  EXPECT: tests passed
  EVIDENCE: npm test exited 0 in the workspace PowerShell; 9 tests passed. Generated card is 1200x1500 at 300 DPI and its QR decoded to the expected profile URL. Glyph outlines remove the host-font dependency; long Unicode fields and markup are exercised.

- [x] G3: Live integration verifies free and gated downloads, paid entitlements, private card access and existing persistence
  CHECK: npm run test:integration
  EXPECT: Live integration passed
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=E:\eureka 26 networking; path=6fed3d8e542f/46 entries; output=> node --env-file=.env --env-file=.env.local scripts/run-integration.mjs | Live integration passed: free/gated downloads, pending/paid entitlements, private printable card and decoded QR, validation, persistence, shared IDs, ownership, orig

- [ ] G4: Browser checks verify payment-free page, gated page and participant card on desktop and mobile
  EVIDENCE: Built production server started on port 3311 against each toggle value and checked in the Claude browser pane at desktop width and 375x812 mobile. Gate off: /privacy contains no fee, payment, checkout, Razorpay or paid wording; downloads section reads as a free snapshot. Gate on: /privacy renders "Downloads and the planned fee" with the one-time Rs 9 unlock explanation; both widths reflow without overflow. Signed-out /download returns 307 to /sign-in and /api/export, /api/export/status and /api/profiles/[id]/card return 401 in both modes. REMAINING: the signed-in download page in both modes and the rendered card image were not opened in a browser this run. The Clerk development instance accepts Google OAuth only, so a disposable account cannot be signed in without entering the owner's Google credentials. Server behavior for those paths is covered by G3 (live free/gated downloads, pending/paid entitlements, private card, decoded QR) and G2 (1200x1500 at 300 DPI, decoded QR destination). The disposable Clerk user created for this attempt was deleted.

- [x] G5: Verified changes are pushed to master and the Vercel toggle is documented
  EVIDENCE: README documents the Vercel deployment steps, the DOWNLOAD_PAYMENT_GATE_ENABLED server-only variable with its false/true behavior, removal of the old EXPORT_TEST_MODE variable, final-domain Clerk production setup, and the deferred Razorpay integration. Release secret scan (G6) checked tracked files and confirmed environment files stay untracked.

- [x] G6: Production browser bundles exclude server secrets and environment files are not tracked
  CHECK: npm run verify:release
  EXPECT: Release secret checks passed
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=E:\eureka 26 networking; path=6fed3d8e542f/46 entries; output=> node --env-file=.env --env-file=.env.local scripts/check-release.mjs | Release secret checks passed: 22 browser bundles and tracked files; positive leak control passed; environment files excluded; printable-card fonts traced.
