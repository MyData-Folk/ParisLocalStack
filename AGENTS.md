# Gouvernance des agents — ParisLocalStack

## Mission et périmètre

ParisLocalStack (Paris Local) est une plateforme SaaS B2B multi-tenant pour hôtels. Une seule plateforme sert tous les hôtels : ne jamais créer une application ou une base indépendante par hôtel.

Ce fichier fixe les règles permanentes applicables à tout agent. Une mission n'autorise que son périmètre explicite ; le niveau de risque ne vaut jamais autorisation générale.

## Architecture réelle

- Monorepo npm : `apps/web`, `apps/api`, `packages/shared`, `prisma`.
- Web : React, TypeScript, Vite, Tailwind et React Router.
- API : Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT et Socket.IO.
- Déploiement conteneurisé : Docker et politique Coolify documentée.
- Surfaces : Super Admin, Generator, Guest App, Hotel Admin et Réception.

Vérifier l'état courant du code avant de décrire une route, un script ou une capacité. L'état externe de Coolify, DEMO, PROD, DNS et Cloudflare n'est pas prouvé par le dépôt seul.

## Sources de vérité

Pour la gouvernance, appliquer dans cet ordre :

1. décisions humaines explicites de la mission en cours ;
2. `DECISIONS.md` ;
3. `PROJECT_BRAIN.md` ;
4. `docs/DEPLOYMENT_CONTROL.md` et `DEPLOIEMENT.md` ;
5. `RISQUES.md`.

Pour l'implémentation : état réel de `main`, puis `ARCHITECTURE_REALITY_CHECK.md`, les README et les autres documents. `CODEX_PROMPT.md` est un contexte historique, pas une autorité finale.

En cas de contradiction, ne pas trancher silencieusement. Signaler les sources et demander une décision si la sécurité, le multi-tenant, Prisma, l'authentification, Coolify ou le déploiement sont concernés.

Ordre des instructions : règles de la plateforme d'exécution, demande humaine explicite, gouvernance du dépôt, puis documentation contextuelle. Une instruction plus locale ne peut pas assouplir une règle de sécurité ou élargir la mission.

## Règles de travail et préflight

Avant toute modification :

- confirmer le dépôt, le remote et la branche cible ;
- vérifier que la branche cible correspond au remote attendu ;
- contrôler le worktree et préserver tout travail existant ;
- rechercher branche, PR ou fichiers équivalents ;
- lire les sources pertinentes et inspecter la surface réellement touchée ;
- identifier les commandes réellement disponibles dans les `package.json` ;
- classifier le changement et annoncer tout blocage.

S'arrêter si le dépôt ou la cible ne sont pas confirmés, si des modifications non liées sont présentes, si un travail équivalent non vérifié existe ou si une contradiction critique empêche une règle fiable. Ne pas contourner un worktree sale par stash, suppression ou écrasement.

Travailler par petite branche, diff ciblé et PR dédiée. Ne pas élargir silencieusement le périmètre. La création d'une branche, d'un commit, d'un push ou d'une PR doit être prévue par la mission. Le merge n'est jamais automatique par défaut.

## Niveaux d'autonomie

La classification mesure le risque ; elle n'accorde aucune permission au-delà de la mission.

### `AUTO`

Préparation, tests et proposition possibles si la mission les autorise et si les validations applicables passent : documentation, tests sans effet runtime, texte, accessibilité ou CSS strictement locaux, composant réellement isolé, nettoyage local sans impact fonctionnel.

`AUTO` n'autorise jamais merge, PROD, action sensible ou irréversible, nouvelle PR non demandée, ni extension du périmètre. Reclassifier dès qu'un parcours critique, un gros composant, l'authentification, les autorisations ou l'isolation tenant sont touchés.

### `REVIEW`

Revue humaine ou technique obligatoire avant merge : logique métier, endpoint API non sensible, parcours Guest, Réception, CRM, analytics, forfaits, modules/services, composant existant important, affichage fondé sur une permission existante ou changement multi-surface.

### `HUMAN_APPROVAL`

Autorisation humaine explicite, ciblant l'action et l'environnement, avant toute action sensible, irréversible ou structurante :

