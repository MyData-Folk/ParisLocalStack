# Workflow standard — ParisLocalStack

## Chaîne d'une tâche

```text
Tâche
→ lecture du contexte
→ préflight Git
→ identification de la surface touchée
→ classification AUTO / REVIEW / HUMAN_APPROVAL
→ plan ciblé
→ création de branche
→ modification limitée
→ tests locaux applicables
→ vérification du diff
→ commit
→ PR
→ CI
→ revue
→ merge autorisé
→ déploiement DEMO applicable
→ smoke tests
→ validation fonctionnelle
→ clôture
```

PROD reste hors de cette boucle automatique.

## 1. Cadrer

1. Lire `AGENTS.md`, la mission et les sources pertinentes selon leur hiérarchie.
2. Confirmer dépôt, remote, branche cible, propreté du worktree et synchronisation avec le remote.
3. Rechercher le travail existant et inspecter le code réel de la surface concernée.
4. Classifier `AUTO`, `REVIEW` ou `HUMAN_APPROVAL`. La classification ne crée aucune autorisation.
5. Définir un objectif, des fichiers attendus, des validations et des conditions d'arrêt.

Chaque nouvelle tâche utilise une branche et une PR adaptées à son périmètre, lorsqu'elles sont autorisées. Préserver les modifications existantes et ne jamais les masquer ou les écraser.

## 2. Modifier

1. Créer la branche depuis la cible confirmée.
2. Effectuer le changement minimal ; ne pas ajouter de correction opportuniste.
3. Garder les changements fonctionnels, refactorings et migrations dans des PR distinctes.
4. Si un besoin hors périmètre apparaît, s'arrêter et demander une nouvelle validation.

Pour Prisma, données, auth, autorisations, isolation tenant, infrastructure ou PROD, appliquer `HUMAN_APPROVAL` avant l'action précise. Aucun seed, migration ou déploiement ne doit être lancé sur un environnement non confirmé.

## 3. Valider

1. Exécuter les tests réellement applicables et disponibles dans le dépôt.
2. Vérifier les résultats visibles et les changements d'état attendus, pas seulement l'absence d'erreur.
3. Relire le diff complet, exécuter `git diff --check` et vérifier la liste des fichiers.
4. Renseigner chaque gate de `DEFINITION_OF_DONE.md` par `PASS`, `FAIL` ou `NOT APPLICABLE` avec justification.

Un agent ne dit jamais qu'un test est vert sans l'avoir exécuté. Tout test non exécuté est signalé comme tel. Pour une PR documentaire, builds et tests applicatifs peuvent être `NOT APPLICABLE` avec justification.

## 4. Livrer et suivre

1. Commit atomique et message explicite.
2. Push et PR uniquement si la mission les autorise.
3. Décrire le périmètre, les fichiers, validations réelles, risques, limites et éléments non modifiés.
4. Attendre une CI saine et la revue requise ; l'ouverture d'une PR ne termine pas la tâche.
5. Ne jamais merger automatiquement par défaut.

Politique documentée après merge : Coolify peut auto-déployer DEMO selon ses watch paths. Confirmer l'applicabilité et l'état réel avant de l'annoncer. DEMO est l'environnement de validation ; PROD est protégé, ne sert jamais de staging et exige un déploiement manuel avec validation humaine explicite.

## Échec CI

```text
CI rouge
→ ne pas merger
→ identifier la cause
→ reproduire si possible
→ corriger seulement dans le périmètre autorisé
→ relancer les validations
→ documenter le résultat
```

Une correction autonome n'est permise que si la cause est comprise, reproductible, dans le périmètre initial et sans hausse du niveau de risque. Sinon, arrêter et demander une nouvelle validation.

## Échec DEMO

```text
DEMO rouge
→ ne pas déployer PROD
→ analyser l'échec
→ ne pas masquer le problème par une modification directe de l'environnement
→ corriger par une nouvelle PR ciblée
→ refaire les tests
→ redéployer DEMO
→ revalider
```

Confirmer l'identité de DEMO avant diagnostic. Ne jamais lancer seed, migration, reset, `db push` ou déploiement sur un environnement non identifié.

## Passage en PROD

Seulement après CI saine, validations applicables vertes, DEMO saine, validation fonctionnelle, approbation humaine explicite, cible confirmée et retour arrière adapté. Aucun agent ne déclenche automatiquement PROD et PROD ne doit jamais servir à tester une modification.
