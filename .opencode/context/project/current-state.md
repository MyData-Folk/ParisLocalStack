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
- Configurable Guest App cards (Vague 5): model, API plan, Super Admin plan UI, Hotel Admin guest-cards editor, public settings exposure, isolated display components, GuestShell wiring with strict legacy fallback (PR #81 → PR #89)
- Configurable hotel services (Vague 6): shared service schemas, private services API, Super Admin attribution, Hotel Admin personalization, public settings exposure, `useEnabledServices`, and GuestShell dynamic rendering with strict legacy fallback (PR #91 → PR #97)
- PostgreSQL backup/restore scripts with R2 upload and staging/test restore validated (Phase 8c complete)
- Docker Compose restart: always policy (Phase 8d)
- Structured logs with Pino (Phase 8e — logger, HTTP middleware, LOG_LEVEL)
- Monitoring and alerting validated with Better Stack, Healthchecks.io, and Coolify Scheduled Task (Phase 8f)
- Commercial demo audit and runbook documented (Phase 9a/9b)
- **Isolated Coolify demo clone (COOLIFY-DEMO-1)**: separate PostgreSQL database `paris-local-postgres-demo` (UUID `xa4milhem5vfe1s9bwnue9dx`), dedicated API clone `https://api-demo.hotelmanager.fr` and Web clone `https://demo.hotelmanager.fr`, distinct `JWT_SECRET`, `CORS_ORIGIN`, `WEB_URL`, `VITE_API_URL`. Isolation proved by `clone /vendome=404` vs `prod /vendome=200`. See `docs/COOLIFY_DEMO_ISOLATION.md`.
- **Demo seed one-off endpoint (COOLIFY-DEMO-2, PR #100)**: `POST /api/admin/seed-demo` protected by `SEED_DEMO_ENABLED` flag + `X-Seed-Secret` header (timing-safe) + soft env check. Seed of `demo-paris-local` (Hôtel Lumière Demo Paris) executed only against the demo DB. Endpoint disabled (`SEED_DEMO_ENABLED=false`) and verified 403 after use. **Cleanup done in PR #101** (commit `9f4875c`): handler `apps/api/src/modules/admin/seedDemo.ts` removed from source, route removed from `app.ts`, env vars `SEED_DEMO_*` removed from API clone via CLEANUP-DEMO-2.
- **Demo clone cleanup (COOLIFY-DEMO-3 + COOLIFY-DEMO-4)**: removed `demo-vendome.welcomeparis.hotelmanager.fr` and `demo-admin.vendome.welcomeparis.hotelmanager.fr` (COOLIFY-DEMO-3) and then removed the root `https://demo.hotelmanager.fr/` (COOLIFY-DEMO-4) from the Web clone FQDNs — all three were causing 404 console errors because the frontend deduced slugs that didn't exist in the demo DB. Removed duplicate `SEED_DEMO_ENABLED` and `SEED_DEMO_SECRET` env vars on the API clone (COOLIFY-DEMO-3). **Only canonical FQDNs remain on the Web clone**: `https://demo-paris-local.welcomeparis.hotelmanager.fr` (Guest) and `https://admin-demo-paris-local.welcomeparis.hotelmanager.fr` (Reception). Opening either URL directly deduces the correct slug via `tenant.ts`. No more 404 console errors. Fallback path-based URL removed in COOLIFY-DEMO-4.

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

- The neutral demo tenant has been validated locally for Phase 9E: `demo-paris-local` / Hôtel Lumière Demo Paris, fictive data only, Guest App OK, Reception post-auth OK, Hotel Admin post-auth OK.
- Public demo URLs are not validated as staging: the Guest App URL returns HTTP 200 with `Hotel not found`, and the admin/reception URL returns HTTP 200 with a generic login. Dedicated staging DB/API/Web, access protection, and absence of real data remain unverified.
- Next step is Coolify/environment clarification before any non-local seed, deploy, migration, reset, or db push.
- `DEPLOIEMENT.md` now defines the mandatory staging validation checklist before any non-local demo seed, migration, or deploy.
- Guest App card configuration is complete locally through Vague 5F: PR #81 added `guestCards` and `commercialPackage`; PR #82 added the commercial plan API; PR #84 added Super Admin plan editing and Hotel Admin read-only plan display; PR #85 added private guest-cards endpoints; PR #86 added the Hotel Admin guest cards editor; PR #87/#88/#89 exposed and rendered active cards with a strict legacy fallback.
- Hotel Admin can configure card image, title, description, action, target, order, and enabled state within plan limits. Super Admin remains responsible for the commercial package.
- Configurable hotel services are complete locally through Vague 6F: Super Admin attributes services, Hotel Admin customizes authorized services, public settings exposes active services safely, and GuestShell renders active services with fallback legacy. Local validation confirmed health/ready/web OK, fallback OK, Taxi and Room service dynamic services OK, disabled services hidden, mobile 375px OK, audit UI 6/6, typecheck/build/diff OK.
- Public/staging validation is still missing for guest cards and configurable hotel services. Do not treat local validation as proof that the public demo URLs are isolated or ready.
- Phase 10 — Design System / Templates.

Safe approach going forward:

- Do not use `prisma db push --accept-data-loss`.
- Do not reset or delete production data.
- Do not propose `migrate resolve` unless a new real Prisma failure is confirmed.
- Never restore on production.
- Never commit webhook, heartbeat, or ping URLs containing secrets.
- Never use production as staging. Never run the demo seed outside local until a dedicated staging database, rollback, and access protection are confirmed.
- Complete the staging validation checklist before touching any non-local environment for `demo-paris-local`.

## Hard Rules

- Do not create one app per hotel.
- Do not break multi-tenant isolation.
- Do not expose private CRM data publicly.
- Do not rely on frontend filtering for security.
- Do not modify Prisma unless necessary.
- Do not make broad refactors without explicit approval.
- Do not change Coolify/domain logic unless the task specifically requires it.
- Always preserve Guest App, Reception Dashboard, Super Admin, and Generator flows.

## Phase 9d - Product Strategy / Roadmap

Phase 9d is documented in `docs/PRODUCT_STRATEGY.md`.

The product strategy now frames:

- priority target: independent 3-star hotels, boutique hotels, small independent 4-star hotels, and aparthotels;
- recommended launch package: Boutique;
- commercial packages: Starter, Boutique, Premium, Palace;
- P1/P2/P3 module priorities;
- priority structured service forms;
- target Reception Dashboard vision;
- CRM/RGPD rules;
- local recommendations strategy;
- what not to build now.

Current priority is to keep the commercial demo focused on the validated local neutral tenant, clarify the public/staging environment, and prepare the priority service forms. Do not start PMS integrations, advanced AI, native apps, or Palace modules now.

## Security Rotation Cycle (in progress)

A new cycle of secret rotation was launched on 2026-06-06 to clean up historically compromised secrets. Master document : `SECURITY_ROTATION.md` (root).

Phases completed and validated :
- Phase 1 (audit) : 6 secret categories identified, 2 user accounts vulnerable.
- Phase 2A : PostgreSQL prod password rotated via terminal UI Coolify, new DATABASE_URL applied manually, redéploiement manuel OK.
- Phase 2B : JWT_SECRET prod rotated (64 chars base64url) via MCP, redéploiement manuel OK.
- Phase 2C : user passwords audit.
- Phase 2C-A (2026-06-07) : `reception@vendome.test` password rotated (43 chars base64url) via PATCH endpoint, all post-rotation tests pass, API clone intact.

Phases planned or blocked :
- Phase 2C-B : `admin@paris-local.test` rotation BLOCKED by construction (PATCH endpoint refuses super_admin, line 99-101 of `apps/api/src/modules/hotels/routes.ts`). User decision required : (a) temporary PR, (b) direct SQL via terminal UI Coolify, (c) other.
- Phase 3 : R2/S3 tokens rotation (planned).
- Phase 4 : Coolify token regeneration (planned, non-blocking — current token lacks `deploy` permission).
- Phase 5 : demo accounts password rotation (planned, non-blocking — isolated in demo DB).
