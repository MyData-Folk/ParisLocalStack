# Ticket 02 — Coolify / Prisma P3009 Recovery Procedure

Use this only if deployment fails with Prisma P3009 due to a failed migration in the production database.

## Problem

Coolify API deployment may fail during `npx prisma migrate deploy` with:

```txt
Error: P3009
migrate found failed migrations in the target database
The `20260524230000_init` migration failed
```

This means Prisma found a failed migration record in `_prisma_migrations` and refuses to continue.

## Do Not Do

- Do not run `prisma db push --accept-data-loss` in production.
- Do not reset the production database.
- Do not delete `_prisma_migrations` manually.
- Do not delete customer data.

## Safe Procedure

1. Open a shell with the same production `DATABASE_URL` as the API service.
2. Run:

```bash
npx prisma migrate status
```

3. Inspect whether the failed migration actually matches the current database schema.

4. If the schema already matches and the migration should be considered applied:

```bash
npx prisma migrate resolve --applied 20260524230000_init
```

5. If the migration truly did not apply and needs to be replayed:

```bash
npx prisma migrate resolve --rolled-back 20260524230000_init
npx prisma migrate deploy
```

6. Re-run:

```bash
npx prisma migrate status
npx prisma migrate deploy
```

7. Redeploy the API service in Coolify.

## Notes

Prefer `--applied` only if the database tables and schema are already present and aligned with the init migration. Otherwise use `--rolled-back` and re-apply.
