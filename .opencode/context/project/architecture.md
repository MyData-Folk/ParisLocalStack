# Architecture — ParisLocalStack

## Overview

ParisLocalStack is a multi-tenant hotel SaaS platform built as a monorepo. It contains one shared frontend, one backend API, one PostgreSQL database, and multiple hotel tenants isolated by `hotel_id`.

The platform must never generate or deploy a separate React app per hotel. A new hotel is created by adding database records, hotel settings, users, recommendations, URLs, and QR codes.

## Monorepo Structure

```txt
apps/
  web/        React + TypeScript + Vite + Tailwind frontend
  api/        Express + TypeScript backend API

packages/
  shared/     shared Zod schemas, validation contracts, and types

prisma/
  schema.prisma
  migrations/
  seed.ts

docker/
  nginx and deployment-related configuration

Dockerfile.web
Dockerfile.api
docker-compose.yml
.env.example
```

## Main Applications

### Guest App

Located under:

```txt
apps/web/src/apps/guest
```

Purpose:

- Public hotel guest experience.
- Accessed through QR code or hotel subdomain.
- Mobile-first digital concierge.
- Uses hotel slug to load tenant configuration.
- Must not expose private CRM data.

Canonical URL:

```txt
https://{hotelSlug}.welcomeparis.hotelmanager.fr
```

### Reception Dashboard

Located under:

```txt
apps/web/src/apps/reception
```

Purpose:

- Operational dashboard for hotel staff.
- Manages messages, service requests, present guests, history, reviews, and CRM.
- Must always filter by hotel access.
- Uses JWT authentication.

Recommended URL:

```txt
https://admin-{hotelSlug}.welcomeparis.hotelmanager.fr
```

Legacy URL still supported:

```txt
https://admin.{hotelSlug}.welcomeparis.hotelmanager.fr
```

### Super Admin

Located under:

```txt
apps/web/src/apps/admin
```

Purpose:

- Platform-level administration.
- Manage hotels, onboarding, settings, URLs, QR codes, and future billing/monitoring.

### Generator

Located under:

```txt
apps/web/src/apps/generator
```

Purpose:

- Wizard to create and configure hotels.
- Creates hotel records, settings, branding, URLs, and QR codes.
- Must not create new app code per hotel.

## Backend Architecture

Located under:

```txt
apps/api/src
```

Typical structure:

```txt
config.ts
server.ts
socket.ts

database/
  prisma.ts
  seedProduction.ts

middleware/
  auth.ts
  validate.ts

modules/
  auth/
  hotels/
  guests/
  stays/
  messages/
  requests/
  reviews/
  recommendations/
  settings/
  storage/
  analytics/

utils/
  asyncHandler.ts
  http.ts
  publicSelects.ts
  tenantScope.ts
```

## Database Model

The database is PostgreSQL managed with Prisma.

Core models:

- `User`
- `Hotel`
- `HotelUser`
- `Guest`
- `Stay`
- `Message`
- `ServiceRequest`
- `Review`
- `Recommendation`
- `HotelSettings`
- `AnalyticsEvent`
- `Deployment`
- `File`

## Multi-Tenant Rules

All business data must be scoped by `hotelId`.

Rules:

- `super_admin` can access all hotels.
- `hotel_admin` can access only hotels linked through `hotel_users`.
- `receptionist` can access only hotels linked through `hotel_users`.
- Public guest routes resolve tenant context from `hotelSlug`.
- Public routes must not expose private CRM data.
- Private routes must require JWT authentication.
- Hotel-scoped private routes must use `requireHotelAccess`.

## Routing Rules

Root platform:

```txt
https://welcomeparis.hotelmanager.fr
```

API:

```txt
https://api.welcomeparis.hotelmanager.fr
```

Guest app:

```txt
https://{hotelSlug}.welcomeparis.hotelmanager.fr
```

Reception dashboard:

```txt
https://admin-{hotelSlug}.welcomeparis.hotelmanager.fr
```

Legacy reception dashboard:

```txt
https://admin.{hotelSlug}.welcomeparis.hotelmanager.fr
```

Old local/dev routes such as `/h/:hotelSlug/*` may exist for development but should redirect to canonical subdomains in production.

## Realtime Architecture

Socket.IO is used for realtime guest/reception workflows.

Production target:

```txt
hotel:{hotelId}:staff
hotel:{hotelId}:guest:{guestId}
```

Staff sockets must authenticate with JWT.

Guest sockets must be validated with:

```txt
hotelId + guestId + stayId
```

Never broadcast all hotel events to a public room that guest clients can join freely.

## Deployment Architecture

The platform is deployed with Docker and Coolify.

Main services:

- `paris-local-web`
- `paris-local-api`
- `paris-local-postgres`

The API container runs migrations with:

```bash
prisma migrate deploy
```

Do not use:

```bash
prisma db push --accept-data-loss
```

in production.

## Storage Architecture

Current MVP storage may use local disk uploads.

Production target:

- Cloudflare R2, Scaleway Object Storage, or MinIO.
- Local storage should be dev-only or temporary.
- Uploaded files must remain scoped by hotel.
- File type and size limits must be enforced.

## Security Priorities

- Enforce `hotelId` filtering on all private data.
- Do not expose CRM fields in public payloads.
- Secure Socket.IO rooms.
- Block production boot if `JWT_SECRET` or `DATABASE_URL` is missing.
- Restrict sensitive settings updates to `super_admin` and `hotel_admin`.
- Use migrations, not destructive schema pushes.
