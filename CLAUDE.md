# CLAUDE.md - Mémoire Projet

## 1. Vue d'ensemble

Paris Local / Digital Hotel Concierge est une plateforme SaaS B2B multi-tenant destinée aux hôtels. Le produit permet à chaque établissement de proposer une application client accessible par QR code et un dashboard réception synchronisé avec une API commune et une base PostgreSQL centrale.

Objectif produit :
- offrir au client hôtel une expérience de concierge digital premium ;
- permettre à la réception de gérer messages, demandes, avis, clients présents, historique CRM et médias ;
- permettre au Super Admin de créer et configurer de nouveaux hôtels sans générer une nouvelle application ;
- conserver une architecture auto-hébergée, déployable sur VPS via Coolify.

Principe fondamental :
- une seule application web React ;
- une seule API Node/Express ;
- une seule base PostgreSQL ;
- N hôtels isolés par `hotel_id` et résolus par `hotelSlug`.

Projet GitHub :
- Repo : `MyData-Folk/ParisLocalStack`
- Dossier local : `C:\Users\Farouk\Documents\STACK PARIS LOCAL`
- Branche principale : `main`

Déploiement Coolify connu :
- Projet : `ParisLocalStack`
- Web : `paris-local-web` / UUID `gukenjn38rxuj9n7sn5g43ey`
- API : `paris-local-api` / UUID `m2rfu2ypdlq07jylh59e8oh6`
- PostgreSQL : `paris-local-postgres` / UUID `hl7aaurvn9xrmj5y3g6bw5ds`

Domaines de production :
- Plateforme / Super Admin : `https://welcomeparis.hotelmanager.fr`
- API : `https://api.welcomeparis.hotelmanager.fr`
- App client hôtel : `https://{hotelSlug}.welcomeparis.hotelmanager.fr`
- Dashboard réception recommandé : `https://admin-{hotelSlug}.welcomeparis.hotelmanager.fr`
- Ancien format conservé pour compatibilité : `https://admin.{hotelSlug}.welcomeparis.hotelmanager.fr`

Exemples :
- Client Vendôme : `https://vendome.welcomeparis.hotelmanager.fr`
- Réception Vendôme : `https://admin.vendome.welcomeparis.hotelmanager.fr`
- Réception Folkestone Opera : `https://admin-folkestone-opera.welcomeparis.hotelmanager.fr`

État actuel important :
- multi-tenant fonctionnel ;
- wildcard SSL fonctionnel ;
- onboarding hôtel fonctionnel ;
- onboarding client fonctionnel ;
- auth frontend réelle via API ;
- Super Admin fonctionnel ;
- Generator fonctionnel ;
- Dashboard Réception fonctionnel ;
- Socket.IO préparé et utilisé pour les flux live ;
- CRM réception privé ;
- clients présents / historique CRM implémentés ;
- fiche client/séjour et timeline implémentées ;
- système de thèmes Guest App implémenté ;
- médiathèque réception privée implémentée ;
- avis client uniques par séjour avec validation avant publication ;
- Socket.IO sécurisé avec authentification JWT (staff) et validation base de données (guest) ;
- rooms Socket.IO isolées : staff par hôtel, guest par guestId ;
- CORS strict configuré pour la production ;
- rate limiting actif sur routes publiques et auth ;
- migrations contrôlées via prisma migrate deploy au démarrage Docker ;
- validation cross-tenant sur routes publiques (validateGuestStayScope) ;
- audit sécurité multi-tenant complété (SECURITY_TENANT_AUDIT.md).

## 2. Architecture cible (Frontend + Backend + Database)

### Frontend

Application React unique dans `apps/web`.

Elle sert plusieurs surfaces selon le hostname et les routes :
- Guest App : application client hôtel mobile-first ;
- Reception App : dashboard opérationnel de l'hôtel ;
- Admin App : console Super Admin ;
- Generator App : assistant de création/configuration hôtel.

Le frontend ne doit jamais être dupliqué par hôtel. Tous les hôtels passent par le même build React.

