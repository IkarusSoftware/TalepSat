# Production Checklist

This project can run with SQLite in local development, but production should use PostgreSQL.

## 1. Required Environment Variables

### Web (`apps/web/.env`)
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `MEDIA_PUBLIC_BASE_URL`
- `AUTH_SECRET`
- `CRON_SECRET`
- `EXPO_ACCESS_TOKEN` if mobile push delivery will be used
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`
- `IYZICO_BASE_URL`
- `IYZICO_CALLBACK_URL`
- `IYZICO_MERCHANT_ID` if webhook signature verification is enabled
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only if Google sign-in will be used

### Mobile (`apps/mobile/.env`)
- `EXPO_PUBLIC_API_URL`

## 2. Configuration That Lives In The Admin Panel

These values are not meant to be stored as deploy-time env vars:
- SMTP host, port, user, password
- sender email and sender name
- reply-to address
- site URL and site name

After first deploy:
1. Sign in as admin.
2. Open Admin > Ayarlar > SMTP ve E-posta.
3. Save SMTP settings.
4. Send a test email.

## 3. Pre-Deploy Verification

Run these commands from the repo root:

```powershell
pnpm install
pnpm type-check
pnpm test
pnpm --dir apps/web exec prisma generate
```

If you are deploying PostgreSQL schema changes for the first time, also run the migration workflow described in `docs/POSTGRES_MIGRATION_PLAN.md`.

## 4. Database

Recommended production setup:
- PostgreSQL for the main application database
- regular backups enabled by the hosting provider
- SSL required on the connection string

Do not use `apps/web/dev.db` in production.

## 5. Media / Uploads

The app supports legacy relative paths such as `/uploads/...` and normalizes them at runtime.

Production requirements:
- `MEDIA_PUBLIC_BASE_URL` must point to the public app origin
- uploaded files should be reachable from that public origin
- if you have old relative media records, run:

```powershell
pnpm --dir apps/web media:normalize
```

Use a fully public base URL before running the normalization script.

## 6. Realtime And Scale Notes

Current realtime and abuse protection are process-local:
- SSE subscriptions
- event bus
- in-memory rate limiting

This is acceptable for a single-instance deployment.

If you plan to run multiple instances, move these concerns to shared infrastructure:
- Redis or another shared pub/sub for realtime
- Redis or another shared store for rate limiting

## 7. Billing And Payments

Billing depends on Iyzico configuration.

Before enabling real checkout:
1. Fill `IYZICO_*` env vars.
2. Verify that user profiles collect phone, city, and tax number.
3. Open pricing and subscription pages in production and confirm checkout is not in review mode.
4. Test cancel, resume, and webhook flows in a sandbox or controlled account.

## 8. Push Notifications

Push delivery depends on:
- `EXPO_ACCESS_TOKEN`
- saved device tokens from mobile clients
- user preference `pushNotificationsEnabled`

Before launch:
1. Build a development build or production mobile build.
2. Register a real device.
3. Verify message, offer, and order pushes.
4. Confirm push is not sent when the user disables mobile push in settings.

## 9. Cron

The project uses the cron route:
- `/api/cron/listing-expiry-reminders`

Requirements:
- `CRON_SECRET` must be set
- scheduler must call the route once per day
- if using Vercel, `vercel.json` already contains the schedule

## 10. Security And Ops

Before go-live:
- rotate `AUTH_SECRET`
- restrict admin accounts
- verify rate limits work in the target environment
- make sure deactivated users cannot log back in
- verify backups and restore flow
- enable provider-side logs and alerts

## 11. Smoke Test Before Launch

Test these flows on the production build:
- web login and mobile login
- listing create, edit, favorite, compare
- offer create, counter offer, accept, reject, withdraw
- order completion and review
- messages with image and document attachments
- notification preferences and real email preferences
- seller dashboard for free, basic, plus, and pro
- billing checkout, cancel, resume, and webhook processing
