# ARCHITECTURE_REALITY_CHECK.md - Audit realite depot ParisLocalStack

Date de creation : 2026-06-02.

Ce document decrit l'etat connu du depot et de l'architecture. Toute information non observee directement dans cette passe est marquee explicitement.

## 1. Arborescence generale
Arborescence principale connue :

```text
apps/
  web/
  api/
packages/
  shared/
prisma/
docs/
Dockerfile.api
Dockerfile.web
docker-compose.yml
package.json
CLAUDE.md
```

Information non verifiee : arborescence exhaustive fichier par fichier au moment exact de lecture finale.

## 2. Applications
### apps/web
Application React/Vite commune a toutes les surfaces frontend.

Surfaces connues : Guest App, Reception App, Super Admin, Generator, Hotel Admin.

Responsabilites : resolution tenant par hostname/path, app client hotel, dashboards prives, onboarding hotel/client, affichage QR code, theming guest, interaction API.

### apps/api
API Express commune.

Responsabilites : auth, hotels, guests, stays, messages, requests, reviews, recommendations, settings, analytics, storage, generator, Socket.IO, health/readiness.

### packages/shared
Package partage pour types et validations.

Information non verifiee : contenu exhaustif actuel du package.

## 3. Routes frontend connues
Routes/surfaces principales :
- `/` : plateforme ou resolution selon hostname.
- `/admin` : Super Admin.
- `/admin/hotels` : liste hotels.
- `/admin/hotels/new` : creation hotel.
- `/admin/hotels/:id` : detail hotel.
- `/admin/users` : utilisateurs.
- `/generator` : wizard hotel.
- `/inbox` : messagerie reception.
- `/requests` : demandes reception.
- `/guests` : clients presents.
- `/history` : historique CRM.
- `/reviews` : avis.
- `/media` : mediatheque/images selon etat connu.
- `/qr` : QR code reception.
- routes Guest App par sous-domaine et chemins type `/welcome`, `/messages`, `/services`, `/review`, `/guide`.

Information non verifiee : liste exhaustive des routes React Router apres les derniers refactors.

## 4. Routes API connues
Routes publiques connues : recuperation hotel public par slug, settings publics, recommandations publiques, creation guest/stay/message/request/review pour un hotelSlug, analytics publiques non sensibles.

Routes privees connues : auth login/logout/me, CRUD hotels, hotels/:hotelId guests/stays/messages/requests/reviews/recommendations/settings/analytics, storage, generator, health/readiness.

Regle attendue : chaque route privee hotel doit verifier le JWT, le role et l'acces hotel.

Information non verifiee : couverture exhaustive ligne par ligne de chaque route dans cette passe docs-only.

## 5. Modeles Prisma connus
Modeles : User, Hotel, HotelUser, Guest, Stay, Message, ServiceRequest, Review, Recommendation, HotelSettings, AnalyticsEvent, Deployment, File.

Enums : UserRole, HotelStatus, UserStatus.

Information non verifiee : champs exacts de chaque modele a la date de ce document. Se referer a `prisma/schema.prisma` pour la source de verite.

## 6. Seeds
Seeds connus : seed de demonstration/developpement et seedProduction compile cote API selon Dockerfile connu.

Regles : ne jamais inserer de donnees reelles en seed demo, ne jamais stocker de secret en clair dans un seed, verifier les valeurs compatibles avec les enums Prisma.

Information non verifiee : contenu actuel complet des seeds.

## 7. Deploiement
Deploiement connu : Docker + Coolify.

Services connus : paris-local-web, paris-local-api, paris-local-postgres.

Regles : migrations versionnees en production, healthcheck `/health`, readiness `/ready` avec verification DB, sauvegardes et restore staging/test documentes, ne pas restaurer la production sans procedure explicite.

Information non verifiee : etat live actuel des conteneurs et derniers logs Coolify.

## 8. Domaines
Domaines cibles :
- plateforme : welcomeparis.hotelmanager.fr.
- API : api.welcomeparis.hotelmanager.fr.
- app client : {hotelSlug}.welcomeparis.hotelmanager.fr.
- reception recommande : admin-{hotelSlug}.welcomeparis.hotelmanager.fr.
- reception legacy : admin.{hotelSlug}.welcomeparis.hotelmanager.fr.

Information non verifiee : etat DNS/SSL live exact au moment de ce document.

## 9. Risques majeurs
- Oubli de filtre hotel_id.
- Exposition publique de donnees CRM.
- Session frontend gardant un hotelSlug obsolete.
- Refactor des gros composants frontend sans tests.
- Migrations Prisma non preparees.
- Utilisation de donnees reelles dans la demo.
- Documentation obsolete si non maintenue apres chaque phase importante.
- Audit UI local non representatif si localhost n'a pas API, DB et tenant demo disponibles.
- Confusion possible entre captures Playwright locales, staging et production.

## 10. Etat reel des modules
Modules consideres operationnels selon historique projet : Guest App, Reception App, Super Admin, Generator, Hotel Admin, Auth JWT, Multi-tenant, QR code, CRM, Exports, Reviews, Service requests, Recommendations, Media hotel, Monitoring/backups documentes.

Modules a verifier avant commercialisation : demo tenant neutre, navigation complete mobile, separation donnees demo/reelles, coverage manuelle du flux complet, etat exact des grands fichiers frontend apres refactorisations partielles.

## 11. Observations UI recentes
Observations du 2026-06-02 sur captures partagees : Reception avec dashboard operationnel complet visible, Guest App Vendome client QR fonctionnelle et premium, Super Admin fonctionnel avec hotels, QR et generator.

Ces observations ne remplacent pas une validation production-ready exhaustive. Les captures Playwright locales initiales ont montre des etats degrades car l'environnement localhost n'etait pas representatif. L'audit local reste utile, mais il doit etre distingue de staging et production.

Outillage observe dans le depot : `npm run audit:ui` avec Playwright et axe, sorties temporaires dans `node_modules/.cache/parislocalstack-ui-audit`.
