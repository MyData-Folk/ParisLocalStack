# Definition of Done — ParisLocalStack

## Utilisation

Pour chaque PR, marquer chaque gate `PASS`, `FAIL` ou `NOT APPLICABLE`. Toute mention `NOT APPLICABLE` doit être justifiée. Une gate ne peut pas être ignorée. Une tâche n'est jamais terminée uniquement parce que le code compile ou qu'une PR est ouverte.

## GATE 0 — SCOPE

- Périmètre demandé respecté et classification de risque confirmée.
- Aucun fichier imprévu ni travail utilisateur écrasé.
- Diff complet relu ; branche et cible confirmées.

## GATE 1 — STATIC

Selon le périmètre :

- dépendances installables ;
- lint vert si une commande existe et s'applique ;
- typecheck et build verts ;
- aucun nouvel avertissement critique.

Pour une PR strictement documentaire, les builds applicatifs peuvent être `NOT APPLICABLE` avec la justification « aucun changement runtime ».

## GATE 2 — API

Si l'API est concernée :

- `/health` et `/ready` répondent correctement ;
- routes touchées testées avec entrées valides et invalides ;
- erreurs attendues correctement gérées ;
- aucune information sensible exposée.

Vérifier les chemins et commandes dans l'implémentation réelle.

## GATE 3 — SECURITY

Si la sécurité ou des données privées sont concernées :

- authentification et autorisations vérifiées ;
- rattachement utilisateur-hôtel et ressource-hôtel vérifié côté serveur ;
- lectures et écritures cross-tenant rejetées ;
- aucune fuite inter-hôtel ni donnée CRM privée publique ;
- isolation Socket.IO vérifiée si concernée.

Toute violation cross-tenant produit `CRITICAL — NO MERGE`.

### Matrice multi-tenant à automatiser

Le futur jeu de tests doit contenir au minimum `HOTEL_A`, `HOTEL_B`, `receptionist_A`, `receptionist_B`, `hotel_admin_A`, `hotel_admin_B`, `guest_A` et `guest_B`, puis vérifier :

- `receptionist_A` ne lit ni ne modifie `HOTEL_B` ;
- `hotel_admin_A` ne lit ni ne modifie `HOTEL_B` ;
- `guest_A` ne peut utiliser un séjour de `HOTEL_B` ;
- un `stayId` ou identifiant de ressource de `HOTEL_B` est rejeté dans le contexte `HOTEL_A` ;
- toute incohérence `hotelSlug` / `stayId` / hôtel réel est rejetée ;
- requête, message et événement Socket.IO cross-tenant sont rejetés ;
- aucune erreur ne révèle les données de l'autre hôtel.

## GATE 4 — BUSINESS

Pour chaque surface touchée — Guest, Réception, Hotel Admin, Super Admin ou Generator — le comportement existant reste valide et toute règle métier modifiée est testée explicitement.

## GATE 5 — E2E

Pour tout parcours critique concerné, tester la chaîne complète et ses états visibles. Exemple : Guest → API → Réception → traitement/changement de statut → réponse Guest.

## GATE 6 — DEMO

Si un déploiement DEMO est applicable :

- identité de l'environnement confirmée ;
- déploiement réussi ;
- `/health` et `/ready` vérifiés ;
- smoke tests et contrôle visuel nécessaires réussis ;
- aucune erreur critique sur les parcours touchés.

Ne pas déduire l'état externe de DEMO depuis la seule documentation du dépôt.

## GATE 7 — HUMAN VALIDATION

Obligatoire pour `REVIEW` et `HUMAN_APPROVAL`. La validation porte sur le périmètre réel. Pour `HUMAN_APPROVAL`, une approbation générale du plan ne suffit pas à autoriser une action sensible ou destructive : action et environnement doivent être nommés.

## GATE 8 — PROD

PROD exige :

- CI saine et tests applicables verts ;
- DEMO saine et validation fonctionnelle ;
- validation humaine explicite du responsable ;
- environnement cible confirmé ;
- plan de retour arrière adapté au risque.

PROD ne sert jamais de staging et ne doit jamais être automatiquement déployée par un agent.

## Compte rendu minimal

Rapporter le statut et la justification de chaque gate, les commandes réellement exécutées, leurs résultats exacts, les tests non exécutés, les risques restants et toute contradiction de sources. Une seule gate `FAIL` interdit de déclarer la tâche terminée ou de merger.
