Tu es un agent senior full-stack spécialisé SaaS B2B, React, TypeScript, Node.js, PostgreSQL, Docker, Coolify et architecture multi-tenant.

CONTEXTE
Je construis une plateforme SaaS appelée provisoirement “Paris Local / Digital Hotel Concierge”.

Le produit permet de créer pour chaque hôtel :
1. une application client accessible par QR code,
2. un dashboard réception,
3. une collecte CRM,
4. une messagerie client ↔ réception,
5. un système d’avis/satisfaction,
6. des recommandations locales,
7. une configuration personnalisée par hôtel.

ARCHITECTURE CIBLE
Je ne veux pas dépendre de Supabase/Firebase pour le cœur du projet.

Je veux une architecture auto-hébergée sur mon VPS via Coolify :

- Frontend React sur Coolify
- Backend API Node.js/TypeScript sur Coolify
- PostgreSQL sur Coolify
- Storage local ou S3 compatible
- Docker / Docker Compose
- architecture multi-tenant
- une seule base PostgreSQL centrale
- isolation des données par hotel_id

OBJECTIF
Transformer le projet actuel en vraie plateforme SaaS de production.

Séparer clairement :
1. Admin Principal — utilisé par moi
2. Générateur d’applications / dashboards — utilisé par moi
3. Application Client Hôtel X — utilisée par les clients
4. Dashboard Réception Hôtel X — utilisé par la réception
5. Backend API — commun à tous les hôtels
6. PostgreSQL — base centrale multi-tenant
7. Storage — images, logos, fichiers hôtels

STACK TECHNIQUE
Frontend :
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Zustand ou Context API

Backend :
- Node.js
- Express ou Fastify
- TypeScript
- PostgreSQL
- Prisma ORM ou Drizzle ORM
- JWT Auth
- bcrypt
- Zod validation
- WebSocket ou Socket.IO pour messagerie temps réel
- Multer ou S3 SDK pour uploads

Déploiement :
- Docker
- Docker Compose
- Coolify
- PostgreSQL service Coolify
- variables d’environnement
- reverse proxy Coolify
- SSL automatique Coolify

ARCHITECTURE RECOMMANDÉE
Créer un monorepo :

apps/
  web/
    src/
      apps/
        admin/
        generator/
        guest/
        reception/
      components/
      routes/
      lib/
      stores/
      types/

  api/
    src/
      modules/
        auth/
        hotels/
        guests/
        stays/
        messages/
        requests/
        reviews/
        recommendations/
        analytics/
        storage/
        generator/
      middleware/
      database/
      utils/
      server.ts

packages/
  shared/
    types/
    validation/

prisma/
  schema.prisma
  seed.ts

docker-compose.yml
Dockerfile.web
Dockerfile.api
.env.example
README.md

DOMAINES / SOUS-DOMAINES
Le système doit fonctionner avec des sous-domaines par hôtel :

App client :
hotel-slug.welcomeparis.hotelmanager.fr

Dashboard réception :
admin.hotel-slug.welcomeparis.hotelmanager.fr

Exemple :
vendome.welcomeparis.hotelmanager.fr
admin.vendome.welcomeparis.hotelmanager.fr

Le frontend doit détecter automatiquement le hostname pour identifier hotelSlug.

Exemple :
const hostname = window.location.hostname
const hotelSlug = extractHotelSlug(hostname)

Le backend doit utiliser hotelSlug ou hotel_id pour charger les données du bon hôtel.

IMPORTANT
Ne pas créer une application séparée par hôtel.
Faire une seule application multi-tenant.

BACKEND API
Créer une API REST propre.

Endpoints minimum :

AUTH
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

HOTELS
GET /api/hotels
POST /api/hotels
GET /api/hotels/:id
PATCH /api/hotels/:id
DELETE /api/hotels/:id
GET /api/public/hotels/by-slug/:slug

GUESTS
POST /api/public/:hotelSlug/guests
GET /api/hotels/:hotelId/guests
GET /api/guests/:id

STAYS
POST /api/public/:hotelSlug/stays
GET /api/hotels/:hotelId/stays
PATCH /api/stays/:id

