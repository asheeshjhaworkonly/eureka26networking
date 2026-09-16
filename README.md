# eureka26networking

An unofficial, anonymous participant network for Eureka 2026 zonals. Next.js, Clerk, Supabase, and plain CSS. Razorpay is intentionally deferred until the free testing phase is approved.

## Included

- Clerk authentication, with Google available through the linked Clerk app. The production `vercel.app` domain uses Clerk's app-origin proxy at `/__clerk`.
- Participant-owned create/edit/delete profiles and optional private photo uploads (JPG, PNG, WebP; 3 MB maximum, keeping requests within [Vercel's function payload limit](https://vercel.com/docs/functions/limitations)).
- All requested company, personal, qualification, centre, experience and social fields. Fifty-word company description limit enforced on the server.
- Stable UUID profile URLs, printable 4:5 participant QR cards (1200×1500 PNG, 300 DPI), profile sharing, LinkedIn connections, and downloadable vCard contact files. Cards show the holder's name, company, role, Eureka ID and zonal centre. Mobile devices can import a vCard into Contacts; browser behavior varies.
- Authenticated directory, actual participant counts, full-profile search, combined filters, sorting and refresh.
- Separate download page in both modes. A server-controlled payment gate hides every fee/payment reference when off and restores the explanation and entitlement restriction when on. Fresh Excel-compatible CSV snapshots on each download, including formula-injection protection.
- Consent, withdrawal, and community rules. Self-reported qualification; no official verification or endorsement.
- A locked purchases table for the later one-time ₹9 account entitlement. No payment collection exists in this phase.

## Run locally

Use Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Local credentials live in `.env.local` (Clerk) and `.env` (Supabase), both excluded from Git. `.env.test` is not loaded by Next.js automatically. `.env.example` contains names and configuration guidance without secrets.

Required application configuration:

| Variable                            | Purpose                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key                                                                                                                                  |
| `CLERK_SECRET_KEY`                  | Clerk server key; never public                                                                                                                      |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL                                                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase server key; never public                                                                                                                   |
| `DOWNLOAD_PAYMENT_GATE_ENABLED`     | `false` (default) permits signed-in downloads with no payment wording. Exactly `true` restores the fee explanation and requires a paid entitlement. |

Set Clerk route variables shown in `.env.example`. `clerk env pull` can retrieve the linked Clerk app's keys without displaying them. Clerk development app: `app_3JPLbExoWR9gaWeuPzPQKcXIHDs`.

## Database setup

Supabase project: `pmpekvgfhlixpivwfyfs`.

The app uses authenticated server routes, so it does not require a separate Supabase user login or a Clerk third-party JWT integration. Browser clients never receive the service role key. Tables use RLS with no anonymous/authenticated grants; the server verifies Clerk users, ownership, origin, and input before service-role operations. The photo bucket is private.

With a CLI account authorized for this project:

```sh
npx supabase login
npx supabase link --project-ref pmpekvgfhlixpivwfyfs
npx supabase db push --linked
node scripts/configure-supabase.mjs
```

Run the configuration helper once to append Supabase values to `.env.local`; it does not display key values. Restart the local server afterwards.

Alternatively, run `supabase/migrations/202609160001_directory.sql` in the project's SQL editor and add the server key locally. A Supabase publishable/anon key cannot perform this setup or replace the server key. If using a Postgres connection, put `DATABASE_URL` in `.env.test` and run `npm run setup:database`.

## Test the actual user journey

1. Sign in with Google, open the directory, and create your profile.
2. Complete the four form steps, choose a photo if desired, and accept profile-sharing consent.
3. Publish. Confirm the profile appears in the directory and its details and photo are correct.
4. Search for text in an email, company, city, or social link; combine several filters and clear them.
5. Download the QR card, print it at 4×5 inches (or any 4:5 size), scan it on a second device, and sign in to view the shared profile. Generate the card on the final deployed domain before distributing printed copies.
6. Test LinkedIn, email, website, social links, and Save contact.
7. Open Download full sheet, read the explanation, accept the directory-use pledge, and download the free CSV.
8. Edit a profile and download again. The new CSV should change; the old file stays the same. Your profile URL and QR stay the same.
9. Remove your profile if testing with disposable data. Previously downloaded copies cannot be recalled.

```sh
npm test
npm run lint
npm run build
npm run test:integration
```

See `GATES.md` and `QA-EVIDENCE.md` for the current verification status and access limitations.

## Vercel deployment

1. Import `asheeshjhaworkonly/eureka26networking` into Vercel and select your preferred `*.vercel.app` project name. `main` and `master` are kept in sync; use whichever branch your Vercel project is already tracking.
2. Framework: Next.js. Use the default install and build settings. Set the required application environment variables above, plus Clerk route values from `.env.example`. Keep `DOWNLOAD_PAYMENT_GATE_ENABLED=false` while downloads are open.
3. Use the correct Clerk instance keys for the environment. Production must use `pk_live_` and `sk_live_` values.
4. For `eureka26network.vercel.app`, do not add DNS records for `vercel.app`. Vercel owns that domain. Clerk verifies the app-origin proxy URL `https://eureka26network.vercel.app/__clerk`, and the app routes that path through `clerkMiddleware`.
5. Deploy, then repeat the actual user journey on the chosen URL. `.vercelignore` excludes local `.env` files so CLI deploys use Vercel Project Settings values instead of uploading local secrets. Profile QR codes use the current site's origin; download new QR images after moving to a different domain.

Custom domains are still preferred before a public launch. They give the cleanest branded production behavior for Account Portal, custom email templates, email-link authentication, app invitations, organization invitations, and email customization.

## Later Razorpay phase

After the free flows are accepted: add server-created ₹9 orders, signed payment verification, signed/idempotent captured-payment webhooks, and the one-per-Clerk-user paid entitlement. Never unlock a download from a client-side “success” event alone. A paid account can then fetch fresh CSV snapshots without paying again. No checkout button or simulated payment is included now.

## Turn the download gate on or off

In Vercel → Project Settings → Environment Variables, set `DOWNLOAD_PAYMENT_GATE_ENABLED` for the desired environment, save, and redeploy:

- `false`: signed-in members can download. The separate download page and networking pledge remain; all fee, payment, checkout and testing banners are hidden, including payment references on the privacy page.
- `true`: the ₹9 explanation and checkout-availability notice return. The server rejects downloads for accounts without a paid entitlement; paid accounts can download newer snapshots without paying again. Profile browsing and printable QR cards remain available to signed-in members.

The setting is server-only. Missing values default to off. It replaces `EXPORT_TEST_MODE`, which is no longer used; remove the old variable from Vercel. Turning the gate on does not connect Razorpay: until that integration is added, unpaid accounts see the availability notice and cannot download.

`npm run test:integration` starts temporary production servers in both modes after a build, verifies unpaid/pending/paid access and private card generation, then removes its disposable development fixtures and stops those servers.

## Boundaries

No official Eureka participant verification, message sending, CRM sync, team accounts, or payment collection. A shared download is a full copy, and neither login nor a ₹9 fee prevents recipients from redistributing it. Account deletion in Clerk is separate from published-profile removal; remove the profile first. This implementation is sized for a zonal participant community; the directory loads all published profiles and should move to server-side search/pagination if the community grows substantially.
