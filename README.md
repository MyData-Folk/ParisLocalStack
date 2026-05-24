# Paris Local / Digital Hotel Concierge

Base SaaS B2B multi-tenant pour concierge digital hotelier.

## Architecture

- `apps/web`: React, TypeScript, Vite, Tailwind, React Router.
- `apps/api`: Node.js, Express, TypeScript, Prisma, JWT, Socket.IO.
- `packages/shared`: validations Zod et contrats partages.
- `prisma`: schema PostgreSQL central multi-tenant et seed demo.

Chaque table metier porte `hotel_id`. Les routes dashboard passent par `requireHotelAccess`; les routes publiques resolvent l'hotel depuis `hotelSlug`.

## Demarrage local

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
npm run dev:api
npm run dev:web
```

Comptes seed:

- `admin@paris-local.test` / `ChangeMe123!`
- `reception@vendome.test` / `ChangeMe123!`

Routes utiles:

- Client QR: `http://localhost:5173/h/vendome/welcome`
- Reception: `http://localhost:5173/reception`
- Admin principal: `http://localhost:5173/admin`
- Generateur: `http://localhost:5173/generator`

## Domaines Coolify

Configurer le meme frontend pour:

- `hotel-slug.welcomeparis.hotelmanager.fr`
- `admin.hotel-slug.welcomeparis.hotelmanager.fr`

Le frontend extrait automatiquement le slug depuis le hostname. Exemple: `vendome.welcomeparis.hotelmanager.fr` donne `vendome`.

## Docker

```bash
docker compose up -d
```

Sur Coolify:

1. Creer un service PostgreSQL.
2. Creer l'app API depuis `Dockerfile.api`.
3. Creer l'app web depuis `Dockerfile.web`.
4. Renseigner `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `WEB_URL`, `VITE_API_URL`.
5. Lancer les migrations Prisma dans la console API: `npm run prisma:migrate && npm run prisma:seed`.

## Storage

MVP local: `UPLOAD_PROVIDER=local`, fichiers servis par `/uploads`.

Production S3 compatible: reserver `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`. Le module est pret a etendre le provider sans changer les routes.