Rôles des grandes surfaces :
- Guest App : onboarding client, séjour, services, messagerie, guide local, avis ;
- Reception App : inbox, demandes, clients présents, historique CRM, avis, QR code, médias ;
- Admin App : hôtels, utilisateurs, onboarding hôtel, liens, QR, thèmes, recommandations ;
- Generator App : wizard de configuration hôtel, branding, modules, preview, QR.

### Backend

API Node.js/Express dans `apps/api`.

Responsabilités :
- authentification JWT ;
- autorisations par rôle ;
- isolation des données par hôtel ;
- endpoints publics par `hotelSlug` ;
- endpoints privés par `hotelId` ;
- persistance PostgreSQL via Prisma ;
- uploads fichiers ;
- Socket.IO pour événements live.

Modules API existants :
- `auth`
- `hotels`
- `guests`
- `stays`
- `messages`
- `requests`
- `reviews`
- `recommendations`
- `settings`
- `analytics`
- `storage`
- `generator`

### Database

Base PostgreSQL centrale, schéma Prisma dans `prisma/schema.prisma`.

Tables principales :
- `users`
- `hotels`
- `hotel_users`
- `guests`
- `stays`
- `messages`
- `service_requests`
- `reviews`
- `recommendations`
- `hotel_settings`
- `analytics_events`
- `deployments`
- `files`

Migrations existantes importantes :
- initialisation multi-tenant ;
- champs CRM guest ;
- thème Guest App dans `hotel_settings`;
- demandes structurées et recommandations enrichies ;
- `updated_at` sur reviews ;
- statut utilisateur.

## 3. Multi-tenant & Isolation des données (règles hotel_id / hotelSlug)

Règle absolue :
- toutes les données métier privées doivent être filtrées par `hotel_id`.

Le modèle multi-tenant repose sur deux identifiants :
- `hotelSlug` : identifiant public/canonique utilisé dans les URLs et routes publiques ;
- `hotel_id` : identifiant interne UUID utilisé pour filtrer la base.

Résolution publique :
- le client arrive sur `{hotelSlug}.welcomeparis.hotelmanager.fr` ;
- le frontend extrait le slug depuis le hostname via `apps/web/src/lib/tenant.ts` ;
- l'API publique charge l'hôtel avec `GET /api/public/hotels/by-slug/:slug` ;
- toutes les créations publiques sont attachées à l'hôtel résolu.

Résolution réception :
- `admin-{slug}.welcomeparis.hotelmanager.fr` est le format recommandé ;
- `admin.{slug}.welcomeparis.hotelmanager.fr` reste supporté ;
- le dashboard réception résout le slug depuis le hostname ;
- il charge l'hôtel correspondant ;
- il vérifie que l'utilisateur connecté a accès au `hotelId` correspondant.

Règles backend :
- routes dashboard privées : JWT obligatoire ;
- accès hôtel : `requireHotelAccess("hotelId")` ou équivalent obligatoire ;
- Super Admin peut tout voir ;
- `hotel_admin` et `receptionist` ne voient que leurs hôtels ;
- routes publiques ne doivent jamais retourner de CRM privé, messages d'autres clients, notes internes ou données sensibles.

Règles frontend :
- ne jamais choisir arbitrairement `currentUser.hotelIds[0]` lorsqu'un hostname réception contient un slug ;
- le contexte hôtel réception doit venir du hostname quand disponible ;
- si une ancienne session locale appartient à un autre hôtel, elle doit être nettoyée et renvoyer vers le login ;
- les routes `/h/:hotelSlug/*` ne servent qu'en local/dev ou redirection canonique depuis le domaine racine.

URLs canoniques :
- client : `https://{slug}.welcomeparis.hotelmanager.fr`
- réception : `https://admin-{slug}.welcomeparis.hotelmanager.fr`
- racine plateforme : `https://welcomeparis.hotelmanager.fr`

Ne pas servir durablement une app client via :
- `https://welcomeparis.hotelmanager.fr/h/{slug}/...`

