# Security Tenant Audit

Date: 2026-05-25

Scope:
- `apps/api/src/modules/hotels`
- `apps/api/src/modules/guests`
- `apps/api/src/modules/stays`
- `apps/api/src/modules/messages`
- `apps/api/src/modules/requests`
- `apps/api/src/modules/reviews`
- `apps/api/src/modules/recommendations`
- `apps/api/src/modules/settings`
- `apps/api/src/modules/analytics`
- `apps/api/src/middleware/auth.ts`

## Tenant Rules

- `super_admin` can access every hotel.
- `hotel_admin` can access only hotels attached through `hotel_users`.
- `receptionist` can access only hotels attached through `hotel_users`.
- Public routes must resolve tenant context from `hotelSlug`.
- Public routes must not allow a `guestId` or `stayId` from another hotel to be attached to the current hotel.
- No route should return another hotel's CRM, stays, messages, requests, reviews, or analytics.

## Findings

### Fixed: public cross-tenant object creation

Risk:
Public creation routes accepted `guestId` and optional `stayId` from the request body, then wrote records with the current `hotelSlug`'s `hotelId`.

Affected routes:
- `POST /api/public/:hotelSlug/stays`
- `POST /api/public/:hotelSlug/messages`
- `POST /api/public/:hotelSlug/requests`
- `POST /api/public/:hotelSlug/reviews`
- `POST /api/public/:hotelSlug/analytics`

Impact:
If an attacker knew a valid UUID from another hotel, they could attempt to associate that foreign guest or stay with the current hotel context.

Fix:
Added centralized `validateGuestStayScope(hotelId, guestId, stayId)` and enforced it before public writes.

### Verified: private hotel scoped list routes

Routes verified:
- `GET /api/hotels`
- `GET /api/hotels/:id`
- `PATCH /api/hotels/:id`
- `GET /api/hotels/:hotelId/guests`
- `GET /api/hotels/:hotelId/stays`
- `GET /api/hotels/:hotelId/messages`
- `GET /api/hotels/:hotelId/requests`
- `GET /api/hotels/:hotelId/reviews`
- `GET /api/hotels/:hotelId/settings`
- `PATCH /api/hotels/:hotelId/settings`
- `GET /api/hotels/:hotelId/analytics`
- `POST /api/hotels/:hotelId/recommendations`

Protection:
These routes require JWT authentication and use `requireHotelAccess` or super admin role checks.

### Verified: private single-resource mutation routes

Routes verified:
- `PATCH /api/stays/:id`
- `POST /api/messages/:id/reply`
- `PATCH /api/messages/:id/status`
- `PATCH /api/requests/:id/status`
- `PATCH /api/reviews/:id/status`
- `PATCH /api/recommendations/:id`
- `DELETE /api/recommendations/:id`

Protection:
These routes first load the resource, then enforce that the authenticated user can access the resource's `hotelId`.

## Manual Test Plan

Run after deployment:

1. Login as `reception@vendome.test`.
2. Confirm `GET /api/hotels/:vendomeId/guests` returns 200.
3. Confirm `GET /api/hotels/:otherHotelId/guests` returns 403.
4. Login as `admin@paris-local.test`.
5. Confirm super admin can access `GET /api/hotels/:otherHotelId/guests`.
6. Create a guest in another hotel.
7. Attempt `POST /api/public/vendome/messages` with that other hotel's `guestId`.
8. Expected result after fix: 404, no message created.

## Residual Risks

- Public guest creation remains intentionally open for the QR onboarding flow.
- Public settings expose hotel stay information intended for guests; do not add private CRM or staff-only settings to this public payload.
- Single-resource private routes still load by UUID before authorization, but they return only generic `403` after access check and do not send the resource body.

