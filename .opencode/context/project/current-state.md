# Current State — ParisLocalStack

## Product Status

ParisLocalStack is no longer a prototype. It is a functional multi-tenant hotel SaaS MVP.

Current maturity estimate:

- MVP functional: 93–96%
- Production-ready: ~70%
- Commercial-ready: ~65%

The project has working foundations for:

- Guest App
- Reception Dashboard
- Super Admin
- Generator
- Multi-tenant PostgreSQL database
- Prisma schema
- JWT auth
- Hotel onboarding
- Guest onboarding
- CRM fields
- Present guests / history separation
- Guest profile / stay timeline
- Service requests
- Reviews
- Recommendations
- Guest themes
- Hotel Admin space (8 routes live: 7 Phase 6b + 1 Phase 7b CRM)
- CRM client export (Excel + JSON)
- Shared export helpers (apps/web/src/lib/export.ts)
- Docker/Coolify deployment
- API readiness + requestId tracing (Phase 8b)
- PostgreSQL backup/restore scripts with R2 upload (Phase 8c)
- Docker Compose restart: always policy (Phase 8d)

## Critical Current Priorities

Do not start large UI rewrites before these production hardening tasks are complete.

Priority 1:

- Secure Socket.IO rooms.
- Separate staff and guest realtime channels.
- Do not allow arbitrary `hotel:join(hotelId)`.
- Staff must authenticate with JWT.
- Guests must be validated with hotelId + guestId + stayId.
- Never broadcast guest messages to a room that all guests can join.

Priority 2:

- Block API boot in production if DATABASE_URL is missing.
- JWT_SECRET must remain required and strong in production.

Priority 3:

- Restrict PATCH hotel settings to super_admin and hotel_admin only.
- Receptionists may read settings but must not modify them.

Priority 4:

- Keep Prisma migrate deploy.
- Never reintroduce prisma db push --accept-data-loss in production.

Priority 5:

- Prepare production storage using S3/R2 later.
- Local uploads are acceptable only for MVP/dev.

## Product Priorities After Hardening

After security fixes:

1. Complete structured service request forms:
   - taxi date/time/destination/airport/passengers/luggage
   - restaurant date/time/people/cuisine/budget/constraints
   - room service details
   - linen requests

2. Improve Reception display of structured request details.

3. Build Recommendation management:
   - add/edit/disable/order/feature recommendations
   - categories
   - image
   - tags
   - future Google Maps/RATP integrations

4. Build Hotel Admin ✅ (completed — Phase 6 + Phase 7b, 8 routes live):
   - hotel profile, settings, recommendations, QR, modules, analytics, CRM export

5. Add CRM export and segmentation ✅ (Phase 7a/7b/7c completed).

6. Add monitoring, backups, storage, and production documentation.

## Current Known Deployment Issue

A Coolify deployment failed because Prisma reported error P3009: a failed migration named `20260524230000_init` exists in the production database. The API container reaches PostgreSQL and starts `prisma migrate deploy`, but Prisma blocks new migrations until the failed migration is resolved in `_prisma_migrations`.

Safe approach:

- Do not use `prisma db push --accept-data-loss`.
- Do not reset or delete production data.
- Run `npx prisma migrate status` against the production database.
- If the schema already matches the failed init migration, use `npx prisma migrate resolve --applied 20260524230000_init`.
- If the migration truly did not apply, use `--rolled-back`, then re-run `npx prisma migrate deploy`.
- Prefer checking migration status/output before choosing applied vs rolled-back.

## Hard Rules

- Do not create one app per hotel.
- Do not break multi-tenant isolation.
- Do not expose private CRM data publicly.
- Do not rely on frontend filtering for security.
- Do not modify Prisma unless necessary.
- Do not make broad refactors without explicit approval.
- Do not change Coolify/domain logic unless the task specifically requires it.
- Always preserve Guest App, Reception Dashboard, Super Admin, and Generator flows.
