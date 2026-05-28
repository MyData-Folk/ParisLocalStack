# Tech Stack — ParisLocalStack

## Runtime

- Node.js: 22.x
- Package manager: npm workspaces
- Module system: ESM (`"type": "module"`)

## Monorepo

Root package:

```txt
paris-local
```

Workspaces:

```txt
packages/*
apps/*
```

## Frontend

Location:

```txt
apps/web
```

Technologies:

- React: 19.2.6
- React DOM: 19.2.6
- React Router DOM: ^7.15.1
- TypeScript: 5.9.3
- Vite: 7.3.2
- Tailwind CSS: 4.1.17
- @tailwindcss/vite: 4.1.17
- Zustand: ^5.0.13
- Lucide React: ^1.16.0
- Recharts: ^3.8.1
- clsx: 2.1.1
- tailwind-merge: 3.4.0
- date-fns: ^4.3.0
- vite-plugin-singlefile: 2.3.0

Main frontend surfaces:

```txt
apps/web/src/apps/guest
apps/web/src/apps/reception
apps/web/src/apps/admin
apps/web/src/apps/generator
```

## Backend

Location:

```txt
apps/api
```

Technologies:

- Express: ^4.21.2
- TypeScript: 5.9.3
- Prisma Client: ^6.8.2
- PostgreSQL
- Socket.IO: ^4.8.1
- JSON Web Token: ^9.0.2
- bcryptjs: ^2.4.3
- Zod: ^3.25.28
- Helmet: ^8.1.0
- CORS: ^2.8.5
- express-rate-limit: ^7.5.0
- Multer: ^2.0.2
- dotenv: ^16.5.0

Main backend areas:

```txt
apps/api/src/config.ts
apps/api/src/server.ts
apps/api/src/socket.ts
apps/api/src/database
apps/api/src/middleware
apps/api/src/modules
apps/api/src/utils
```

## Shared Package

Location:

```txt
packages/shared
```

Purpose:

- Shared validation schemas.
- Shared DTO contracts.
- Zod schemas used by frontend and backend when applicable.

Build tooling:

- tsup: ^8.5.0

## Database

ORM:

- Prisma: ^6.8.2

Database:

- PostgreSQL

Schema location:

```txt
prisma/schema.prisma
```

Important models:

```txt
User
Hotel
HotelUser
Guest
Stay
Message
ServiceRequest
Review
Recommendation
HotelSettings
AnalyticsEvent
Deployment
File
```

Migration command for development:

```bash
npm run prisma:migrate
```

Production migration command:

```bash
npx prisma migrate deploy
```

Generate client:

```bash
npm run prisma:generate
```

Seed:

```bash
npm run prisma:seed
```

A future explicit production seed script may be added:

```bash
npm run seed:production
```

## Deployment

Platform:

- Coolify

Containerization:

- Docker
- Dockerfile.web
- Dockerfile.api
- docker-compose.yml

API Docker boot:

- Wait for PostgreSQL.
- Run Prisma migrations with `prisma migrate deploy`.
- Start API server.

Required production services:

```txt
paris-local-web
paris-local-api
paris-local-postgres
```

## Domains

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

Reception dashboard recommended format:

```txt
https://admin-{hotelSlug}.welcomeparis.hotelmanager.fr
```

Legacy reception dashboard format:

```txt
https://admin.{hotelSlug}.welcomeparis.hotelmanager.fr
```

## Realtime

Library:

- Socket.IO: ^4.8.1

Current target architecture:

```txt
hotel:{hotelId}:staff
hotel:{hotelId}:guest:{guestId}
```

Staff authentication:

- JWT

Guest authentication:

- Validated `hotelId + guestId + stayId`

## Storage

Current MVP:

- Local disk through Multer.

Production target:

- Cloudflare R2, Scaleway Object Storage, or MinIO.

Environment variables expected in future:

```txt
UPLOAD_PROVIDER=s3
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
```

## External Integrations Planned

Future integrations:

- Google Maps / Google Places API
- RATP / public transport API
- Email provider for invitations or CRM campaigns
- Optional SMS/WhatsApp integrations

Potential environment variables:

```txt
GOOGLE_MAPS_API_KEY=
RATP_API_KEY=
RATP_API_BASE_URL=
```

## Useful Commands

Install:

```bash
npm install
```

Dev web:

```bash
npm run dev:web
```

Dev API:

```bash
npm run dev:api
```

Build all:

```bash
npm run build
```

Build web:

```bash
npm run build:web
```

Build API:

```bash
npm run build:api
```

Typecheck:

```bash
npm run typecheck
```

Prisma generate:

```bash
npm run prisma:generate
```

Prisma migrate dev:

```bash
npm run prisma:migrate
```

Prisma seed:

```bash
npm run prisma:seed
```
