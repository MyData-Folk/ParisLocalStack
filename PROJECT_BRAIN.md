# PROJECT_BRAIN.md - Source de verite ParisLocalStack

## 1. Vision produit
ParisLocalStack, aussi appele Paris Local / Digital Hotel Concierge, est une plateforme SaaS B2B multi-tenant pour hotels independants, boutique hotels, aparthotels et petits groupes hoteliers.

Le produit remplace une partie du livret d'accueil papier, du QR code statique et des demandes reception dispersees par une experience digitale unique : une application concierge client, un dashboard reception, un CRM operationnel et un outil d'onboarding hotel.

Le principe fondamental est simple : une seule plateforme technique, plusieurs hotels, separation stricte des donnees par hotel_id.

## 2. Objectifs business
- Permettre a un hotel d'activer rapidement une app concierge accessible par QR code.
- Donner a la reception un centre operationnel clair pour messages, demandes, avis et CRM.
- Donner au super admin une interface pour onboarder un nouvel hotel sans modifier le code.
- Commercialiser une offre SaaS stable, premium et simple a deployer.
- Prepararer une bibliotheque future de themes et templates hoteliers.

## 3. Proposition de valeur
- Installation sans application mobile native : le client scanne un QR code.
- Multi-tenant centralise : pas de nouvelle app React par hotel.
- Parcours client complet : onboarding, sejour, services, messages, avis.
- Reception plus efficace : messages, demandes, CRM, historique, fiche sejour.
- Personnalisation hotel : branding, couleurs, theme, recommandations locales, QR code.
- Exploitation commerciale : demos, packages, deploiement Coolify, monitoring et sauvegardes documentes.

## 4. Clientele cible
Priorite actuelle : hotels independants 3 etoiles, boutique hotels parisiens, petits hotels 4 etoiles independants, aparthotels et residences haut de gamme.

Clients secondaires futurs : petits groupes hoteliers, palaces et hotels 5 etoiles uniquement apres maturite produit plus elevee.

## 5. Packages commerciaux envisages
Le package de lancement recommande est Boutique.

Packages cibles : Starter, Boutique, Premium et Palace.

Starter couvre le QR concierge et les informations pratiques. Boutique couvre messagerie, demandes structurees, avis, CRM, recommandations et branding. Premium ajoute themes avances, analytics, exports et automatisations. Palace reste reserve aux integrations avancees et workflows concierge VIP futurs.