MESSAGES
POST /api/public/:hotelSlug/messages
GET /api/hotels/:hotelId/messages
POST /api/messages/:id/reply
PATCH /api/messages/:id/status

SERVICE REQUESTS
POST /api/public/:hotelSlug/requests
GET /api/hotels/:hotelId/requests
PATCH /api/requests/:id/status

REVIEWS
POST /api/public/:hotelSlug/reviews
GET /api/hotels/:hotelId/reviews
PATCH /api/reviews/:id/status

RECOMMENDATIONS
GET /api/public/:hotelSlug/recommendations
POST /api/hotels/:hotelId/recommendations
PATCH /api/recommendations/:id
DELETE /api/recommendations/:id

SETTINGS
GET /api/public/:hotelSlug/settings
GET /api/hotels/:hotelId/settings
PATCH /api/hotels/:hotelId/settings

STORAGE
POST /api/storage/upload
DELETE /api/storage/:fileId

ANALYTICS
POST /api/public/:hotelSlug/analytics
GET /api/hotels/:hotelId/analytics

DATABASE POSTGRESQL
Créer un schéma PostgreSQL multi-tenant.

Tables :

users
- id
- email
- password_hash
- name
- role
- created_at
- updated_at

hotels
- id
- name
- slug unique
- description
- address
- city
- country
- phone
- email
- website
- logo_url
- primary_color
- secondary_color
- status
- created_at
- updated_at

hotel_users
- id
- hotel_id
- user_id
- role
- created_at

guests
- id
- hotel_id
- first_name
- last_name
- email
- phone
- language
- marketing_consent
- created_at

stays
- id
- hotel_id
- guest_id
- room_number
- checkin_date
- checkout_date
- status
- created_at

messages
- id
- hotel_id
- guest_id
- stay_id
- sender_type
- sender_id
- content
- status
- priority
- created_at

service_requests
- id
- hotel_id
- guest_id
- stay_id
- type
- title
- description
- status
- priority
- created_at
- updated_at

reviews
- id
- hotel_id
- guest_id
- stay_id
- rating
- comment
- status
- created_at

recommendations
- id
- hotel_id
- category
- name
- description
- address
- phone
- website
- distance
- latitude
- longitude
- is_featured
- created_at

hotel_settings
- id
- hotel_id
- wifi_name
- wifi_password
- breakfast_hours
- checkin_time
- checkout_time
- room_service_hours
- reception_phone
- whatsapp_number
- languages jsonb
- modules jsonb
- created_at
- updated_at

analytics_events
- id
- hotel_id
- guest_id nullable
- event_type
- event_payload jsonb
- created_at

deployments
- id
- hotel_id
- provider
- status
- url
- environment jsonb
- created_at

files
- id
- hotel_id
- filename
- original_name
- mime_type
- size
- url
- storage_provider
- created_at

RÔLES
Créer ces rôles :

super_admin
hotel_admin
receptionist
guest

Règles :
- super_admin voit tout
- hotel_admin voit uniquement son hôtel
- receptionist voit uniquement son hôtel
- guest n’a accès qu’à son parcours public via token/session temporaire
- toutes les requêtes dashboard doivent être protégées
- toutes les données doivent être filtrées par hotel_id

SÉCURITÉ
Implémenter :
- JWT
- password hashing avec bcrypt
- middleware auth
- middleware requireRole
- middleware requireHotelAccess
- validation Zod
- CORS configuré
- rate limiting sur routes publiques
- sanitation inputs
- variables d’environnement

APPLICATION CLIENT HÔTEL
Routes :
/h/:hotelSlug
/h/:hotelSlug/welcome
/h/:hotelSlug/guide
/h/:hotelSlug/services
/h/:hotelSlug/messages
/h/:hotelSlug/review

Fonctions :
- détecter hôtel par slug/sous-domaine
- afficher branding hôtel
- onboarding client
- collecte prénom, nom, email, téléphone, chambre
- consentement RGPD
- création guest + stay
- affichage Wi-Fi
- horaires
- services
- recommandations locales
- demande taxi
- demande restaurant
- messagerie réception
- avis/satisfaction
- alerte si note faible

