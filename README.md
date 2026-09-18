# Eureka 26 Networking App

An open-source participant networking platform for events and conferences. Built with Next.js, Clerk authentication, Supabase database, and deployed on Vercel.

> **Note**: This was originally built for Eureka 2026 zonals, but the codebase is fully generic and can be adapted for any event or networking community.

## Features

- **Authentication**: Clerk-based Google OAuth with protected routes
- **Profile Management**: Create, edit, and delete participant profiles with optional photos
- **Rich Profiles**: Company info, role, qualifications, location, experience, and social links  
- **Directory**: Searchable participant directory with filters and sorting
- **QR Cards**: Printable 4:5 ratio participant cards (1200×1500 PNG, 300 DPI) with QR codes
- **Contact Export**: Downloadable vCard files for importing contacts
- **CSV Export**: Bulk directory export with formula-injection protection
- **Payment Gate**: Optional server-controlled payment requirement for downloads
- **Privacy**: All personal data and photos require authentication; private photo storage

## Tech Stack

- **Frontend**: Next.js 15+ (App Router), React, TypeScript, Plain CSS
- **Authentication**: Clerk (Google OAuth)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Supabase Storage (private buckets)
- **Deployment**: Vercel
- **Payment**: Razorpay integration ready (currently deferred)

## Quick Start

### Prerequisites

