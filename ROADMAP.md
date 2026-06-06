# ROADMAP.md - ParisLocalStack

## Termine
- Architecture SaaS multi-tenant.
- Frontend React/Vite/Tailwind.
- Backend Express/Prisma/PostgreSQL.
- Deploiement Coolify.
- Auth JWT reelle.
- Roles super_admin, hotel_admin, receptionist, guest selon architecture.
- Super Admin avec gestion hotels/utilisateurs selon etat connu.
- Generator hotel.
- Onboarding hotel.
- Onboarding client.
- Guest App concierge premium.
- Dashboard Reception.
- Messagerie client/reception.
- Demandes service.
- Avis clients avec moderation selon dernier etat connu.
- CRM reception.
- Clients presents / historique.
- Fiche client/sejour avec timeline.
- QR code hotel et export.
- Exports CRM.
- Themes Guest App initiaux.
- Recommandations par hotel.
- Monitoring et sauvegardes documentes.
- Strategie commerciale documentee.
- Runbook demo commerciale documente.
- Creation des fichiers de contexte projet.
- PR #47 : Playwright et axe UI audit tooling ajoutes.
- PR #48 : etat d'erreur Guest App poli pour eviter l'affichage brut `Internal server error`.
- Phase 9E-6 : seed demo neutre isole prepare en fichier manuel non automatique.
- Phase 9E locale : tenant `demo-paris-local` / Hôtel Lumière Demo Paris valide localement, donnees fictives, Guest App OK, Reception OK, Admin Hotel OK.
- Phase 9E post-login locale : Super Admin, Reception demo et Admin Hotel demo valides localement ; Vendome absent du parcours demo Reception/Admin Hotel.
- Vague 5 Guest App cards : PR #81 modele `guestCards` + `commercialPackage`, PR #82 API plan commercial, PR #84 UI Super Admin plan + Hotel Admin lecture seule, PR #85 API dediee guest-cards, PR #86 editeur Hotel Admin des cartes Guest App.
- Vague 5F finalisee : PR #87 API publique expose `guestCards` actifs tries et tronques par plan, PR #88 composants isoles `GuestHeroCard` / `GuestShortcutCard` avec support securise `external_url`, PR #89 branchement `GuestShell` avec fallback legacy strict vers le rendu historique. Audit UI local 6/6, typecheck/build OK, aucun secret expose.
- Vague 6B finalisee : PR #91 fondation types/schemas `HotelServiceConfig`, helpers `getHotelServicePlanLimits` et `enforceHotelServicePlanLimits` dans le package shared.
- Vague 6C finalisee : PR #92 migration `HotelSettings.enabledServices Json` (`20260603120000_add_hotel_enabled_services`), routes `GET/PATCH /api/hotels/:hotelId/services` (super_admin ou hotel_admin, validation stricte du forfait), helpers web `getHotelServices` / `updateHotelServices`, casts Prisma nettoyes.
- Vague 6D finalisee : section Super Admin "Services autorises" dans le detail hotel, lisant `SERVICE_CATALOG` et bloquant les services hors forfait selon le plan.
- Vague 6E finalisee : Hotel Admin personnalise les services autorises pour son hotel, dans les limites du forfait attribue par Super Admin.
- Vague 6F finalisee localement : PR #95 expose `enabledServices` dans les settings publics avec DTO safe, PR #96 ajoute `useEnabledServices`, PR #97 branche la Guest App sur les services actifs avec fallback legacy strict. Validation locale : health/ready/web OK, fallback legacy OK, Taxi et Room service dynamiques OK, service desactive masque, mobile 375px OK, audit UI 6/6, typecheck/build OK.

## En cours
- Stabilisation de la documentation officielle de passation.
- Clarification de l'environnement public/staging pour `demo-paris-local` avant toute action hors local.
- Formalisation des preuves staging obligatoires avant seed, migration ou deploy hors local.
- Consolidation UX produit avant commercialisation.
- Cadrage Phase 10 : services client, tags de demandes, supervision Admin Hotel, tri clients presents et historique client.
- Refactorisation progressive des gros fichiers frontend, uniquement par phases validees.
- Distinction audit UI local / staging / production apres les observations du 2026-06-02.