DASHBOARD RÉCEPTION
Routes :
/reception
/reception/inbox
/reception/requests
/reception/guests
/reception/reviews
/reception/analytics
/reception/settings

Fonctions :
- login réception
- messages temps réel
- réponses clients
- demandes de service
- statuts : Nouveau, En cours, Traité, Urgent, Fermé
- avis clients
- alertes mauvaises notes
- CRM clients
- statistiques hôtel

ADMIN PRINCIPAL
Routes :
/admin
/admin/hotels
/admin/hotels/:id
/admin/users
/admin/deployments
/admin/settings

Fonctions :
- créer hôtel
- modifier hôtel
- activer/désactiver hôtel
- gérer utilisateurs hôtel
- voir statistiques globales
- suivre déploiements
- gérer paramètres plateforme

GÉNÉRATEUR
Routes :
/generator
/generator/new-hotel
/generator/:hotelId/config
/generator/:hotelId/branding
/generator/:hotelId/content
/generator/:hotelId/preview
/generator/:hotelId/deploy

Fonctions :
- créer configuration hôtel
- importer logo/photos
- configurer couleurs
- configurer modules
- configurer FAQ/services/recommandations
- prévisualiser app client
- prévisualiser dashboard réception
- générer hotel-config.json
- générer QR code
- préparer variables d’environnement
- préparer déploiement Coolify

STORAGE
Prévoir deux modes :

1. Local storage pour MVP
- stockage dans /uploads
- URLs servies par API

2. S3 compatible pour production
- MinIO ou bucket S3 compatible
- variables :
  S3_ENDPOINT
  S3_ACCESS_KEY
  S3_SECRET_KEY
  S3_BUCKET
  S3_REGION

DOCKER / COOLIFY
Créer les fichiers :

docker-compose.yml
Dockerfile.web
Dockerfile.api
.env.example

Services :
- web
- api
- postgres
- storage optionnel MinIO

Variables :

DATABASE_URL=
JWT_SECRET=
API_PORT=
WEB_URL=
CORS_ORIGIN=
UPLOAD_PROVIDER=local
UPLOAD_DIR=uploads
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=

COMMANDES
Le projet doit fonctionner avec :

npm install
npm run dev
npm run build

Pour API :
npm run dev:api
npm run build:api
npm run start:api

Pour Docker :
docker compose up -d

QUALITÉ CODE
Exigences :
- TypeScript strict
- architecture modulaire
- pas de gros App.tsx
- pas de code dupliqué
- services séparés
- composants réutilisables
- gestion loading/error/empty states
- README clair
- .env.example complet
- migrations base de données
- seed de démonstration
- build sans erreur

ORDRE DE TRAVAIL
1. Inspecter le projet existant.
2. Proposer un plan court.
3. Refactoriser en monorepo apps/web + apps/api.
4. Créer backend API TypeScript.
5. Créer Prisma/Drizzle schema PostgreSQL.
6. Créer migrations.
7. Créer auth JWT.
8. Créer endpoints hôtels.
9. Créer endpoints guests/stays.
10. Créer endpoints messages.
11. Créer endpoints service_requests.
12. Créer endpoints reviews.
13. Créer frontend routes.
14. Connecter app client à l’API.
15. Connecter dashboard réception à l’API.
16. Ajouter WebSocket/Socket.IO pour messages temps réel.
17. Ajouter storage local.
18. Préparer compatibilité S3/MinIO.
19. Ajouter Dockerfiles.
20. Ajouter docker-compose.
21. Ajouter README déploiement Coolify.
22. Tester npm run build.
23. Corriger erreurs.

IMPORTANT
Ne fais pas une simple maquette.
Construis une base SaaS exploitable.

La priorité MVP est :
1. App client QR code
2. Onboarding client
3. Création guest/stay
4. Message ou demande client
5. Réception voit la demande
6. Réception répond
7. Avis client
8. CRM client stocké
9. Multi-tenant par hotel_id
10. Déploiement Coolify prêt

COMMENCE MAINTENANT PAR ANALYSER LE CODE EXISTANT, PUIS APPLIQUE LES MODIFICATIONS.
