# Ticket 01 — Production Hardening: Socket.IO, DATABASE_URL, Settings Permissions

You are working on ParisLocalStack, a multi-tenant hotel SaaS platform.

Read all files under `.opencode/context/project/` before making changes.

## Objective

Fix the critical production-safety issues without changing product UI or adding new features.

Scope:

1. Secure Socket.IO rooms.
2. Block API boot in production if DATABASE_URL is missing.
3. Restrict PATCH hotel settings to super_admin and hotel_admin only.

## Hard Constraints

- Do not refactor the whole project.
- Do not change Prisma unless absolutely necessary.
- Do not touch Coolify/domain logic.
- Do not alter Guest App, Reception Dashboard, Super Admin, or Generator flows except where needed for Socket.IO auth.
- Do not reintroduce `prisma db push --accept-data-loss`.
- Do not expose private CRM fields publicly.

## Required Changes

### 1. Backend config

In `apps/api/src/config.ts`:

- Keep JWT_SECRET required and strong in production.
- Add production blocking if `DATABASE_URL` is missing or empty.
- In development, warnings are acceptable.

### 2. Socket.IO server

In `apps/api/src/socket.ts`:

Replace the insecure arbitrary room join model:

```txt
hotel:join(hotelId) → hotel:{hotelId}
```

with secure room handling:

```txt
hotel:{hotelId}:staff
hotel:{hotelId}:guest:{guestId}
```

Staff socket:

- Must authenticate with JWT.
- Must load user from DB.
- Must verify user status is active.
- Must verify hotel access.
- Then join `hotel:{hotelId}:staff`.

Guest socket:

- Must provide `hotelId`, `guestId`, and `stayId`.
- Must validate that the stay belongs to the guest and hotel.
- Then join `hotel:{hotelId}:guest:{guestId}`.

Never allow a public client to join an arbitrary global hotel room.

### 3. Backend emissions

Update message/request/review route emissions so that:

- New guest message → staff room only.
- Reception reply → staff room and specific guest room.
- Message status → staff room and specific guest room when possible.
- New service request → staff room only.
- Request status → staff room and specific guest room when possible.
- New review → staff room only.
- Review status → staff room and guest room only if a guestId exists.

### 4. Frontend socket client

Update frontend socket helper so it can connect with either:

- Staff auth: JWT token and hotelId.
- Guest auth: hotelId, guestId, stayId.

Preserve existing guest localStorage sessions if possible.

### 5. Hotel settings permissions

In settings routes:

- GET settings remains accessible to authenticated hotel users with hotel access.
- PATCH settings must require `super_admin` or `hotel_admin`.
- Receptionists must receive 403 when trying to patch settings.

## Tests Required

Run:

```bash
npm run build --workspace @paris-local/api
npm run typecheck --workspace @paris-local/web
npm run build --workspace @paris-local/web
```

Manual checks:

- Reception login still works.
- Guest app still works.
- Guest sends message → Reception receives realtime event.
- Reception replies → Guest receives realtime event.
- Guest creates request → Reception receives realtime event.
- Request status update → Guest receives realtime event.
- Receptionist cannot PATCH hotel settings.
- Hotel admin or super_admin can PATCH hotel settings.
- API refuses to start in production without DATABASE_URL.

## Deliverable

Make the smallest safe code changes and summarize:

- files changed,
- exact Socket.IO room model implemented,
- tests run,
- risks remaining.
