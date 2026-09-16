# Verification evidence

Verified on 16 September 2026 in the Windows project workspace, using Next.js 16.3.5 and the linked Clerk development application.

## Passed

- Production build and TypeScript validation; ESLint without errors or warnings.
- Seven behavioral tests: profile fields, 50/51-word boundary, required consent, safe links and URL credentials, search across fields and social links, combined filters, CSV quoting/formula safety and fixed snapshots, contact escaping, and matching/foreign request origins.
- Signed-out checks: six data APIs return 401, four private pages redirect to sign-in, public landing returns 200 with security headers.
- Supabase schema checks: profiles and purchases exist; the photo bucket is private; direct reads with the publishable key are denied for both tables.
- Live integration: two disposable Clerk users; profile creation and updates persist; teammates may share a Eureka ID while keeping separate stable profile UUIDs; owner-only photo writes; foreign-origin saves denied; private PNG upload/read; vCard output; fresh CSV after updates with spreadsheet-formula escaping; profile and photo removal. Test fixtures were cleaned up.
- Browser: signed-in directory, four-step profile creation, consent rejection before publishing, saved profile details and rendered QR, QR download action, broad search, combined sector/state filters, filter dialog Escape dismissal, removal dialog cancellation, free CSV download success and repeat-download state.
- Responsive browser: landing and authenticated directory/form/profile/download at 390px; download at 360px; directory at 768px; desktop landing and signed-in flows. Measured layouts had no horizontal overflow after fixing the QR card's decorative mark. Mobile QR card remains a positioned container so its decoration stays clipped.
- Correct private GitHub repository access verified. Release checks scan production browser bundles and tracked files for both server secrets, including a positive leak control; environment files are excluded from Git.

## Interface review

Reviewed typography and hierarchy, spacing and responsive layout, interaction states, motion/accessibility, and trust/data clarity. The interface uses a consistent cream/yellow/lavender palette, sharp borders and hard shadows, readable form sections, real directory counts, and explicit loading/empty/error states. Dialogs trap focus and restore it; reduced-motion preferences are respected.

Rejected changes: decorative animation on directory rows would distract from scanning; collapsing the form into one long screen would make its many fields harder to complete. The actual mobile QR overflow was corrected and verified instead.

Private profile images deliberately use authenticated browser image requests because the image optimizer does not forward session cookies. Photo uploads are capped at 3 MB to fit Vercel's function request limit.

## Launch boundaries

- User reported completing Google login. Independent signed-in browser checks used a disposable Clerk development test account; this account and its fictional profile were removed. Google-only login settings were restored and confirmed.
- Physical QR scanning and contact import on the user's phone remain device acceptance checks. A localhost QR works only on a device able to reach that localhost; generate the launch QR on the deployed domain.
- Clerk production instance/domain and Google OAuth configuration must be completed for the final chosen domain. Development-key testing is not production OAuth verification.
- The repository owner performs the first Vercel deployment. Keep EXPORT_TEST_MODE=true for review. Razorpay is deferred until free functionality is approved; no payment is collected.

See GATES.md for final acceptance evidence and README.md for deployment instructions.
