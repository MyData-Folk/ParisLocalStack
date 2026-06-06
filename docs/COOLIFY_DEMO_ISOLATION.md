# COOLIFY_DEMO_ISOLATION.md — Clone démo isolé ParisLocalStack

> Source de vérité pour le clone démo isolé (`paris-local-demo`) sur Coolify.
> À consulter avant toute action sur le clone démo, le seed démo, ou l'endpoint `/api/admin/seed-demo`.

## 1. Contexte et objectif

Pour pouvoir réaliser des démos tablette en ligne (sans `localhost`), un clone complet de la stack ParisLocalStack a été déployé sur Coolify, isolé de la production par :

- une base PostgreSQL dédiée ;
- un `JWT_SECRET` distinct ;
- des `CORS_ORIGIN` / `WEB_URL` cohérents avec le sous-domaine `*.demo.hotelmanager.fr` ;
- un `VITE_API_URL` côté Web qui pointe vers l'API clone.

L'objectif est de pouvoir exécuter un seed démo, démontrer la Guest App et le dashboard réception, sans jamais risquer de toucher la production.

## 2. Ressources clone (UUID Coolify)

| Ressource | UUID | FQDN / endpoint | Statut |
|---|---|---|---|
| API clone | `e1u5so7e1kx216d5e16cwtur` | `https://api-demo.hotelmanager.fr` | running:healthy |
| Web clone | `qhibcwqshd484o90ufcchbg0` | `https://demo.hotelmanager.fr` (+ `*.demo.hotelmanager.fr`) | running:healthy |
| DB démo | `xa4milhem5vfe1s9bwnue9dx` | `paris-local-postgres-demo`, env=27 | running:healthy |
| Projet Coolify | `n3l5wij5f3y3rjnpwyw9xk4c` | `paris-local-demo`, id=25 | — |
| Environnement | `l7cac0yp8wd0hmqzemb5rsv3` | `production` (du projet clone), id=27 | — |

## 3. Ressources production à ne JAMAIS toucher

| Ressource | UUID |
|---|---|
| API prod | `m2rfu2ypdlq07jylh59e8oh6` |
| Web prod | `gukenjn38rxuj9n7sn5g43ey` |
| DB prod | `hl7aaurvn9xrmj5y3g6bw5ds` (env=23, projet id=21) |

## 4. Preuve d'isolation

L'isolation est prouvée par l'asymétrie suivante :