Cette forme peut rediriger vers le sous-domaine canonique.

## 4. Structure des dossiers (recommandée)

Structure actuelle du monorepo :

```text
apps/
  web/
    src/
      apps/
        admin/
        generator/
        guest/
        reception/
      components/
        auth/
      lib/
        api.ts
        hotelOnboarding.ts
        socket.ts
        tenant.ts
      pages/
        anciens écrans orphelins à nettoyer plus tard
      stores/
        appStore.ts
      themes/
        système de thèmes Guest App
      types/
      utils/
      App.tsx
      main.tsx

  api/
    src/
      database/
        prisma.ts
        seedProduction.ts
      middleware/
        auth.ts
        errors.ts
        validate.ts
      modules/
        analytics/
        auth/
        generator/
        guests/
        hotels/
        messages/
        recommendations/
        requests/
        reviews/
        settings/
        stays/
        storage/
      utils/
        asyncHandler.ts
        http.ts
        publicSelects.ts
        tenantScope.ts
      app.ts
      config.ts
      server.ts
      socket.ts
      types.ts

packages/
  shared/
    src/
      index.ts

prisma/
  schema.prisma
  seed.ts
  migrations/

docker/
  nginx.conf

docker-compose.yml
Dockerfile.api
Dockerfile.web
.env.example
README.md
SECURITY_TENANT_AUDIT.md
AGENTS.md
```

Structure cible long terme :

```text
apps/
  web/
    src/
      apps/
        admin/
        generator/
        guest/
        reception/
      components/
      lib/
      stores/
      themes/
      types/

  api/
    src/
      modules/
      middleware/
      database/
      utils/

packages/
  shared/
    types/
    validation/

prisma/
  schema.prisma
  seed.ts
  migrations/
```

Note importante :
- `apps/web/src/pages` contient encore des anciens écrans orphelins dépendant partiellement de `mockData`.
- Ne pas supprimer massivement sans ticket dédié.
- Les surfaces actives sont dans `apps/web/src/apps/*`.

## 5. Stack technique détaillée

Frontend :
- React 19
- TypeScript strict
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Zustand avec persistance pour l'auth
- Socket.IO client
- `qrcode.react`
- `jspdf` pour export QR PDF

Backend :
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (`jsonwebtoken`)
- bcrypt (`bcryptjs`)
- Zod
- Multer pour upload local
- Socket.IO
- Helmet
- CORS configuré
- express-rate-limit sur routes publiques

Database :
- PostgreSQL
- Prisma Client
- migrations Prisma
- seed de démonstration

Déploiement :
- Docker
- Docker Compose
- Coolify
- reverse proxy Traefik géré par Coolify
- SSL automatique / wildcard configuré
- stockage local MVP via `/uploads`
- compatibilité future S3/MinIO prévue.

Système de thèmes Guest App :
- `parisian_boutique`
- `modern_minimal`
- `palace_luxury`

Le thème est stocké dans :
- `hotel_settings.guest_theme`

Storage :
- fichiers locaux : `UPLOAD_PROVIDER=local`, `UPLOAD_DIR=uploads`
- fichiers servis par API via `/uploads`
- table `files`
- médiathèque réception privée
- ajout par upload local ou URL distante
- compatibilité Cloudflare R2 / S3 prévue (variables réservées) ;
- migration R2 planifiée avant tout upload d'images en production.
- futur S3/MinIO prévu.

## 6. Règles de codage & bonnes pratiques

Règles générales :
- ne pas refactoriser massivement sans demande explicite ;
- préserver l'architecture globale ;
- une demande = changements ciblés ;
- ne pas modifier Prisma sans nécessité et migration claire ;
- ne jamais casser le flux MVP existant ;
- ne jamais exposer de données CRM publiquement.

Règles TypeScript :
- conserver TypeScript strict ;
- typer les payloads API et validations partagées dans `packages/shared`;
- éviter les `any` quand un type simple peut être créé, mais ne pas lancer de refactor global pour ce seul motif.

