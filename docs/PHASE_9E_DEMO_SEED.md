# PHASE_9E_DEMO_SEED.md

## Objectif
Documenter le seed manuel et isole du tenant demo neutre ParisLocalStack.

Tenant cible : `demo-paris-local`.

Hotel cible : Hôtel Lumière Demo Paris.

Ce seed sert uniquement a preparer une demonstration commerciale avec des donnees 100 % fictives. Il ne remplace pas le seed historique Vendome et ne doit pas etre execute automatiquement.

## Commande future proposee
Commande a ne lancer qu'apres validation explicite :

```bash
npx tsx prisma/seed.demo.ts
```

Cette commande n'a pas ete executee pendant la preparation de cette PR.

## Statut d'execution local
Phase 9E locale validee au 2026-06-02 : le seed demo neutre a ete execute sur la base locale autorisee, apres migrations locales appliquees. Le tenant `demo-paris-local`, l'hotel Hôtel Lumière Demo Paris, les comptes demo et les donnees fictives ont ete verifies localement.

Ce statut local ne valide pas staging ni production.

## Prerequis
- Utiliser uniquement une base locale ou staging explicitement autorisee.
- Ne jamais lancer sur production sans validation explicite.
- Verifier que l'environnement cible ne contient aucun secret visible dans le terminal ou les captures.
- Ne pas modifier `DATABASE_URL` dans Git.
- Ne pas lancer de migration, backup ou restore dans le cadre de ce seed.
- Pour staging : confirmer une DB dediee, une API/Web dedies, une protection d'acces et un rollback avant execution.
- Pour staging : completer la checklist `Validation staging controle avant seed hors local` dans `DEPLOIEMENT.md` avant toute execution.

## Donnees creees
- Hotel fictif `Hôtel Lumière Demo Paris` avec slug `demo-paris-local`.
- Parametres hotel fictifs : Wi-Fi demo, horaires, theme `parisian_boutique`, modules demo actifs.
- Comptes demo fictifs : reception et manager en domaine `.test`.
- Clients fictifs : Camille Martin, Alex Turner, Sofia Rossi et Léa Dubois.
- Sejours demo : chambres 101, 204, 305 et 410.
- Messages demo : petit-dejeuner, taxi, confirmation reception et recommandation locale.
- Demandes demo : taxi CDG, restaurant, serviettes supplementaires et assistance climatisation.
- Avis demo : notes 5/5, 4/5 et 2/5 avec alerte negative fictive.
- Recommandations fictives : restaurant, cafe, musee, pharmacie et transport.

## Strategie d'idempotence
- Hotel : `upsert` par `slug`.
- Users : `upsert` par `email`.
- HotelSettings : `upsert` par `hotelId`.
- HotelUser : `upsert` par contrainte `hotelId_userId`.
- Donnees de demo liees au tenant : suppression ciblee uniquement sur le `hotel_id` du tenant `demo-paris-local`, puis recreation.
- Aucun `deleteMany` global.
- Aucune suppression sur Vendome.

## Securite
- Aucune donnee personnelle reelle.
- Aucun vrai email.
- Aucun vrai telephone.
- Aucune vraie adresse client.
- Aucun secret.
- Les domaines utilises sont reserves : `.test` ou `.example`.

## Rollback manuel recommande
Le rollback doit etre defini dans une phase separee. La strategie recommandee est une suppression ciblee du tenant demo uniquement, par `slug = demo-paris-local` ou par son `hotel_id`, apres validation explicite.

Ne jamais appliquer une suppression globale et ne jamais toucher au tenant Vendome.

## Statut public / staging
Les URLs publiques demo ne sont pas validees comme staging au 2026-06-02 :
- Guest App publique : HTTP 200 mais `Hotel not found`.
- Admin/Reception publique : HTTP 200 avec login generique.
- DB dediee, API dediee, web dedie, protection d'acces et absence de donnees reelles : non verifies.

Decision : seed staging interdit tant que l'isolation n'est pas prouvee.

Checklist obligatoire avant seed hors local :
- environnement staging identifie par nom ;
- web/API/PostgreSQL staging dedies ;
- confirmation que `DATABASE_URL` ne pointe pas vers production, sans afficher sa valeur ;
- domaines staging/demo associes ;
- protection d'acces ou decision explicite d'exposition publique ;
- absence de donnees reelles ;
- rollback staging et suppression ciblee du tenant demo definis ;
- validations `/health`, `/ready`, Guest App, Reception/Admin sans exposition de credentials.
