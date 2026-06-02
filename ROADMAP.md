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

## En cours
- Stabilisation de la documentation officielle de passation.
- Preparation du tenant demo neutre `demo-paris-local` pour Hôtel Lumière Demo Paris.
- Consolidation UX produit avant commercialisation.
- Refactorisation progressive des gros fichiers frontend, uniquement par phases validees.
- Distinction audit UI local / staging / production apres les observations du 2026-06-02.

## A faire
- Creer le tenant demo neutre `demo-paris-local` avec donnees 100 % fictives.
- Tester le scenario demo complet.
- Preparer un seed demo neutre isole, sans execution automatique ni donnees reelles.
- Stabiliser les acces demo et relancer l'audit Playwright sur un environnement representatif.
- Enrichir les formulaires de demandes service.
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

## Priorite suivante
Apres tenant demo : auditer le seed demo neutre, stabiliser les acces demo, tester un rendez-vous commercial pilote, corriger les irritants UX identifies, prioriser les modules P2 selon retours prospects, continuer la refactorisation frontend sans modifier la logique metier.
