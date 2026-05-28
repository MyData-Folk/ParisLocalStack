# Coding Standards — ParisLocalStack

## General Principles

- Favor small, focused changes over large refactors.
- Preserve existing user flows unless the task explicitly requires changing them.
- Never break the guest onboarding, reception dashboard, Super Admin, Generator, routing, or multi-tenant isolation.
- Security and data isolation are more important than UI polish.
- A new hotel must be created through data/configuration, not new app code.

## TypeScript

- Use strict TypeScript wherever possible.
- Avoid `any` unless working around legacy code; prefer typed DTOs and shared schemas.
- Use explicit return types for utility functions and backend helpers.
- Keep API request/response shapes aligned with shared Zod schemas when possible.
- Do not silently ignore errors.

## React

- Use functional components and hooks.
- Keep components focused and readable.
- Avoid monolithic components when adding significant logic.
- Do not duplicate Guest App and Reception UI logic.
- Keep the Guest App visually distinct from Admin/Reception surfaces.
- Use controlled forms for important business actions.
- Preserve localStorage compatibility for existing guest sessions unless a migration is provided.

## Tailwind / UI

- Use Tailwind CSS as the primary styling method.
- Avoid large global CSS additions unless necessary.
- Keep dashboards professional, dense, and readable.
- Keep Guest App mobile-first, premium, and hotel-branded.
- Use accessible color contrasts and visible focus states.
- Icon-only buttons must have `aria-label`.
- Avoid decorative complexity that hurts usability.

## Backend

- All protected routes must require `authenticate`.
- Hotel-scoped routes must use `requireHotelAccess` or an equivalent explicit check.
- Single-resource mutation routes must load the resource, verify hotel access, then mutate.
- Public routes must resolve hotel context from `hotelSlug`.
- Public routes must validate guest/stay scope before creating messages, requests, reviews, or analytics events.
- Public routes must not return private CRM fields.

## Prisma / Database

- Use Prisma migrations for schema changes.
- Never use `prisma db push --accept-data-loss` in production.
- If changing `schema.prisma`, create a clear migration.
- Keep `hotelId` indexed on tenant-scoped tables.
- Avoid destructive migrations unless explicitly approved.
- Do not delete guest, stay, message, request, or review history for normal archival flows.

## Multi-Tenant Rules

Every route and query must respect tenant isolation.

Required rules:

- `super_admin` can access all hotels.
- `hotel_admin` can access only assigned hotels.
- `receptionist` can access only assigned hotels.
- Guests can access only their own session context.
- No hotel can see another hotel’s guests, stays, messages, requests, reviews, files, analytics, or CRM data.

## Socket.IO

- Do not allow unauthenticated clients to join arbitrary hotel rooms.
- Staff sockets must authenticate with JWT.
- Guest sockets must validate `hotelId`, `guestId`, and `stayId`.
- Use separate rooms for staff and guests.
- Never rely on frontend filtering as the only security barrier.

Recommended room structure:

```txt
hotel:{hotelId}:staff
hotel:{hotelId}:guest:{guestId}
```

## Validation

- Use Zod schemas for input validation.
- Dates must be validated before converting to `Date`.
- Invalid dates must return `400 Bad Request`, not `500`.
- For stays, `checkoutDate` must not be earlier than `checkinDate`.
- Sanitize and limit user-provided strings where relevant.

## Error Handling

- Use existing `asyncHandler` patterns.
- Return clear API errors without leaking sensitive data.
- Authorization failures should return `403`.
- Missing or invalid tokens should return `401`.
- Missing resources should return `404`.

## Environment / Production Safety

Production API must not start if:

- `DATABASE_URL` is missing.
- `JWT_SECRET` is missing.
- `JWT_SECRET` is weak or known fallback.
- Required production storage configuration is missing when upload provider is set to S3.

Do not run seed scripts automatically at boot in production.

## Git / Workflow

Before committing:

```bash
npm run prisma:generate
npm run build --workspace @paris-local/api
npm run typecheck --workspace @paris-local/web
npm run build --workspace @paris-local/web
```

Commit messages should be clear and scoped.

Examples:

```txt
Harden realtime socket authorization
Add structured taxi request details
Improve reception CRM table filters
Add hotel recommendations management
```

## What Not To Do

- Do not refactor the whole project without a specific reason.
- Do not create separate apps per hotel.
- Do not expose private CRM data publicly.
- Do not remove legacy routing without checking production impact.
- Do not break existing hotel subdomains.
- Do not add heavy dependencies unless necessary.
- Do not solve security in the frontend only.