Règles backend :
- tout endpoint privé doit passer par `authenticate`;
- toute donnée hôtel doit être filtrée par `hotelId`;
- utiliser `requireHotelAccess` dès qu'un `hotelId` est présent ;
- utiliser Zod via `validateBody`;
- ne jamais retourner `passwordHash`;
- ne jamais retourner CRM privé via route publique ;
- préférer des helpers centraux (`tenantScope`, `publicSelects`) pour limiter les oublis ;
- les erreurs 403 ne doivent pas révéler de détails sensibles.

Règles frontend :
- garder `apps/web/src/apps/*` comme source active des interfaces ;
- éviter les gros composants nouveaux si un composant local peut être extrait simplement ;
- préserver le routing multi-tenant ;
- ne pas casser `tenant.ts`, `api.ts`, `appStore.ts` sans vérifier les flux ;
- les interfaces Admin/Réception doivent rester dark-first, premium, professionnelles ;
- la Guest App doit rester mobile-first, élégante, concierge premium, distincte du dashboard réception.

Règles UI/UX :
- respecter `AGENTS.md` ;
- Tailwind prioritaire ;
- Lucide React pour les icônes ;
- états loading/error/empty obligatoires pour les écrans opérationnels ;
- tableaux professionnels pour CRM, clients présents, historique et demandes ;
- éviter UI générique ou datée ;
- pas de Bootstrap ;
- garder une hiérarchie claire, responsive desktop/tablette/mobile selon le contexte.

Règles Git / déploiement :
- vérifier les builds avant commit ;
- commit clair ;
- push sur GitHub ;
- déployer Coolify seulement si demandé ou si nécessaire pour valider la demande ;
- vérifier statut et logs Coolify après déploiement.

## 7. Points critiques à ne jamais casser

Flux MVP critique :
1. Client ouvre l'app via QR code.
2. Client fait son onboarding.
3. API crée `guest`.
4. API crée `stay`.
5. Client envoie un message ou une demande.
6. API sauvegarde en base avec le bon `hotel_id`.
7. Réception voit le message/la demande.
8. Réception répond ou change le statut.
9. Client voit la réponse/statut.
10. Avis client enregistré, modifiable, puis validé avant publication.

Points à préserver :
- app client Vendôme ;
- app client nouveaux hôtels via wildcard ;
- dashboard réception Vendôme ;
- dashboard réception `admin-{slug}`;
- API publique par slug ;
- auth JWT réelle ;
- Super Admin ;
- Generator ;
- onboarding hôtel ;
- QR code hôtel ;
- multi-tenant par `hotel_id`;
- isolation stricte des données ;
- wildcard SSL ;
- Socket.IO live ;
- Prisma schema comme source de vérité ;
- seed de démonstration ;
- médiathèque et storage local ;
- exports QR PDF ;
- export CRM Excel/JSON si présent dans l'interface.

Risques connus :
- `localStorage` peut conserver une session d'un hôtel ; la réception nettoie désormais une session incompatible avec le slug courant.
- `apps/web/src/pages` contient des anciens fichiers orphelins avec mock data.
- `Dockerfile.api` utilise `prisma migrate deploy` via entrypoint.sh au démarrage — migrations contrôlées, pas de risque de perte de données.
- Les images ajoutées par URL distante peuvent casser si la source externe disparaît ; futur import S3 recommandé.
- Ne jamais modifier la configuration DNS/Coolify/wildcard sans demande explicite.

## 8. Fonctionnalités prioritaires MVP (dans l'ordre)

Priorité initiale MVP :
1. App client QR code.
2. Onboarding client.
3. Création `guest` / `stay`.
4. Message ou demande client.
5. Réception voit la demande.
6. Réception répond.
7. Client voit la réponse.
8. Avis client.
9. CRM client stocké.
10. Multi-tenant par `hotel_id`.
11. Déploiement Coolify prêt.

