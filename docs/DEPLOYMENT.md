# Déploiement Coolify — Paris Local

## Prérequis
- VPS avec Coolify installé
- Wildcard DNS *.welcomeparis.hotelmanager.fr configuré
- Certificat SSL wildcard actif

## Variables d'environnement requises

| Variable | Description | Exemple |
|---|---|---|
| DATABASE_URL | URL PostgreSQL complète | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret JWT 32+ caractères | générer avec scripts/generate-secrets.sh |
| CORS_ORIGIN | Origine frontend autorisée | https://welcomeparis.hotelmanager.fr |
| NODE_ENV | Environnement | production |
| API_PORT | Port de l'API | 4000 |
| SEED_ADMIN_PASSWORD | Mot de passe super admin initial | générer avec scripts/generate-secrets.sh |

## Première mise en production

1. Configurer toutes les variables d'environnement dans Coolify
2. Déployer le service PostgreSQL
3. Déployer le service API (les migrations se lancent automatiquement via entrypoint.sh)
4. Vérifier les logs : chercher "Server running on port"
5. Lancer le seed production via le terminal Coolify :
   node apps/api/dist/database/seedProduction.js
6. Déployer le service Web
7. Vérifier : GET https://api.welcomeparis.hotelmanager.fr/health → { "status": "ok" }

## Seed production

Commande à lancer UNE SEULE FOIS via terminal Coolify (container API) :
node apps/api/dist/database/seedProduction.js

Le script est idempotent — il peut être relancé sans créer de doublons.

## Rollback migration

En cas de problème après migration :
1. Identifier la migration précédente : npx prisma migrate status
2. Rollback manuel : les migrations Prisma ne sont pas réversibles automatiquement
3. Procédure : restaurer le backup PostgreSQL pris avant le déploiement
4. Puis redéployer la version précédente du code sur Coolify

⚠️ Toujours faire un backup PostgreSQL avant un déploiement avec migrations.

## Checklist déploiement

Avant chaque déploiement :
- [ ] Lancer scripts/pre-deploy-check.sh localement
- [ ] Vérifier git log — aucun commit non testé
- [ ] Backup PostgreSQL effectué
- [ ] Variables d'environnement Coolify vérifiées
- [ ] Tester en local avec NODE_ENV=production

## Backups PostgreSQL manuels

### Prérequis

Les scripts de backup utilisent :

- `pg_dump` — présent dans l'image postgres:16-alpine
- `psql` — présent dans l'image postgres:16-alpine
- `gzip` — présent dans l'image postgres:16-alpine
- `aws CLI` (AWS CLI ou compatible S3) — pour l'upload vers R2

Les sauvegardes sont stockées dans un bucket Cloudflare R2. Par défaut, le script utilise `S3_BUCKET` comme bucket. Si `BACKUP_S3_BUCKET` est défini, il prend priorité (recommandé pour séparer backups et médias).

Les identifiants AWS (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) sont mappés automatiquement.

### Variables d'environnement

| Variable | Description |
|---|---|
| `BACKUP_S3_BUCKET` | Bucket R2 dédié aux backups (optionnel, défaut : `$S3_BUCKET`) |
| `BACKUP_RETENTION_DAYS` | Jours de rétention (défaut : 7, 0 pour désactiver) |
| `BACKUP_PREFIX` | Préfixe dans le bucket (défaut : `backups/postgres`) |
| `S3_ENDPOINT` | Endpoint R2 |
| `S3_ACCESS_KEY_ID` | Clé d'accès R2 |
| `S3_SECRET_ACCESS_KEY` | Clé secrète R2 |
| `S3_REGION` | Région (défaut : auto) |

### Backup manuel

```bash
./scripts/backup-postgres.sh
```

Le script :
1. Lance `pg_dump` + `gzip` dans un fichier temporaire
2. Upload le fichier vers le bucket R2 (`s3://BACKUP_S3_BUCKET/BACKUP_PREFIX/backup_YYYY-MM-DD_HH-MM-SS.sql.gz`)
3. Nettoie le fichier local après upload
4. Supprime les backups plus vieux que `BACKUP_RETENTION_DAYS`

### Restore

```bash
./scripts/restore-postgres.sh backup_2026-06-01_12-00-00.sql.gz
```

Le script :
1. Demande une confirmation explicite (`taper RESTORE`)
2. Télécharge depuis R2
3. Décompresse et restaure avec `psql`
4. Nettoie le fichier après succès

### Procédure avant déploiement

1. Lancer `./scripts/backup-postgres.sh`
2. Vérifier que le fichier est présent dans le bucket R2
3. Déployer
4. Vérifier `/health` et `/ready`

### Avertissement RGPD

Les backups contiennent des données personnelles (emails, téléphones, noms).
Le bucket backup doit être **privé** et **séparé** du bucket média.
Ne jamais stocker de backups dans un espace public ou accessible sans authentification.

