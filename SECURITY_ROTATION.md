# SECURITY_ROTATION.md - Rotation des secrets ParisLocalStack

> Derniere mise a jour : 2026-06-07

## Vue d'ensemble

Ce document centralise la rotation des secrets d'environnement et des mots de passe utilisateur de ParisLocalStack. Il documente le contexte, les methodes utilisees, les resultats des verifications, et les risques residuels.

Date de demarrage : 2026-06-06
Date de cloture partielle (2C-A) : 2026-06-07
Statut global : en cours

## 1. Phase 1 - Audit (SECURITY-ROTATION-1)

Date : 2026-06-06
Methode : revue exhaustive des sources de secrets.

Categories de secrets identifiees :

1. **Token Coolify** (machine Windows)
2. **Variables d'environnement Coolify** (DATABASE_URL, JWT_SECRET, SEED_DEMO_*, S3_*, BACKUP_*, NODE_ENV, etc.)
3. **Mots de passe DB PostgreSQL** (prod + clone)
4. **Mots de passe utilisateur** seed dans Prisma
5. **Secrets S3 / Cloudflare R2** (tokens d'acces)
6. **Cles d'API externes** (futures : Google Maps, RATP, etc.)

Resultat : 18 env vars intactes par service (sauf SEED_DEMO_* retirees par CLEANUP-DEMO-2). 2 comptes seed vulnerables identifies.

## 2. Phase 2A - Rotation mot de passe DB PostgreSQL prod

Date : 2026-06-06
Service : API prod (`m2rfu2ypdlq07jylh59e8oh6`) + DB prod (`hl7aaurvn9xrmj5y3g6bw5ds`)

Methode :
- `ALTER USER paris_local WITH PASSWORD '<44 chars base64url>'` execute manuellement via terminal UI Coolify sur le conteneur DB prod.
- Mise a jour manuelle de la DATABASE_URL sur l'API prod (coller la nouvelle valeur dans l'UI Coolify, car `coolify_env_vars.update` retourne `real_value` en clair).
- Redéploiement manuel de l'API prod via UI Coolify (le token Coolify n'a pas la permission `deploy`).

Verifications :
- API prod `/health`=200
- API prod `/ready`=200 `{"status":"ready","database":"ok"}`
- API prod `/vendome`=200
- API clone intacte (isolation preservee)

Statut : **adopte, valide**.

## 3. Phase 2B - Rotation JWT_SECRET prod

Date : 2026-06-06
Service : API prod uniquement

Methode :
- Generation d'un nouveau JWT_SECRET (64 octets, encodage base64url) via `node -e`.
- Mise a jour via MCP `coolify_env_vars.update` sur l'env var dediee (cle `JWT_SECRET`, UUID service `m2rfu2ypdlq07jylh59e8oh6`).
- Redéploiement manuel UI Coolify.
- Important : UUID env var `JWT_SECRET` est partage avec l'API clone, mais ciblage par couple `(service_uuid, key)` garantit l'absence d'ambiguite.

Verifications :
- API prod `/health`=200
- API prod `/ready`=200
- API prod `/vendome`=200
- Login `reception@vendome.test` avec ancien mot de passe maitre : 200 (la rotation 2A a deja eu lieu)
- Login `admin@paris-local.test` avec mot de passe dev : 200
- `/api/auth/me` SANS token : 401
- `/api/auth/me` avec token bidon : 401
- `/api/auth/me` avec token valide : 200
- API clone intacte
- Logs API prod propres, nouveau conteneur `20c8e455cdee` post-redéploiement

Statut : **adopte, valide**.

## 4. Phase 2C - Audit mots de passe utilisateur

Date : 2026-06-06

Methode : analyse du schema Prisma (`prisma/seed.ts:7`), des routes API (`apps/api/src/modules/hotels/routes.ts:93-108`), et de la base de donnees prod.

Resultat : 2 comptes seed vulnerables (super_admin + receptionist Vendome), tous deux utilisant le mot de passe dev par defaut `ChangeMe123!` en clair dans le code source.

Note technique : `apps/api/src/modules/hotels/routes.ts:99-101` refuse par construction la modification du mot de passe d'un super_admin via l'endpoint PATCH standard. Aucune route dediee n'existe. La rotation du super admin necessite un acces direct a la base de donnees.

Statut : **audit termine**.

## 5. Phase 2C-A - Rotation mot de passe receptionniste Vendome

Date : 2026-06-07
Service : API prod
Hotel : Vendome (UUID `d887a5f7-665a-4782-85ad-e6a4f780ab90`)
Utilisateur : `reception@vendome.test` (UUID `5473057e-e9c3-4814-8927-0e99bbc1e0b6`)