Fonctionnalités déjà présentes ou structurées :
- Guest App premium ;
- onboarding client avec dates de séjour ;
- services structurés : taxi, restaurant, room service, serviettes/linge, assistance réception ;
- `service_requests.details` JSON pour demandes exploitables ;
- inbox réception ;
- requests réception ;
- clients présents ;
- historique CRM ;
- fiche client/séjour ;
- timeline séjour ;
- notes internes CRM ;
- tags CRM ;
- préférences client ;
- statut relation client ;
- avis unique par séjour ;
- validation des avis avant publication ;
- affichage des avis publiés dans "Voir les avis" ;
- recommandations dynamiques par hôtel ;
- catégories personnalisables ;
- gestion recommandations Admin/Generator ;
- QR code réception et export PDF ;
- médiathèque réception ;
- Super Admin gestion hôtels ;
- Super Admin gestion utilisateurs/réception ;
- thèmes Guest App.

Prochaines priorités produit raisonnables :
1. Storage Cloudflare R2 — avant tout upload d'images en prod.
2. Formulaires services structurés (taxi, restaurant, room service, linge) avec affichage lisible côté réception.
3. Recommandations personnalisables avec images (après R2).
4. Hotel Admin — espace directeur hôtel autonome.
5. CRM exports avancés (CSV, filtres segmentation).
6. Monitoring/backups PostgreSQL automatiques.
7. Démos commerciales (3 hôtels, landing page).

## 9. Authentification & Rôles

Auth :
- login via `POST /api/auth/login`;
- JWT signé avec `JWT_SECRET`;
- mot de passe hashé via bcrypt ;
- session frontend stockée via Zustand persist ;
- `GET /api/auth/me` restaure la session ;
- `POST /api/auth/logout` termine la session côté frontend.

Rôles :
- `super_admin`
- `hotel_admin`
- `receptionist`
- `guest`

Règles :
- `super_admin` voit et administre tout ;
- `hotel_admin` voit uniquement ses hôtels ;
- `receptionist` voit uniquement ses hôtels ;
- `guest` utilise uniquement le parcours public via session temporaire locale ;
- les routes dashboard doivent être protégées ;
- les routes publiques ne doivent jamais exposer CRM, notes internes ou données d'autres clients.

Gestion utilisateurs actuelle :
- le Super Admin peut voir les comptes hôtel ;
- le Super Admin peut modifier identifiant/email, nom, rôle hôtel, statut, mot de passe ;
- un compte désactivé (`users.status = inactive`) ne peut plus se connecter ;
- les Super Admin ne sont pas exposés/modifiables via la gestion des utilisateurs hôtel ;
- à la création d'un hôtel, un compte réception peut être provisionné.

Comptes seed connus :
- Super Admin : `admin@paris-local.test` / `<voir SEED_ADMIN_PASSWORD dans Coolify>`
- Réception Vendôme : `reception@vendome.test` / `<voir SEED_ADMIN_PASSWORD dans Coolify>`
- Réception nouveaux hôtels : format fréquent `reception+{slug}@welcomeparis.hotelmanager.fr` / mot de passe temporaire selon provisioning.

## 10. Variables d'environnement importantes

Variables principales :

```env
NODE_ENV=development

DATABASE_URL=<voir DATABASE_URL dans Coolify>
JWT_SECRET=<générer un secret de 32+ caractères>

API_PORT=4000
WEB_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000

UPLOAD_PROVIDER=local
UPLOAD_DIR=uploads
```

PostgreSQL local Docker :

```env
POSTGRES_USER=paris_local
POSTGRES_PASSWORD=<voir DATABASE_URL dans Coolify>
POSTGRES_DB=paris_local
```

S3 / MinIO futur :

```env
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
```

MinIO local optionnel :

```env
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=<générer un mot de passe fort>
```

Intégrations futures :

```env
GOOGLE_MAPS_API_KEY=
RATP_API_KEY=
RATP_API_BASE_URL=
```