Vague 5F (PR #87, #88, #89) : les cartes Guest App (hero et shortcut) sont desormais configurables par hotel, avec un forfait commercial qui en plafonne le nombre, les kinds autorises, l'usage d'images personnalisees et l'ouverture de liens externes. Hotel Admin peut editer image, titre, description, action, ordre et etat actif/inactif via `PATCH /api/hotels/:id/guest-cards` ; Super Admin pilote le forfait via `PATCH /api/hotels/:id/plan`. La route publique settings ne retourne que les cartes `enabled === true` triees et tronquees, et la Guest App preserve le rendu legacy si la liste est absente, vide, invalide ou totalement desactivee.

Vague 6F (PR #91 a #97) : les services hotel sont configurables par hotel. Super Admin attribue les services autorises, Hotel Admin personnalise les services de son hotel, l'API publique settings expose uniquement les services actifs/visibles avec limites de forfait, et la Guest App affiche ces services via `useEnabledServices(settings)` avec fallback legacy strict. Les formulaires historiques Taxi, Room service, linge/Pressing/Blanchisserie et Reception restent preserves.

## 6. Etat actuel du projet
Etat connu au 2026-06-02 :
- Monorepo GitHub MyData-Folk/ParisLocalStack.
- Frontend React/Vite/Tailwind.
- Backend Express/Prisma/PostgreSQL.
- Deploiement Coolify en production.
- Multi-tenant par hotel_id et hotelSlug.
- Wildcard subdomains operationnels selon historique projet.
- Guest App premium fonctionnelle.
- Dashboard Reception fonctionnel.
- Super Admin fonctionnel.
- Generator hotel fonctionnel.
- Auth reelle JWT fonctionnelle.
- Socket.IO prepare et utilise pour la synchronisation temps reel.
- CRM reception prive avec clients presents, historique, fiche client/sejour et timeline.
- QR code hotel disponible dans les interfaces pertinentes.
- Documentation commerciale et technique deja commencee.
- PR #47 terminee : Playwright et axe UI audit tooling sont disponibles pour audits locaux.
- PR #48 terminee : l'etat d'erreur Guest App affiche un message hotelier au lieu de `Internal server error`.
- Phase 9E locale validee : le tenant `demo-paris-local` / Hôtel Lumière Demo Paris existe en local, avec donnees 100 % fictives, Guest App OK, Reception post-auth OK et Admin Hotel post-auth OK.
- Phase 9E staging/public non validee : `https://demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 mais affiche `Hotel not found`; `https://admin-demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 avec login generique. DB/API/Web dedies, protection d'acces et separation staging/production non verifies.
- Vague 5 cartes Guest App : PR #81 modele `guestCards` + `commercialPackage`, PR #82 API plan commercial, PR #84 Super Admin modifie le plan et Hotel Admin le voit en lecture seule, PR #85 API privee guest-cards, PR #86 editeur Hotel Admin, PR #87 API publique safe, PR #88 composants isoles, PR #89 branchement GuestShell avec fallback legacy.
- Vague 6 services configurables : PR #91 types/schemas, PR #92 DB + API privee, PR #93 attribution Super Admin, PR #94 personnalisation Hotel Admin, PR #95 DTO public settings, PR #96 hook `useEnabledServices`, PR #97 rendu Guest App dynamique avec fallback legacy. Validation locale OK ; staging/production non valides.
- Observations du 2026-06-02 sur captures partagees : Reception operationnelle complete visible, Guest App Vendome client QR fonctionnelle et premium, Super Admin fonctionnel avec hotels, QR et generator. Information non verifiee comme validation production-ready complete.

Niveau de maturite estime dans les documents existants : MVP fonctionnel environ 93 a 96%, production-ready environ 70%, commercial-ready environ 65%.

## 7. Roadmap synthetique
Termine : architecture multi-tenant, API commune, auth reelle, onboarding client, onboarding hotel, dashboard reception, Super Admin, Generator, CRM et exports, monitoring et sauvegardes documentes, strategie produit et demo commerciale documentees.

En cours : garder la demo locale neutre prete RDV, clarifier l'environnement public/staging avant toute action, consolider les workflows client reception backend, ameliorer progressivement la maintenabilite frontend.

Priorite suivante : obtenir la preuve d'un staging dedie et protege pour `demo-paris-local`, puis poursuivre la Phase 10 documentee : services client/categories, tags demandes, tri clients presents, supervision Admin Hotel et historique client. Reference : `docs/PRODUCT_ROADMAP_SERVICES_REQUESTS_HISTORY.md`.

## 8. Decisions majeures
- Une seule application web multi-tenant, jamais une app par hotel.
- Une seule base PostgreSQL centrale.
- Isolation obligatoire par hotel_id pour toutes les donnees privees.
- Resolution publique par hotelSlug.
- Reception recommandee : admin-{slug}.welcomeparis.hotelmanager.fr.
- Ancien format admin.{slug}.welcomeparis.hotelmanager.fr a conserver tant qu'il existe en production.
- Le domaine racine welcomeparis.hotelmanager.fr reste reserve a la plateforme, au Super Admin et aux surfaces centrales.
- Le dashboard reception conserve une identite sombre operationnelle.
- La Guest App doit etre premium, mobile-first et differenciee visuellement.
- Aucune donnee CRM privee ne doit etre exposee dans l'app publique.

## 9. Regles de travail
- Travailler par petites etapes.
- Ne pas refactoriser massivement sans validation.
- Ne pas modifier Prisma sans migration claire.
- Ne pas toucher a Coolify/DNS sans demande explicite.
- Toujours verifier le build avant production.
- Preserver le flux critique : client envoie, API sauvegarde, reception voit, reception repond, client voit.
- Les changements d'interface doivent rester modernes, premium, responsives et production-ready.
- Les secrets ne doivent jamais etre affiches dans la documentation.
- Garde-fous staging : ne jamais lancer seed, migration ou deploy sur un environnement non identifie ; ne jamais utiliser production comme staging ; confirmer DB staging dediee, rollback staging et protection des comptes demo avant toute execution hors local.

## 10. Priorites en cours
- Stabiliser la documentation de contexte pour passation a d'autres agents.
- Preparer la phase demo neutre.
- Distinguer audit UI local, staging et production ; ne pas traiter les captures localhost comme etat reel unique.
- Continuer a enrichir la Guest App et les workflows reception sans casser le MVP.
- Executer les futures PR Phase 10 dans un ordre simple : services, tags, tri, supervision Admin Hotel, historique.
- Maintenir la securite multi-tenant comme priorite critique.
- Conserver les validations locales Vague 5F et Vague 6F comme preuves fonctionnelles, sans les confondre avec staging ou production tant que l'environnement public n'est pas clarifie.

## 11. Prochaine etape recommandee
La demo locale est prete RDV avec `demo-paris-local` et Hôtel Lumière Demo Paris. La prochaine etape recommandee est la clarification Coolify/environnement des URLs publiques demo avant toute action staging : identifier web, API, DB, protection d'acces et rollback, sans seed ni migration tant que l'isolation n'est pas prouvee.