## A faire
- Confirmer quel web/API/DB servent les domaines publics `demo-paris-local` et `admin-demo-paris-local`.
- Prouver une DB staging dediee, une protection d'acces et un rollback staging avant tout seed hors local.
- Appliquer la checklist `Validation staging controle avant seed hors local` de `DEPLOIEMENT.md`.
- Relancer l'audit Playwright sur un environnement representatif uniquement apres clarification staging.
- Enrichir les formulaires de demandes service.
- Phase 10A : reorganiser les services client et categories.
- Phase 10B : afficher les tags visibles des demandes cote Reception.
- Phase 10C : ajouter les controles de tri clients presents.
- Phase 10D : ajouter une supervision demandes cote Admin Hotel.
- Phase 10E : clarifier historique client et archivage apres depart.
- Finaliser la gestion recommandations avancee si besoin.
- Nettoyer les pages orphelines apps/web/src/pages.
- Renforcer le typage frontend API.
- Continuer a decomposer les monofichiers frontend.
- Ajouter tests automatises cibles si priorite commerciale.
- Produire supports de vente et onboarding client.

## Bloque
Aucun blocage documente dans cette passe.

Information non verifiee : etat live exact production au moment de ce document.

## Priorite immediate
Phase 9E : tenant demo neutre.

Objectif : disposer d'une demonstration commerciale sans donnees reelles, couvrant Guest App, Reception, CRM, demandes, avis et QR code.

Tenant valide : `demo-paris-local`.

Hotel valide : Hôtel Lumière Demo Paris.

Point de vigilance : l'audit Playwright/axe local est operationnel et utile, mais il ne doit pas etre confondu avec l'etat staging ou production si l'API, la DB ou le tenant demo ne sont pas disponibles localement.

Statut public actuel : la Guest App publique `https://demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 mais affiche `Hotel not found`; l'URL `https://admin-demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 avec un login generique. Staging non valide, separation staging/production non verifiee.

Statut local post-login : pret RDV local. Super Admin reste une surface interne uniquement et ne doit pas etre montre au prospect.

## Statut Vague 5 - Cartes Guest App
La configuration produit des cartes Guest App est partiellement integree :
- PR #81 : modele `guestCards` et champ `commercialPackage` integres.
- PR #82 : API plan commercial et limites de forfait integrees.
- PR #84 : Super Admin peut modifier le forfait ; Hotel Admin le voit en lecture seule.
- PR #85 : API privee dediee `guest-cards` integree.
- PR #86 : Hotel Admin peut editer les cartes Guest App selon son forfait.

Champs configurables par Hotel Admin : image, titre, description, action, cible, ordre et actif/inactif.

Limites : Super Admin reste maitre du forfait. Hotel Admin reste limite par son forfait. Vague 5F est finalisee localement : `GuestShell` lit les cartes actives via l'API publique safe et conserve le rendu legacy si aucune carte exploitable n'est disponible. Staging et production ne sont pas encore valides.

## Statut Vague 6 - Services configurables
La configuration produit des services hotel est integree localement :
- PR #91 : types/schemas `HotelServiceConfig` et catalogue partages.
- PR #92 : stockage `HotelSettings.enabledServices`, API privee `GET/PATCH /api/hotels/:hotelId/services` et limites de forfait.
- PR #93 : Super Admin attribue les services autorises par hotel.
- PR #94 : Hotel Admin personnalise les services autorises et voit les limites.
- PR #95 : API publique settings expose uniquement les services publics actifs et les limites safe.
- PR #96 : hook frontend `useEnabledServices`.
- PR #97 : Guest App affiche les services dynamiques actifs avec fallback legacy strict.

Validation locale 6F : API health OK, API ready OK, web local OK, Guest App demo sans erreur, Taxi dynamique visible et formulaire conserve, Room service dynamique visible et formulaire conserve, service desactive masque, fallback legacy conserve si aucun service dynamique actif, mobile 375px OK, audit UI 6/6, typecheck/build OK. Les tests temporaires locaux ont restaure l'etat initial.

Limites : Super Admin reste maitre des services attribues et du forfait ; Hotel Admin personnalise seulement les services autorises ; la Guest App n'affiche que les services actifs/visibles. Staging et production ne sont pas encore valides.

## Priorite suivante
Apres clarification staging : proteger les URLs demo si elles restent publiques, valider un environnement staging dedie, puis lancer les petites PR Phase 10 dans l'ordre recommande par `docs/PRODUCT_ROADMAP_SERVICES_REQUESTS_HISTORY.md` : services/categories, tags demandes, tri clients presents, supervision Admin Hotel, historique client.