- Node.js 20.9 or later
- npm
- A Clerk account ([clerk.com](https://clerk.com))
- A Supabase project ([supabase.com](https://supabase.com))

### Installation

```sh
npm ci
npm run dev
```

Open http://localhost:3000

### Environment Configuration

Required environment variables:

| Variable                            | Purpose                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key                                                                                                                                  |
| `CLERK_SECRET_KEY`                  | Clerk server key; never public                                                                                                                      |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL                                                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase server key; never public                                                                                                                   |
| `DOWNLOAD_PAYMENT_GATE_ENABLED`     | `false` (default) permits signed-in downloads with no payment wording. Exactly `true` restores the fee explanation and requires a paid entitlement. |

Local credentials live in `.env.local` (Clerk) and `.env` (Supabase), both excluded from Git. `.env.test` is not loaded by Next.js automatically. `.env.example` contains names and configuration guidance without secrets.

Set Clerk route variables shown in `.env.example`. `clerk env pull` can retrieve the linked Clerk app's keys without displaying them. Create your own Clerk development app at [clerk.com](https://clerk.com).

## Database Setup

Create your own Supabase project at [supabase.com](https://supabase.com).

The app uses authenticated server routes, so it does not require a separate Supabase user login or a Clerk third-party JWT integration. Browser clients never receive the service role key. Tables use RLS with no anonymous/authenticated grants; the server verifies Clerk users, ownership, origin, and input before service-role operations. The photo bucket is private.

With a CLI account authorized for your project:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked
SUPABASE_PROJECT_REF=YOUR_PROJECT_REF node scripts/configure-supabase.mjs
```

Run the configuration helper once to append Supabase values to `.env.local`; it does not display key values. Restart the local server afterwards.

Alternatively, run `supabase/migrations/202609160001_directory.sql` in the project's SQL editor and add the server key locally. A Supabase publishable/anon key cannot perform this setup or replace the server key. If using a Postgres connection, put `DATABASE_URL` in `.env.test` and run `npm run setup:database`.

## Testing

Test the actual user journey:

1. Sign in with Google, open the directory, and create your profile.
2. Complete the four form steps, choose a photo if desired, and accept profile-sharing consent.
3. Publish. Confirm the profile appears in the directory and its details and photo are correct.
4. Search for text in an email, company, city, or social link; combine several filters and clear them.
5. Download the QR card, print it at 4×5 inches (or any 4:5 size), scan it on a second device, and sign in to view the shared profile. Generate the card on the final deployed domain before distributing printed copies.
6. Test LinkedIn, email, website, social links, and Save contact.
7. Open Download full sheet, read the explanation, accept the directory-use pledge, and download the free CSV.
8. Edit a profile and download again. The new CSV should change; the old file stays the same. Your profile URL and QR stay the same.
9. Remove your profile if testing with disposable data. Previously downloaded copies cannot be recalled.

Run automated tests:

```sh
npm test                    # Unit tests
npm run lint               # Linting
npm run build              # Production build
npm run test:integration   # Integration tests
npm run verify:auth        # Auth flow verification
```

See `GATES.md` and `QA-EVIDENCE.md` for the current verification status and access limitations.

## Vercel Deployment

1. Fork this repository and import it into Vercel. Select your preferred `*.vercel.app` project name. Use either `main` or `master` branch.
2. Framework: Next.js. Use the default install and build settings. Set the required application environment variables above, plus Clerk route values from `.env.example`. Keep `DOWNLOAD_PAYMENT_GATE_ENABLED=false` while downloads are open.
3. On a `*.vercel.app` address, use the Clerk **development** instance keys (`pk_test_`, `sk_test_`). See "Clerk instance and domain" below before reaching for production keys.
4. Deploy, then repeat the actual user journey on the chosen URL. `.vercelignore` excludes local `.env` files so CLI deploys use Vercel Project Settings values instead of uploading local secrets. Profile QR codes use the current site's origin; download new QR images after moving to a different domain.

### Clerk Instance and Domain

A Clerk **production** instance is bound to `clerk.<your-domain>` and `accounts.<your-domain>`. It serves its frontend API from the first and its account portal from the second, and the app's server obtains a session by a handshake against the frontend API host.

Neither host can exist under `*.vercel.app`. `vercel.app` is on the Public Suffix List and Vercel owns it, so `clerk.<name>.vercel.app` cannot be claimed. Both names still resolve through Vercel's wildcard DNS but serve nothing, which fails in a way that looks like an app bug rather than a configuration one:

- The server handshake never completes, so the browser shows a signed-in header while every protected route answers as signed out. Clerk reports `client-uat-but-no-session-token`.
- `auth.protect()` cannot reach a working sign-in page, so Clerk rewrites the request to a 404. Every protected address, including the `/p/` links printed on QR cards, returns "not found".
- Sign-in bounces back to itself, leaving the visitor on a loading screen that never resolves.

Routing the frontend API through the app-origin proxy at `/__clerk` fixes only the browser's leg. It does not give the server a reachable handshake host and does not revive the account portal.

So: on a `*.vercel.app` address, run the development instance. It serves its frontend API from `<slug>.clerk.accounts.dev` and its portal from `<slug>.accounts.dev`, both real hosts with valid certificates, and it accepts any origin. Google sign-in works through Clerk's shared credentials. The trade is a "Development mode" badge on the widget and Clerk's development limits.

**To move to a production instance**, add a domain you control DNS for. Point that domain at the Vercel project, create the Clerk production instance on it, add the `clerk` and `accounts` DNS records Clerk asks for, configure Google OAuth with your own credentials, then set `pk_live_`/`sk_live_` in Vercel. No application code changes: the frontend API proxy switches on automatically for a `pk_live_` key. Regenerate participant QR cards afterwards, because they encode the origin they were made on.

Verify either setup with `npm run verify:auth` against a local build, or `npm run verify:auth:live -- https://your-domain` against a deployment. It fails if a protected route dead-ends instead of offering sign-in.

## Payment Integration (Razorpay)

After the free flows are accepted: add server-created orders, signed payment verification, signed/idempotent captured-payment webhooks, and the one-per-Clerk-user paid entitlement. Never unlock a download from a client-side "success" event alone. A paid account can then fetch fresh CSV snapshots without paying again. No checkout button or simulated payment is included now.

Turn the download gate on or off in Vercel → Project Settings → Environment Variables, set `DOWNLOAD_PAYMENT_GATE_ENABLED` for the desired environment, save, and redeploy:

- `false`: signed-in members can download. The separate download page and networking pledge remain; all fee, payment, checkout and testing banners are hidden, including payment references on the privacy page.
- `true`: the fee explanation and checkout-availability notice return. The server rejects downloads for accounts without a paid entitlement; paid accounts can download newer snapshots without paying again. Profile browsing and printable QR cards remain available to signed-in members.

The setting is server-only. Missing values default to off. It replaces `EXPORT_TEST_MODE`, which is no longer used; remove the old variable from Vercel. Turning the gate on does not connect Razorpay: until that integration is added, unpaid accounts see the availability notice and cannot download.

`npm run test:integration` starts temporary production servers in both modes after a build, verifies unpaid/pending/paid access and private card generation, then removes its disposable development fixtures and stops those servers.

## Customization

This codebase is designed to be forked and adapted:

1. **Branding**: Update colors in `src/app/globals.css`
2. **Fields**: Modify profile schema in `src/lib/core.ts`
3. **Event Name**: Replace "Eureka 26" references throughout
4. **Domain**: Update Clerk and Vercel configurations for your domain

## Architecture

- **Authentication**: Clerk middleware protects routes, server components verify sessions
- **Data Access**: Server-only API routes use Supabase service role key
- **Storage**: Private photos served via authenticated API routes
- **QR Cards**: Server-rendered with Sharp, embedded QR codes point to stable profile URLs
- **Export**: CSV generated server-side with formula-injection escaping

## Database Schema

The app uses Supabase PostgreSQL with Row Level Security (RLS). Tables:

- `profiles`: Participant profiles (UUID-keyed, Clerk user ID indexed)
- `purchases`: Payment entitlements for CSV downloads
- `founder-photos`: Private storage bucket (3MB limit per file)

All data operations are server-side authenticated. Anonymous reads are blocked by RLS policies.

Migration: `supabase/migrations/202609160001_directory.sql`

## Boundaries

No official Eureka participant verification, message sending, CRM sync, team accounts, or payment collection. A shared download is a full copy, and neither login nor a fee prevents recipients from redistributing it. Account deletion in Clerk is separate from published-profile removal; remove the profile first. This implementation is sized for a zonal participant community; the directory loads all published profiles and should move to server-side search/pagination if the community grows substantially.

## License

MIT License - see [LICENSE](./LICENSE) for details.

This is open-source software. You're free to use, modify, and distribute it for any purpose, commercial or non-commercial.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Security

- Never commit `.env` files or API keys
- All `.env*` files (except `.env.example`) are gitignored
- Server keys are never exposed to the browser
- Database uses RLS with server-only service role access
- Photos are stored in private buckets

Found a security issue? Please report it privately to the repository maintainer.

## Support

- **Documentation**: See [PLAN.md](./PLAN.md), [GATES.md](./GATES.md), [QA-EVIDENCE.md](./QA-EVIDENCE.md)
- **Issues**: Open a GitHub issue
- **Questions**: Start a GitHub discussion

## Acknowledgments

Built with Next.js, Clerk, Supabase, and deployed on Vercel. Originally created for Eureka 2026 participant networking.
