# Demo Seed Runbook

## Objectif

Relancer uniquement le seed demo `demo-paris-local` contre la DB demo isolee, sans toucher a la production et sans exposer de secret.

Ce runbook remplace l'ancienne procedure one-shot HTTP. L'endpoint public temporaire `/api/admin/seed-demo` a ete supprime volontairement et ne doit pas etre recree.

## Contexte

- Seed demo source : `prisma/seed.demo.ts`.
- Script npm explicite : `npm run seed:demo`.
- Tenant attendu : `demo-paris-local`.
- API clone : `https://api-demo.hotelmanager.fr`.
- Guest App canonique : `https://demo-paris-local.welcomeparis.hotelmanager.fr/`.
- Reception/Admin canonique : `https://admin-demo-paris-local.welcomeparis.hotelmanager.fr/`.
- La DB demo doit rester isolee de la production.

## Interdits

- Ne pas lancer `npm run prisma:seed`.
- Ne pas lancer `prisma/seed.ts`.
- Ne pas lancer `apps/api/src/database/seedProduction.ts`.
- Ne pas lancer `prisma migrate reset`.
- Ne pas lancer `prisma db push`.
- Ne pas recreer d'endpoint HTTP de seed.
- Ne pas afficher `DATABASE_URL`, `JWT_SECRET`, token, cookie, header `Authorization`, mot de passe ou hash.
- Ne pas toucher la DB production, les variables production ou les services production.

## Prerequis

Avant execution, l'operateur doit confirmer sans afficher de valeur sensible :

1. La branche de code deployee contient la PR demo a rejouer.
2. La cible est la DB demo, pas la DB production.
3. L'isolation clone est validee :
   - `GET https://api-demo.hotelmanager.fr/health` retourne 200.
   - `GET https://api-demo.hotelmanager.fr/ready` retourne 200 avec database ok.
   - `GET https://api-demo.hotelmanager.fr/api/public/hotels/by-slug/demo-paris-local` retourne 200.
   - `GET https://api-demo.hotelmanager.fr/api/public/hotels/by-slug/vendome` retourne 404.
4. Le contexte d'execution dispose des dependances de developpement, notamment `tsx`.

## Commande seed demo

Le seed demo refuse de s'executer sans confirmation explicite.

Dans un contexte controle ou `DATABASE_URL` pointe deja vers la DB demo, lancer :

```bash
DEMO_SEED_CONFIRM=demo-paris-local DEMO_SEED_ENV=coolify-demo npm run seed:demo
```

Sous PowerShell :

```powershell
$env:DEMO_SEED_CONFIRM = "demo-paris-local"
$env:DEMO_SEED_ENV = "coolify-demo"
npm run seed:demo
```

Ne jamais copier ni afficher la valeur de `DATABASE_URL` dans la commande, le terminal partage ou un rapport.

## Choix du contexte d'execution

Option recommandee : environnement one-shot interne non public avec le code du repo, les dependances de developpement installees, et une variable `DATABASE_URL` fournie par l'operateur vers la DB demo uniquement.

Option possible sous controle strict : terminal Coolify du clone API uniquement si `tsx` est disponible. Si `tsx` n'est pas disponible dans le conteneur runtime, stopper au lieu de bricoler une installation dans le conteneur en cours.

Option a eviter : poste local Windows avec URL DB demo collee dans l'historique shell. Si cette option est utilisee, la valeur doit etre fournie par un mecanisme local temporaire non affiche et efface apres usage.

## Postchecks

Apres execution, verifier :

1. `GET https://api-demo.hotelmanager.fr/health` retourne 200.
2. `GET https://api-demo.hotelmanager.fr/ready` retourne 200 avec database ok.
3. `GET https://api-demo.hotelmanager.fr/api/public/hotels/by-slug/demo-paris-local` retourne 200.
4. `GET https://api-demo.hotelmanager.fr/api/public/hotels/by-slug/vendome` retourne 404.
5. La Guest App canonique affiche l'hotel demo.
6. Les cartes Guest App enrichies sont visibles.
7. Les services dynamiques demo sont visibles.
8. Les recommandations demo affichent des images.
9. Aucun marqueur `demo-phone-*` n'est visible.

## Procedure de STOP

Stopper immediatement si :

- la cible DB n'est pas confirmee comme demo ;
- `vendome` est visible sur le clone ;
- `tsx` n'est pas disponible dans le contexte choisi ;
- une commande demande une migration, un reset ou un db push ;
- une valeur sensible apparait dans un terminal partage ;
- le contexte pointe vers un service ou une URL production.

## Rollback cible

Le seed demo est concu pour nettoyer et recreer uniquement les donnees liees au `hotel_id` du tenant `demo-paris-local`. En cas de probleme, ne jamais lancer de reset global. Definir une restauration ciblee de la DB demo ou rejouer le seed demo apres correction, uniquement apres validation explicite.
