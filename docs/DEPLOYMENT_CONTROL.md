# Deployment Control — ParisLocalStack

> Strategie de deploiement Coolify validee en juin 2026.

## 1. Probleme initial

Avant juin 2026, chaque merge sur `main` declenchait automatiquement 4 redeploiements simultanement :
- API prod
- Web prod
- API demo
- Web demo

Consequence : une PR design frontend uniquement redeployait inutilement la production (API + Web) et les deux services demo.

Risques identifies :
- casse prod accidentelle sur un merge cosmetique ;
- redemarrage API prod sans necessite (interruption Socket.IO, perte sessions actives) ;
- deployement de code non valide sur prod avant test demo ;
- aucune separation entre validation et mise en production.

## 2. Architecture Coolify actuelle

### Services PROD

| Service | UUID | FQDN | Auto Deploy |
|---------|------|------|-------------|
| paris-local-api | `m2rfu2ypdlq07jylh59e8oh6` | `https://api.welcomeparis.hotelmanager.fr` | **OFF** |
| paris-local-web | `gukenjn38rxuj9n7sn5g43ey` | `welcomeparis.hotelmanager.fr`, `vendome.welcomeparis.hotelmanager.fr`, `admin.vendome.welcomeparis.hotelmanager.fr`, `*.welcomeparis.hotelmanager.fr` | **OFF** |

### Services DEMO

| Service | UUID | FQDN | Auto Deploy |
|---------|------|------|-------------|
| clone-of-paris-local-api | `e1u5so7e1kx216d5e16cwtur` | `https://api-demo.hotelmanager.fr` | **ON** (filtre) |
| clone-of-paris-local-web | `qhibcwqshd484o90ufcchbg0` | `demo-paris-local.welcomeparis.hotelmanager.fr`, `admin-demo-paris-local.welcomeparis.hotelmanager.fr`, `hotel-admin-demo-paris-local.welcomeparis.hotelmanager.fr` | **ON** (filtre) |

### Bases de donnees

| Service | UUID | Auto Deploy |
|---------|------|-------------|
| paris-local-postgres (PROD) | `hl7aaurvn9xrmj5y3g6bw5ds` | N/A (DB) |
| paris-local-postgres-demo (DEMO) | `xa4milhem5vfe1s9bwnue9dx` | N/A (DB) |

## 3. Watch Paths

### API demo (`e1u5so7e1kx216d5e16cwtur`)

```
apps/api/**
packages/shared/**
prisma/**
Dockerfile.api
scripts/**
```

### Web demo (`qhibcwqshd484o90ufcchbg0`)

```
apps/web/**
packages/shared/**
Dockerfile.web
package.json
package-lock.json
```

## 4. Workflow officiel

```
PR ouverte
  |
  v
Merge dans main
  |
  v
Coolify detecte le push et filtre par watch_paths
  |
  +---> API demo : redeploye SI fichiers dans apps/api/ ou packages/shared/ ou prisma/
  +---> Web demo : redeploye SI fichiers dans apps/web/ ou packages/shared/
  |
  v
Validation demo (healthcheck + test visuel)
  |
  v
Decision manuelle : deploiement PROD via UI Coolify
```

Aucun service PROD ne se redeploie automatiquement.

## 5. Simulations

### Changement `apps/web/src/apps/guest/GuestShell.tsx`

| Service | Redeploye ? | Raison |
|---------|-------------|--------|
| API prod | NON | auto-deploy OFF |
| Web prod | NON | auto-deploy OFF |
| API demo | NON | pas dans `apps/api/**` |
| **Web demo** | **OUI** | match `apps/web/**` |

### Changement `apps/api/src/modules/messages/routes.ts`

| Service | Redeploye ? | Raison |
|---------|-------------|--------|
| API prod | NON | auto-deploy OFF |
| Web prod | NON | auto-deploy OFF |
| **API demo** | **OUI** | match `apps/api/**` |
| Web demo | NON | pas dans `apps/web/**` |

### Changement `packages/shared/src/index.ts`

| Service | Redeploye ? | Raison |
|---------|-------------|--------|
| API prod | NON | auto-deploy OFF |
| Web prod | NON | auto-deploy OFF |
| **API demo** | **OUI** | match `packages/shared/**` |
| **Web demo** | **OUI** | match `packages/shared/**` |

## 6. Interdits

- Ne jamais reactiver Auto Deploy sur les services PROD sans validation explicite par le responsable projet.
- Ne jamais configurer Auto Deploy sur une base de donnees.
- Ne jamais supprimer les watch_paths des services demo sans raison documentee.
- Ne jamais deployer prod avant validation demo.
- Ne jamais deployer prod sans verifier les healthchecks demo au prealable.

## 7. Risques restants

| Risque | Gravite | Mitigation |
|--------|---------|-----------|
| Merge migration Prisma redeploie API demo automatiquement | Moyen | Acceptable car DB demo est jetable. Verifier compatibilite donnees seedees. |
| Prod drift (retard par rapport a main) | Faible | Intentionnel. Deployer prod manuellement apres validation demo. |
| `package.json` change declenche Web demo meme pour une dep backend | Faible | Rare. Un rebuild Web est legitimate quand le lockfile change. |
| Pas de CI/CD automatise (build/typecheck) avant merge | Moyen | Non lie au deployment control. GitHub Actions recommande a terme. |

## 8. Procedure de verification (lecture seule)

```bash
# API prod
curl -s https://api.welcomeparis.hotelmanager.fr/health
curl -s https://api.welcomeparis.hotelmanager.fr/ready

# API demo
curl -s https://api-demo.hotelmanager.fr/health
curl -s https://api-demo.hotelmanager.fr/ready

# Web demo
curl -s -o /dev/null -w "%{http_code}" https://demo-paris-local.welcomeparis.hotelmanager.fr
curl -s -o /dev/null -w "%{http_code}" https://admin-demo-paris-local.welcomeparis.hotelmanager.fr
curl -s -o /dev/null -w "%{http_code}" https://hotel-admin-demo-paris-local.welcomeparis.hotelmanager.fr
```

Resultat attendu : tous 200, `/ready` retourne `database: ok`.

## 9. Procedure de deploiement PROD manuel

1. Verifier que la demo est saine (healthchecks + test visuel).
2. Verifier que le commit a deployer est bien teste sur demo.
3. Ouvrir Coolify UI.
4. Naviguer vers le service PROD concerne (API ou Web).
5. Cliquer Deploy (ou Rebuild).
6. Attendre la fin du deploiement.
7. Verifier `/health` et `/ready` sur prod.
8. Si regression : rollback via Coolify UI (Deploy previous).