- PROD, DNS, Cloudflare, Coolify PROD, secrets ou variables d'environnement ;
- authentification structurante, autorisation, middleware de sécurité, `requireHotelAccess` ou équivalent ;
- règles `hotelId`/`hotelSlug`, isolation par hôtel ou confidentialité CRM ;
- architecture, schéma Prisma, migration, seed, reset, écriture/transformation/suppression de données ;
- suppression massive, refactoring massif ou stratégie de déploiement.

L'approbation d'un plan général ne vaut pas autorisation d'une opération destructive.

## Sécurité multi-tenant

- Toute route privée applique authentification et contrôle d'accès adaptés.
- Toute ressource privée est rattachée côté serveur à l'hôtel autorisé.
- Un identifiant client ou `hotelSlug` seul ne prouve jamais l'autorisation ; valider aussi séjour, utilisateur et ressource.
- Rejeter toute lecture, écriture, requête, message ou utilisation d'identifiant cross-tenant.
- Appliquer la même isolation aux rooms et événements Socket.IO.
- Ne jamais exposer de données CRM privées par une route publique.
- Logs, erreurs et réponses API ne doivent révéler aucune donnée d'un autre hôtel.

Toute violation cross-tenant est `CRITICAL — NO MERGE`.

## Tests et petites PR

- Une PR traite un seul objectif cohérent ; séparer refactoring, migration et changement fonctionnel.
- Exécuter uniquement les validations applicables et disponibles ; ne jamais inventer une commande.
- Ne jamais annoncer un test vert sans l'avoir exécuté. Marquer les tests non exécutés.
- Selon le périmètre, les scripts racine disponibles incluent `npm run typecheck`, `npm run build`, `npm run build:web`, `npm run build:api` et `npm run audit:ui`. Le package partagé expose aussi `test:matrix`.
- Vérifier le diff, `git diff --check` et la liste exacte des fichiers avant commit et PR.

## Prisma, migrations et base de données

- Toute modification de schéma ou migration est `HUMAN_APPROVAL`, versionnée, isolée et assortie d'un plan de validation/retour arrière.
- Ne jamais lancer migration, seed, reset, `db push`, backup, restore ou écriture manuelle sans identité certaine de l'environnement et autorisation adaptée.
- Ne jamais utiliser PROD comme staging ni synchroniser destructivement le schéma PROD.
- Avertissement : `scripts/entrypoint.sh` exécute `npx prisma migrate deploy` au démarrage du conteneur API.
- Avertissement : `prisma/seed.ts`, `prisma/seed.demo.ts` et `apps/api/src/database/seedProduction.ts` écrivent en base lorsqu'ils sont lancés ; le seed général contient un fallback historique Vendôme. Ils ne doivent jamais être exécutés par supposition.

## DEMO et PROD

Politique documentée : PR → merge dans `main` → auto-déploiement DEMO filtré selon les watch paths → validation DEMO → déploiement PROD manuel.

- DEMO est l'environnement de validation ; confirmer son identité avant toute action.
- PROD est protégé, ne sert jamais de staging et son Auto Deploy doit rester désactivé.
- Aucun agent ne déploie automatiquement en PROD.
- PROD exige validation humaine explicite, environnement confirmé et plan de retour arrière adapté.
- Ne pas présenter la configuration externe comme vérifiée sans preuve directe actuelle.

## Composants complexes et interdictions

Avant un gros refactoring, surtout dans Réception : couvrir le comportement, séparer refactoring et fonctionnalité, créer branche/PR dédiées, limiter le périmètre, obtenir la validation adaptée et vérifier les parcours avant/après.

Interdits sans mission et autorisation explicites : secrets dans le dépôt ou les rapports, données réelles de démonstration, contournement de sécurité, action destructive, déploiement PROD, mutation DNS/Cloudflare/Coolify, opération DB, refactoring ou changement fonctionnel opportuniste.

## Fin de tâche

Une tâche est terminée uniquement lorsque les gates applicables de `DEFINITION_OF_DONE.md` sont renseignées, les validations réellement exécutées sont rapportées, le diff respecte le périmètre et le workflow autorisé est arrivé à son terme. Compiler ou ouvrir une PR ne suffit pas. Suivre `WORKFLOW.md` et signaler clairement limites, risques et éléments non vérifiés.
