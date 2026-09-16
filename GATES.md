# Gates: Eureka 26 networking

OWNS: **

Scope: Add a server-controlled download payment toggle that hides all payment messaging when off, retains the download page, restores messaging and entitlement checks when on, downloads a printable 4:5 participant QR card, and configure the Clerk app-origin proxy for the production Vercel domain. Verify both modes and push the changes to master. Razorpay collection remains deferred.

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

- [x] G4: Browser checks verify payment-free page, gated page and participant card on desktop and mobile
  EVIDENCE: Browser checks covered the signed-in download page with the gate off and on, the privacy page wording in both modes, desktop participant-card preview and download action, and mobile download/card layouts at 390px. Gate off had no visible fee, payment, paid, checkout or testing-mode wording while preserving the download page and pledge. Gate on restored the one-time access explanation and disabled the download for an unpaid account. Card preview loaded as a 4:5 PNG, the card download action worked, and measured mobile pages had no horizontal overflow. Disposable Clerk user and fictional Supabase profile were removed after testing.

- [x] G5: Verified changes are pushed to master and the Vercel toggle is documented
  EVIDENCE: origin/main and origin/master were both pushed on the private repository and point to the same finished state, with master created for the requested branch name. README documents the Vercel deployment steps, the DOWNLOAD_PAYMENT_GATE_ENABLED server-only variable with its false/true behavior, removal of the old EXPORT_TEST_MODE variable, Clerk production proxy setup for eureka26network.vercel.app, and the deferred Razorpay integration. Release secret scan (G6) checked tracked files and confirmed environment files stay untracked.

- [x] G6: Production browser bundles exclude server secrets and environment files are not tracked
  CHECK: npm run verify:release
  EXPECT: Release secret checks passed
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=E:\eureka 26 networking; path=6fed3d8e542f/46 entries; output=> node --env-file=.env --env-file=.env.local scripts/check-release.mjs | Release secret checks passed: 22 browser bundles and tracked files; positive leak control passed; environment files excluded; printable-card fonts traced.
