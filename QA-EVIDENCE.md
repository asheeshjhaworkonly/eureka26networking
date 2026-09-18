# Verification evidence

Verified on 16 September 2026 in the Windows project workspace, using Next.js 16.3.5, Clerk authentication, Supabase database, and Vercel deployment.

## Passed

- Production build and TypeScript validation; ESLint without errors or warnings.
- Nine behavioral tests: profile fields, 50/51-word boundary, required consent, safe links and URL credentials, search across fields and social links, combined filters, CSV quoting/formula safety and fixed snapshots, contact escaping, matching/foreign request origins, and printable 4:5 participant cards with decoded QR destinations and Unicode/markup coverage.
- Signed-out checks: six data APIs return 401, four private pages redirect to sign-in, public landing returns 200 with security headers.
- Supabase schema checks: profiles and purchases exist; the photo bucket is private; direct reads with the publishable key are denied for both tables.
- Live integration: two disposable Clerk users; profile creation and updates persist; teammates may share a Eureka ID while keeping separate stable profile UUIDs; owner-only photo writes; foreign-origin saves denied; private PNG upload/read; private printable card access; card attachment headers; decoded card QR origin; vCard output; fresh CSV after updates with spreadsheet-formula escaping; free download mode; gated unpaid, pending, paid and repeat-paid download behavior; profile and photo removal. Test fixtures were cleaned up.
- Browser: signed-in directory, four-step profile creation, consent rejection before publishing, saved profile details, printable card preview, QR card download action, broad search, combined sector/state filters, filter dialog Escape dismissal, removal dialog cancellation, free CSV download success and repeat-download state.
- Payment-toggle browser checks: gate off showed no fee, payment, paid, checkout or testing-mode wording on the download and privacy pages while preserving the separate download page and pledge; gate on restored the one-time access explanation and blocked unpaid downloads. Desktop and 390px mobile layouts had no horizontal overflow.
- Clerk/Vercel production readiness: Vercel has encrypted live Clerk publishable and secret keys for Production and Preview, route variables point to `/sign-in` and `/sign-up`, `DOWNLOAD_PAYMENT_GATE_ENABLED=false` is present for Production and Preview, and `EXPORT_TEST_MODE` was removed. The production deployment alias points to the ready production deployment, Vercel SSO protection is off, the public `/__clerk/v1/environment` proxy returns Clerk JSON with status 200, and local env files are excluded from CLI deploy uploads by `.vercelignore`. The Next.js proxy matcher includes `/__clerk/:path*`, and `clerkMiddleware` explicitly enables `frontendApiProxy`.
- Correct private GitHub repository access verified. Release checks scan production browser bundles and tracked files for both server secrets, including a positive leak control; environment files are excluded from Git.

## Interface review

Reviewed typography and hierarchy, spacing and responsive layout, interaction states, motion/accessibility, and trust/data clarity. The interface uses a consistent cream/yellow/lavender palette, sharp borders and hard shadows, readable form sections, real directory counts, and explicit loading/empty/error states. Dialogs trap focus and restore it; reduced-motion preferences are respected.

Rejected changes: decorative animation on directory rows would distract from scanning; collapsing the form into one long screen would make its many fields harder to complete. The actual mobile QR overflow was corrected and verified instead.

Private profile images deliberately use authenticated browser image requests because the image optimizer does not forward session cookies. Photo uploads are capped at 3 MB to fit Vercel's function request limit.

## Launch boundaries

- User reported completing Google login. Independent signed-in browser checks used a disposable Clerk development test account; this account and its fictional profile were removed. Google-only development login settings were restored and confirmed.
- Physical QR scanning and contact import on the user's phone remain device acceptance checks. A localhost QR works only on a device able to reach that localhost; generate the launch QR on the deployed domain.
- Clerk production status reports DNS and SSL complete and Google OAuth configured. Mail provisioning remains pending in Clerk status; for this `vercel.app` setup, sign-in, sign-up, verification code, and password-reset code emails can use Clerk's shared `accounts.dev` infrastructure. A custom domain is still preferred for fully branded production behavior, customized email templates, email-link authentication, app invitations, and organization invitations.
- Razorpay is deferred until free functionality is approved; no payment is collected.

See GATES.md for final acceptance evidence and README.md for deployment instructions.