Notes :
- `GOOGLE_MAPS_API_KEY` servira plus tard à importer/suggérer restaurants, musées, pharmacies, lieux locaux.
- `RATP_API_KEY` et `RATP_API_BASE_URL` serviront plus tard aux transports proches, métro, bus et itinéraires.
- En production, `JWT_SECRET` doit être long, aléatoire et non partagé.
- `VITE_API_URL` doit pointer vers `https://api.welcomeparis.hotelmanager.fr`.

## 11. Commandes utiles (dev, build, docker, etc.)

Installation :

```bash
npm install
```

Développement local :

```bash
npm run dev
npm run dev:web
npm run dev:api
```

Build :

```bash
npm run build
npm run build:web
npm run build:api
npm run build --workspace @paris-local/shared
npm run build --workspace @paris-local/web
npm run build --workspace @paris-local/api
```

Typecheck :

```bash
npm run typecheck
npm run typecheck --workspace @paris-local/web
npm run typecheck --workspace @paris-local/api
```

API production locale :

```bash
npm run start:api
```

Prisma :

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Docker :

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

Démarrage local recommandé :

```bash
npm install
copy .env.example .env
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
npm run dev:api
npm run dev:web
```

Routes locales utiles :

```text
Guest App dev : http://localhost:5173/h/vendome/welcome
Reception dev : http://localhost:5173/reception
Super Admin dev : http://localhost:5173/admin
Generator dev : http://localhost:5173/generator
API health : http://localhost:4000/health
```

Routes production utiles :

```text
Plateforme : https://welcomeparis.hotelmanager.fr
API : https://api.welcomeparis.hotelmanager.fr
Guest Vendôme : https://vendome.welcomeparis.hotelmanager.fr
Reception Vendôme : https://admin.vendome.welcomeparis.hotelmanager.fr
Reception nouveau format : https://admin-{slug}.welcomeparis.hotelmanager.fr
```

Builds obligatoires avant commit pour changements frontend/API :

```bash
npm run build --workspace @paris-local/shared
npm run build --workspace @paris-local/api
npm run typecheck --workspace @paris-local/web
npm run build --workspace @paris-local/web
```

Si Prisma change :

```bash
npm run prisma:generate
npm run build --workspace @paris-local/shared
npm run build --workspace @paris-local/api
npm run typecheck --workspace @paris-local/web
npm run build --workspace @paris-local/web
```

Rappel de prudence :
- ne pas lancer de commande destructive (`git reset --hard`, suppression récursive, reset DB) sans demande explicite ;
- ne pas modifier la production ou Coolify sans vérifier le build ;
- ne pas exposer les tokens dans les commits ou logs publics ;
- après usage, révoquer tout token temporaire fourni en conversation.

## 12. Historique des phases complétées

Phase 0 — Sécurisation Socket.IO ✅
- Middleware auth JWT staff + validation guest (guestId/stayId/hotelId)
- Rooms séparées : hotel:{hotelId}:staff / hotel:{hotelId}:guest:{guestId}
- Émissions corrigées par module (messages, requests, reviews)
- RBAC PATCH /settings restreint à super_admin + hotel_admin
- DATABASE_URL guard production (process.exit(1) si absent/invalide)
- Commits : `022990e`, `5f0574b`, `5b02a84`, `a829681`, `8da47da`, `ca7b5a6`, `e313a59`

Phase 1 — Stabilisation production ✅
- CORS strict (isAllowedOrigin, sous-domaines welcomeparis.hotelmanager.fr)
- Rate limiting (60 req/min public, 10 req/15min login)
- seedProduction.ts sécurisé (SEED_ADMIN_PASSWORD obligatoire)
- DEPLOYMENT.md créé (procédure complète Coolify)
- pre-deploy-check.sh créé
- Commits : `f8758fe`, `be30c57`, `615371b`, `32a22e0`, `33a90e5`

Sécurité multi-tenant ✅
- validateGuestStayScope sur toutes les routes publiques de création
- SECURITY_TENANT_AUDIT.md — audit complet documenté
- Commits : commits récents documentés dans git log
