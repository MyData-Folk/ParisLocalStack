# TECHNICAL_BRAIN.md - Resume technique ParisLocalStack

## 1. Architecture reelle
ParisLocalStack est un SaaS hotelier multi-tenant auto-heberge.

Architecture actuelle :
- 1 frontend React commun.
- 1 backend API Express commun.
- 1 base PostgreSQL centrale.
- 1 modele multi-tenant par hotel_id.
- 1 resolution hotel publique par hotelSlug et hostname.
- Deploiement Docker/Coolify.

Aucune application React separee ne doit etre creee par hotel.

## 2. Monorepo
Structure reelle connue : apps/web, apps/api, packages/shared, prisma, docs, fichiers Docker et configuration racine.

## 3. Frontend
Stack : React 19, TypeScript strict, Vite, Tailwind CSS, React Router, Zustand, Lucide React, Socket.IO client, qrcode.react, jsPDF.

Surfaces frontend : Guest App, Reception App, Super Admin, Generator, Hotel Admin.

Points frontend critiques : tenant parsing hostname, routes canonical vers sous-domaines hotel, auth reelle via API et JWT, session a controler pour eviter un contexte hotel obsolete, grands fichiers historiques a refactoriser avec prudence.

## 4. Backend
Stack : Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, bcryptjs, Zod, Socket.IO, Helmet, CORS, rate limiting, logs, Multer/storage local ou compatible objet selon configuration.

Modules API connus : auth, hotels, guests, stays, messages, requests, reviews, recommendations, settings, analytics, storage, generator, health/readiness.

Regles backend critiques : toutes les routes privees doivent exiger un utilisateur authentifie, verifier l'acces hotel, filtrer par hotel_id. Les routes publiques utilisent hotelSlug et ne retournent que des donnees non sensibles.

## 5. Prisma / Database
Base : PostgreSQL centrale.

Modeles connus : User, Hotel, HotelUser, Guest, Stay, Message, ServiceRequest, Review, Recommendation, HotelSettings, AnalyticsEvent, Deployment, File.

Enums connus : UserRole, HotelStatus, UserStatus.

Migrations connues historiquement : initialisation, champs CRM guest, theme guest settings, demandes structurees et recommandations, review updated_at, user status, enum user status.

Regle absolue : utiliser les migrations versionnees en production, pas de synchronisation destructive.

## 6. Docker / Coolify
Services Coolify connus : paris-local-web gukenjn38rxuj9n7sn5g43ey, paris-local-api m2rfu2ypdlq07jylh59e8oh6, paris-local-postgres hl7aaurvn9xrmj5y3g6bw5ds.

Domaines connus : welcomeparis.hotelmanager.fr, api.welcomeparis.hotelmanager.fr, {hotelSlug}.welcomeparis.hotelmanager.fr, admin-{hotelSlug}.welcomeparis.hotelmanager.fr, admin.{hotelSlug}.welcomeparis.hotelmanager.fr.

## 7. Cloudflare / DNS / Wildcard
Etat connu depuis historique projet : wildcard subdomains OK.

Information non verifiee dans cette passe : configuration Cloudflare exacte, regles DNS exactes et etat actuel des certificats live.

## 8. Modules existants
Existants et fonctionnels selon etat connu : onboarding hotel/client, messagerie, demandes, avis et validation, CRM, clients presents/historique, fiche client/sejour, QR code, Super Admin, Generator, Hotel Admin, exports CRM, media hotel, monitoring/backups documentes.

## 9. Modules absents ou incomplets
A ne pas construire sans ticket explicite : integrations PMS type Opera/Mews, paiement integre, application native, AI concierge avancee, Google Maps actif, RATP actif, marketplace complet de templates, workflows Palace complexes.

## 10. Risques techniques
Fuite inter-hotels si oubli de filtre hotel_id, gros composants frontend, session obsolete, routes publiques trop larges, migrations Prisma, donnees demo a separer des donnees reelles.

## 11. Dette technique
Refactorisation progressive des gros fichiers frontend, nettoyage des pages orphelines apps/web/src/pages, typage API frontend, documentation de runbooks.

## 12. Outillage UI/UX
Playwright et `@axe-core/playwright` sont installes comme dependances de developpement.

Commande disponible : `npm run audit:ui`.

Les captures et rapports axe locaux sont ecrits dans `node_modules/.cache/parislocalstack-ui-audit`.

Regle : lancer les audits avec un environnement local representatif ou une cible configuree. Si l'API, la DB ou le tenant demo ne sont pas disponibles, les captures locales peuvent montrer des etats de fallback, login ou erreur qui ne representent pas l'etat staging/production.

## 13. Etat des deploiements connus
Production connue comme stable dans l'historique projet.

Etat live exact au 2026-06-02 : Information non verifiee dans cette passe docs-only.

## 14. Statut Phase 9E local / staging
Etat local valide au 2026-06-02 : migrations appliquees, seed demo neutre execute localement, tenant `demo-paris-local` et hotel Hôtel Lumière Demo Paris verifies, Guest App locale OK, Reception locale post-auth OK, Admin Hotel local post-auth OK, donnees 100 % fictives.

Etat public/staging non valide : `https://demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 mais affiche `Hotel not found`; `https://admin-demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 avec un login generique. Coolify lecture seule n'etait pas disponible (`Unauthenticated`), donc aucune DB/API/Web dedies ni protection d'acces n'ont ete verifies.

Garde-fous staging : ne jamais lancer `prisma/seed.demo.ts`, une migration, un deploy ou un reset sur un environnement non identifie ; confirmer que `DATABASE_URL` pointe vers une DB staging dediee sans afficher sa valeur ; confirmer rollback staging avant seed ; proteger les comptes demo si un domaine public est utilise ; ne jamais utiliser production comme staging.