Methode :
- Generation d'un nouveau mot de passe (43 chars base64url) via `node -e`.
- Login super_admin (compte dev `ChangeMe123!`) pour obtenir un token d'administration (car le compte receptionniste n'a pas le droit de modifier son propre mot de passe via PATCH).
- PATCH `/api/hotels/d887a5f7-665a-4782-85ad-e6a4f780ab90/users/5473057e-e9c3-4814-8927-0e99bbc1e0b6` avec `{"password":"<43 chars base64url>"}` (autorise par `adminUserUpdateSchema` ligne 108).
- Tests post-rotation.

Verifications :
- Login `reception@vendome.test` avec ancien mdp `ChangeMe123!` : 401 (revocation OK)
- Login `reception@vendome.test` avec nouveau mdp : 200 + JWT 188 chars
- `/api/auth/me` avec le nouveau token : 200, retourne `{"id":"5473057e-...","email":"reception@vendome.test","name":"Reception Vendome","role":"receptionist","status":"active","hotelIds":["d887a5f7-..."]}`
- `/api/auth/me` SANS token : 401 (middleware auth toujours actif)
- Login `admin@paris-local.test` avec mdp dev `ChangeMe123!` : 200 (non touche, isole)
- API clone `/ready`=200 `{"status":"ready","database":"ok"}` (intacte)

Statut : **adopte, valide**.

## 6. Phase 2C-B - Rotation mot de passe super admin (BLOQUE)

Date : a definir
Service : API prod
Utilisateur : `admin@paris-local.test` (UUID `bfb7c90c-f872-4709-8d8-1120843ce629`)

Contrainte : l'endpoint PATCH standard (`apps/api/src/modules/hotels/routes.ts:93-108`) refuse par construction la modification d'un compte super_admin (ligne 99-101 : si `membership.user.role === super_admin` retourne 403).

Options envisagees (aucune adoptee, en attente de decision) :

1. **PR temporaire** : etendre `adminUserUpdateSchema` pour accepter les super_admin dans une route dediee super-admin-only. Necessite review + tests + redéploiement API prod. Le plus propre mais le plus long.

2. **SQL direct via terminal UI Coolify** : ouvrir un terminal sur le conteneur DB prod et executer :
   ```sql
   UPDATE users
   SET password_hash = $1
   WHERE email = 'admin@paris-local.test';
   ```
   ou `$1` est le hash bcrypt (12 rounds) du nouveau mot de passe. Rapide, ne necessite aucun changement code, mais necessite un acces shell.

3. **Autre canal operationnel** : regenere le mot de passe via un script dedie deploye a chaud (non recommande, complique l'audit).

Statut : **bloque, en attente de decision**.

## 7. Phase 3 - Rotation secrets S3 / Cloudflare R2 (PLANIFIE)

Date : a definir
Services concernes : scripts/backup-postgres.sh + scripts/restore-postgres.sh

Contrainte : les tokens R2 sont stockes en env vars Coolify (`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_PREFIX`, `BACKUP_RETENTION_DAYS`).

Methode : regeneration des tokens cote Cloudflare dashboard, mise a jour via `coolify_env_vars.update`, redéploiement via UI Coolify (taches planifiees).

Statut : **a planifier**.

## 8. Phase 4 - Regeneration token Coolify Windows (PLANIFIE)

Date : a definir
Contrainte : le token Coolify actuel a les permissions `version`, `applications`, `databases`, `env_vars`, `control`, mais PAS `deploy`. Pour les redéploiements futurs, soit regenerer un token avec la permission `deploy`, soit continuer avec les redéploiements manuels UI.

Methode : regenere un token avec permission `deploy` sur le dashboard Coolify, mettre a jour la substitution `{env:COOLIFY_TOKEN}` dans la config MCP.

Statut : **a planifier**, non bloquant.

## 9. Phase 5 - Rotation mots de passe comptes demo (PLANIFIE)

Date : a definir
Service : API clone
Comptes : `reception@demo-paris-local.test`, `admin@demo-paris-local.test`

Methode : meme approche que 2C-A, via PATCH `/api/hotels/<demo-hotel-uuid>/users/<user-uuid>`. Le hotel demo est isole dans la DB dediee, donc impact zero sur la prod.

Statut : **a planifier**, non bloquant.

## Risques residuels

- **Compte super admin `admin@paris-local.test` toujours avec mdp dev** : voir Phase 2C-B ci-dessus.
- **Tokens R2 non rotates** : voir Phase 3.
- **Token Coolify sans permission `deploy`** : voir Phase 4.

## Fuite MCP documentee

Les outils MCP Coolify suivants exposent des secrets en clair dans leurs tool results (transient, jamais reportes par l'agent) :
- `coolify_get_database` : retourne `postgres_password` + `internal_db_url` en clair.
- `coolify_env_vars.update` : retourne `real_value` mis a jour en clair dans la reponse.

Mitigation : ne jamais reporter ces valeurs dans les reponses utilisateur, logs publics, ou commits.