## Monitoring externe et alerting

Phase 8f-1 recommande un monitoring externe léger. Il doit rester indépendant de
Coolify afin de détecter les indisponibilités vues depuis Internet.

### Endpoints à surveiller

| Surface | URL | Sens attendu |
|---|---|---|
| Site principal | `https://welcomeparis.hotelmanager.fr` | Le frontend public répond. |
| API liveness | `https://api.welcomeparis.hotelmanager.fr/health` | L'API Express est vivante. |
| API readiness | `https://api.welcomeparis.hotelmanager.fr/ready` | L'API répond et PostgreSQL est joignable. |
| Guest App Vendôme | `https://vendome.welcomeparis.hotelmanager.fr` | Exemple d'app client hôtel accessible. |
| Réception Vendôme | `https://admin-vendome.welcomeparis.hotelmanager.fr` | Format réception recommandé. |
| Réception Vendôme legacy | `https://admin.vendome.welcomeparis.hotelmanager.fr` | Ancien format supporté pour compatibilité. |

`/health` est un signal de vie léger : il doit répondre `200` avec
`{ "status": "ok" }`.

`/ready` est le signal applicatif critique : il vérifie PostgreSQL. Il doit
répondre `200` avec `status=ready` et `database=ok`. Une réponse `503` doit
déclencher une alerte, car elle indique que l'API tourne mais que la base de
données n'est pas disponible.

### Outils recommandés

- Better Stack Free ou Uptime Kuma pour les checks HTTP externes.
- Healthchecks.io, Better Stack Heartbeat ou un push monitor Uptime Kuma pour le
  cron backup.
- Ne jamais commiter d'URL secrète de ping, de webhook, de token ou de clé dans
  Git. Les URLs de ping doivent rester dans Coolify ou dans le gestionnaire de
  secrets de l'outil choisi.

### Backup cron

Le backup PostgreSQL R2 est validé, y compris le restore staging/test.

Configuration production attendue côté cron Coolify :

```txt
schedule: 0 0 * * *
BACKUP_PREFIX=backups/postgres/prod
BACKUP_RETENTION_DAYS=7
```

Le besoin restant est l'alerte si le cron échoue ou ne s'exécute pas. La
stratégie recommandée est d'ajouter ultérieurement un ping de succès vers un
service de heartbeat, puis un ping d'échec dans le chemin d'erreur. Cette étape
doit se faire sans exposer l'URL de ping dans le dépôt.

### Runbook incident

#### `/health` down

1. Vérifier l'état du service API dans Coolify.
2. Consulter les logs API structurés Pino avec le dernier `requestId` connu si
   disponible.
3. Vérifier que le container API démarre et que le healthcheck Docker n'est pas
   en échec.
4. Redémarrer le service API uniquement si la cause est comprise ou si la
   récupération automatique échoue.

#### `/ready` down

1. Considérer l'incident comme lié à PostgreSQL ou à la connexion API -> DB.
2. Vérifier le service PostgreSQL Coolify et son espace disque.
3. Vérifier les logs API pour les entrées `database unreachable`.
4. Ne pas lancer de migration, `db push`, reset ou restore pour résoudre un
   simple incident readiness.

#### Site web down

1. Vérifier le service web Coolify et le routage domaine/SSL.
2. Vérifier que l'API répond encore via `/health` et `/ready`.
3. Si seule une app hôtel est touchée, vérifier la résolution DNS du sous-domaine.

#### Backup cron échoue

1. Ne pas relancer immédiatement un restore.
2. Vérifier le log du cron Coolify.
3. Vérifier l'accès au bucket R2 dédié backup, sans utiliser le bucket média.
4. Vérifier `BACKUP_PREFIX=backups/postgres/prod` et `BACKUP_RETENTION_DAYS=7`.
5. Relancer un backup manuel seulement après validation explicite.

#### Disque saturé

1. Vérifier les volumes Coolify/PostgreSQL et le volume uploads.
2. Ne pas supprimer de données métier sans plan de sauvegarde.
3. Vérifier que les fichiers temporaires de backup sont bien nettoyés.
4. Augmenter le stockage ou purger uniquement des artefacts non critiques
   identifiés.

#### R2 inaccessible

1. Vérifier Cloudflare R2, le bucket `paris-local-backups` et les droits du
   token backup.
2. Ne pas basculer vers le bucket média `S3_BUCKET=parislocalstack-prod`.
3. Conserver les backups dans un bucket privé et séparé.
4. Reprendre les backups uniquement quand le bucket dédié est accessible.

### Règles de sécurité

- Aucune clé, aucun token, aucune URL de webhook secrète dans la documentation.
- Ne jamais restaurer sur production.
- Les backups contiennent des données personnelles et doivent rester privés.
- Les alertes doivent éviter de contenir des données client ou des secrets.