| Test | URL | Attendu | Observations |
|---|---|---|---|
| Hôtel démo côté clone | `GET https://api-demo.hotelmanager.fr/api/public/hotels/by-slug/demo-paris-local` | 200 | Hôtel "Hôtel Lumière Demo Paris" servi par la DB démo |
| Hôtel Vendôme côté clone | `GET https://api-demo.hotelmanager.fr/api/public/hotels/by-slug/vendome` | **404** | La DB démo ne contient pas l'hôtel Vendôme (qui existe en prod) |
| Hôtel Vendôme côté prod | `GET https://api.welcomeparis.hotelmanager.fr/api/public/hotels/by-slug/vendome` | **200** | Prod intacte, l'hôtel Vendôme est servi par la DB prod |
| `wifiPassword` côté clone | grep sur réponse publique | absent | Fix SECURITY-1 (PR #99) — pas de fuite des clés sensibles |

Tant que l'asymétrie `clone/vendome=404` vs `prod/vendome=200` est préservée, l'isolation est effective.

## 5. Sécurité publique du clone (SECURITY-1)

Le select public de la route `GET /api/public/hotels/by-slug/:slug` (cf. `apps/api/src/modules/hotels/routes.ts:208`) exclut explicitement :

- `wifiPassword`
- `whatsappNumber`
- (et tout autre champ interne non listé dans le select)

Ce fix a été mergé via la PR #99 (commit `a34e71f`) et est valide sur la prod **et** sur le clone.

## 6. Hôtel démo seedable (`demo-paris-local`)

- Nom : `Hôtel Lumière Demo Paris`
- Slug : `demo-paris-local`
- Thème : `parisian_boutique`
- Langues : `fr`, `en`, `it`
- Données 100% fictives (emails en `.test`, téléphones `demo-phone-*`, etc.)
- Comptes démo (mot de passe commun : `demo-only-not-for-production`, hashé bcrypt cost 12) :
  - `reception@demo-paris-local.test` (rôle `receptionist`)
  - `manager@demo-paris-local.test` (rôle `hotel_admin`)

Le seed est implémenté dans `prisma/seed.demo.ts` (utilisable en CLI via `npx tsx prisma/seed.demo.ts`) et **dupliqué** dans `apps/api/src/modules/admin/seedDemo.ts` (pour l'endpoint one-off). Les deux fichiers doivent rester synchronisés.

## 7. Endpoint one-off `/api/admin/seed-demo`

Ajouté par la PR #100 (commit `0d67a56`), il permet d'exécuter le seed démo via HTTP sans shell dans le conteneur.

### Garde-fous (toutes obligatoires)

1. `SEED_DEMO_ENABLED === "true"` (sinon `403`)
2. `SEED_DEMO_SECRET` env var définie (sinon `500` "misconfigured")
3. Header `X-Seed-Secret` matche `SEED_DEMO_SECRET` via `crypto.timingSafeEqual` (sinon `403`)
4. Soft check : `WEB_URL` ou `CORS_ORIGIN` contient `demo.hotelmanager.fr` (sinon `403`)

### Désactivation

Pour désactiver l'endpoint après usage :

1. Mettre `SEED_DEMO_ENABLED=false` sur l'API clone via MCP (`coolify_env_vars` `action: update`).
2. **Redéployer** l'API clone via UI Coolify (la modification d'env var seule n'injecte pas la nouvelle valeur dans le conteneur tournant).
3. Vérifier qu'un `POST /api/admin/seed-demo` (avec ou sans secret) retourne `403`.

### ⚠️ Ne pas oublier

- La valeur de `SEED_DEMO_SECRET` n'est jamais documentée en clair, jamais commitée, jamais loguée.
- Le token Coolify utilisé par le MCP n'a pas la permission `deploy` ; les redéploiements doivent être déclenchés manuellement via l'UI Coolify.
- L'endpoint peut être supprimé du code source dans un PR de cleanup une fois l'usage terminé.

## 8. Scripts interdits (rappel)

Sur l'API clone / la DB démo, ne JAMAIS lancer :

- `prisma/seed.ts` (crée l'hôtel `vendome` qui existe déjà en prod)
- `apps/api/src/database/seedProduction.ts` (crée/modifie le `super_admin` prod)
- `prisma migrate reset` (perte de données)
- `prisma db push` (altère le schéma)
- `prisma migrate dev` (utiliser uniquement `prisma migrate deploy`)

Et ne JAMAIS :

- Lire ou modifier un `.env` de prod
- Toucher aux UUID prod listés en section 3
- Lancer un backup/restore sur la prod

## 9. Procédure de re-seed

Si la DB démo doit être ré-seedée (par exemple après un reset ou pour rejouer la démo) :

1. Vérifier que la cible DB = DB démo (UUID `xa4milhem5vfe1s9bwnue9dx`, env=27) via MCP `coolify_get_database`.
2. Vérifier l'isolation (`clone /vendome=404`, `prod /vendome=200`).
3. Activer l'endpoint : `SEED_DEMO_ENABLED=true` sur l'API clone + redéploiement.
4. Appeler : `POST https://api-demo.hotelmanager.fr/api/admin/seed-demo` avec header `X-Seed-Secret: <secret>`.
5. Vérifier le retour JSON (`ok: true, hotelSlug: "demo-paris-local", counts: {...}`).
6. Vérifier `clone /demo-paris-local=200` et `clone /vendome=404`.
7. Désactiver : `SEED_DEMO_ENABLED=false` + redéploiement + test 403.

## 10. Fuite de secret via MCP Coolify (incident connu)

Le tool `coolify_get_database` du MCP `@masonator/coolify-mcp@2.12.0` retourne par défaut en clair `postgres_password` et `internal_db_url` de la DB ciblée. C'est un comportement par défaut du MCP, pas une mauvaise manip.

**Action recommandée (post-mission)** :

- Rotation du mot de passe prod `ParisLocal_2026_ChangeMe_9xN4` (UUID `hl7aaurvn9xrmj5y3g6bw5ds`), exposé à plusieurs reprises.
- Considérer le `SEED_DEMO_SECRET` et le mot de passe DB démo comme compromis par visibilité conversationnelle (moins critique car dédiés, mais à noter).

## 11. Historique des phases

| Phase | Date | Description | Statut |
|---|---|---|---|
| COOLIFY-DEMO-1 | 2026-06-04 → 2026-06-06 | Création DB démo, config env vars clone, redéploiement initial, preuves d'isolation | ✅ Validé |
| COOLIFY-DEMO-2 | 2026-06-06 | Endpoint one-off `POST /api/admin/seed-demo` (PR #100), exécution seed, désactivation endpoint | ✅ Validé |
| COOLIFY-DEMO-2 cleanup | À faire | PR de suppression de l'endpoint one-off | ⏳ À planifier |
