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
- PostgreSQL backup/restore scripts with R2 upload and staging/test restore validated (Phase 8c complete)
- Docker Compose restart: always policy (Phase 8d)
- Structured logs with Pino (Phase 8e — logger, HTTP middleware, LOG_LEVEL)
- Monitoring and alerting validated with Better Stack, Healthchecks.io, and Coolify Scheduled Task (Phase 8f)
- Commercial demo audit and runbook documented (Phase 9a/9b)

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

## Current Operational State

The previously documented Prisma P3009 signal is obsolete for the current API container database state.

Manual verification in the Coolify `/app` container confirmed:

- `DATABASE_URL` is present.
- `npx prisma migrate status` sees database `paris_local`, schema `public`.
- 7 migrations are detected.
- Result: `Database schema is up to date!`
- No Prisma correction is needed now.

Phase 8c backup/restore validation is complete:

- R2 backup bucket `paris-local-backups` is accessible.
- Test backup uploaded successfully with `BACKUP_PREFIX=backups/postgres/test`.
- Backup used for restore: `backup_2026-05-31_07-43-00.sql.gz`.
- Restore completed successfully in a separate Coolify PostgreSQL staging/test database.
- Restore verification found 14 restored tables, including `_prisma_migrations`, `hotels`, `guests`, `stays`, `messages`, `service_requests`, and `reviews`.
- Counts verified after restore: hotels 5, guests 27, stays 25, messages 36, service_requests 53, reviews 17.
- `npx prisma migrate status` after restore: `Database schema is up to date!`
- Production was not touched.

Phase 8f-1 monitoring documentation is now defined:

- HTTP monitoring targets: main site, `/health`, `/ready`, a guest app example,
  and the recommended reception subdomain.
- `/health` means the API process is alive.
- `/ready` means the API and PostgreSQL are available; HTTP 503 must alert.
- Recommended tools: Better Stack Free or Uptime Kuma for HTTP checks, and
  Healthchecks.io, Better Stack Heartbeat, or an Uptime Kuma push monitor for the
  backup cron.
- Backup cron alerting is still to be implemented outside Git without committing
  secret ping URLs.
- Incident runbooks are documented in `docs/DEPLOYMENT.md`.

Phase 8f-5 monitoring validation is complete:

- Better Stack HTTP monitors are active:
  - ParisLocalStack — Guest Vendôme
  - ParisLocalStack — API Ready DB
  - ParisLocalStack — API Health
  - Paris Local Stack Super Admin
- Healthchecks.io is configured for `ParisLocalStack — PostgreSQL Backup R2`.
- `BACKUP_HEALTHCHECK_URL` is present in Coolify API only; no ping URL is stored in Git.
- `scripts/backup-postgres.sh` sends `/start`, `/fail`, and success pings.
- Coolify Scheduled Task `postgres-backup-daily` executed successfully with:
  `BACKUP_PREFIX=backups/postgres/prod BACKUP_RETENTION_DAYS=7 bash /app/scripts/backup-postgres.sh`
- Production backup confirmed in R2:
  `paris-local-backups/backups/postgres/prod/backup_2026-05-31_13-47-22.sql.gz`
- Healthchecks.io received Started and OK.
- The automatic cycle `backup -> R2 -> heartbeat -> potential alert` is validated.
- Production was not restored.
- Restore staging/test was already validated previously.

Phase 9a/9b commercial demo preparation is documented:

- Phase 9a audit identified a controlled demo path: Guest App -> Reception live -> Hotel Admin -> CRM/RGPD.
- Phase 9b created `docs/DEMO_COMMERCIALE.md`.
- Demo client surfaces to show: Guest App, Reception, Hotel Admin.
- Demo client surfaces to avoid: Super Admin, Generator, infrastructure, logs, backups, GitHub, Coolify, Prisma, R2, code, and credentials.
- Demo data must be fictive or explicitly validated; no real personal data should be shown without approval.
- Demo credentials, monitoring URLs, webhooks, tokens, and environment values must stay out of Git.

Next possible phase after decision:

- Create a neutral demo tenant with clean fictive data.
- Phase 10 — Design System / Templates.

Safe approach going forward:

- Do not use `prisma db push --accept-data-loss`.
- Do not reset or delete production data.
- Do not propose `migrate resolve` unless a new real Prisma failure is confirmed.
- Never restore on production.
- Never commit webhook, heartbeat, or ping URLs containing secrets.

## Hard Rules

- Do not create one app per hotel.
- Do not break multi-tenant isolation.
- Do not expose private CRM data publicly.
- Do not rely on frontend filtering for security.
- Do not modify Prisma unless necessary.
- Do not make broad refactors without explicit approval.
- Do not change Coolify/domain logic unless the task specifically requires it.
- Always preserve Guest App, Reception Dashboard, Super Admin, and Generator flows.
