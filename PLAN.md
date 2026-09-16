# Build plan

Execute sequentially in a single context: foundation/authentication, Supabase schema and server data boundary, participant interface, behavioral/browser verification, repository handoff.

One profile per Clerk account; company names may repeat. All personal data and photos require authentication. UUID profile links remain stable when editing. Server routes verify Clerk sessions and use Supabase server credentials, avoiding a separate Supabase login. Consent is required before publishing. No seeded people in the live directory. Payment is deliberately deferred; free testing mode is server-configured and clearly labeled. CSV snapshots are regenerated on every download. A purchases table reserves a per-account entitlement for the later Razorpay phase.

Use Next.js App Router, TypeScript, plain CSS, Supabase, Clerk, npm. No deployment in this task. Never print or commit credentials.
