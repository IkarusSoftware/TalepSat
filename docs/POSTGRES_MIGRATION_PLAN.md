# SQLite To PostgreSQL Migration Plan

This repo already supports both SQLite and PostgreSQL through Prisma config. The safest path is:
- keep SQLite for local development
- use PostgreSQL in production
- migrate data once before the production cutover

## 1. Prepare PostgreSQL

Create a managed PostgreSQL database and collect:
- `DATABASE_URL`
- `DIRECT_URL`

The URLs should include SSL.

## 2. Set Environment Variables

In `apps/web/.env` or your deployment platform:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

## 3. Generate Prisma Client

```powershell
pnpm --dir apps/web exec prisma generate
```

## 4. Create The PostgreSQL Schema

For a first deployment:

```powershell
pnpm --dir apps/web exec prisma db push
```

If you later move to a stricter migration workflow, switch to `prisma migrate deploy`.

## 5. Export Data From SQLite

The current local database file is:
- `apps/web/dev.db`

At minimum, export these tables:
- `User`
- `Listing`
- `Offer`
- `Review`
- `Conversation`
- `Message`
- `Notification`
- `Favorite`
- `Plan`
- `SiteSetting`
- `PushDevice`
- `UserSubscription`
- `BillingEvent`

Use a one-time data copy script or Prisma-based importer. Keep IDs unchanged so relations stay intact.

## 6. Import Data Into PostgreSQL

Recommended approach:
1. Put the app into maintenance mode.
2. Stop writes against SQLite.
3. Read all rows from SQLite.
4. Insert them into PostgreSQL in dependency order.
5. Verify counts per table.
6. Point the app to PostgreSQL.

Suggested dependency order:
1. `Plan`
2. `SiteSetting`
3. `User`
4. `Listing`
5. `Favorite`
6. `Offer`
7. `Conversation`
8. `Message`
9. `Notification`
10. `Review`
11. `PushDevice`
12. `UserSubscription`
13. `BillingEvent`

## 7. Post-Migration Verification

After switching the app to PostgreSQL, verify:
- login works for web and mobile
- listings load correctly
- offer counts and order states match SQLite counts
- conversation lists and messages match
- seller analytics still compute correctly
- billing snapshots resolve the expected current plan
- media URLs still render correctly

## 8. Media Follow-Up

If old rows still contain relative paths such as `/uploads/...`, run:

```powershell
pnpm --dir apps/web media:normalize
```

Only run this after `MEDIA_PUBLIC_BASE_URL` points to the real public host.

## 9. Rollback Plan

Before cutover:
- keep the SQLite file untouched
- take a PostgreSQL snapshot before import

If cutover fails:
1. Put the app back on SQLite.
2. Investigate the import issue.
3. Re-run the import into a fresh PostgreSQL snapshot.

## 10. Long-Term Recommendation

For production:
- use PostgreSQL only
- keep SQLite only for local development or disposable demos
- move to `prisma migrate` for versioned schema changes once the production database is stable
