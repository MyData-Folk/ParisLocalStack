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
