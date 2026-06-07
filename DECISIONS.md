# DECISIONS.md - Journal de decisions ParisLocalStack

## 2026-06-06
Decision : supprimer les env vars `SEED_DEMO_ENABLED` et `SEED_DEMO_SECRET` de l'API clone Coolify (CLEANUP-DEMO-2) maintenant que l'endpoint one-off a ete supprime du code via PR #101 (commit `9f4875c`).

Motif : apres la fin d'usage de l'endpoint one-off `/api/admin/seed-demo`, les env vars de protection (`SEED_DEMO_ENABLED=false`, `SEED_DEMO_SECRET=...`) sont devenus inutiles cote code. Les conserver dans Coolify creait un risque residuel : si un developpeur re-introduisait un handler de seed similaire dans le futur sans verifier la presence de ces vars, il pourrait etre re-active par erreur. En supprimant les vars, on garantit que meme un retour accidentel du code ne pourrait pas fonctionner sans la reconfiguration manuelle de Coolify. PR #101 a deja nettoye `apps/api/src/modules/admin/seedDemo.ts` et le wiring dans `app.ts`.

Impact : `SEED_DEMO_ENABLED` (UUID `j3cmt07cruo6vn8bjn4ilm47`) et `SEED_DEMO_SECRET` (UUID `fem1d8mzxqhim402qyaw7ys6`) supprimes via MCP `coolify_env_vars` `action: delete`. 18 autres env vars de l'API clone intactes (NODE_ENV, DATABASE_URL, API_PORT, WEB_URL, CORS_ORIGIN, JWT_SECRET, UPLOAD_PROVIDER, UPLOAD_DIR, S3_*, BACKUP_*). Aucune modification de la prod, du Web clone, de la DB demo. Pas de redéploiement requis (les env vars ne sont plus referencees par le code). Aucune action sur la DB demo (l'hotel `demo-paris-local` seede reste intact).

Statut : adopte, valide. Tests post-suppression : API clone `/health`=200, `/ready`=200, `/demo-paris-local`=200, `/vendome`=404, prod `/vendome`=200. Documentation mise a jour dans `docs/COOLIFY_DEMO_ISOLATION.md` (section 13 ajoutee), `current-state.md`, `RISQUES.md` (risque "seed demo lance sur le mauvais environnement" : risque residuel ferme completement).

---

## 2026-06-06
Decision : retirer la racine `https://demo.hotelmanager.fr/` du Web clone (COOLIFY-DEMO-4) pour eliminer le piege silencieux des 404 console navigateur.

Motif : apres l'ajout des FQDNs canoniques en COOLIFY-DEMO-3 etape 2, l'utilisateur pouvait toujours ouvrir `https://demo.hotelmanager.fr/` par defaut. Or ce hostname fait deduire `slug=demo` par `tenant.ts:33-41` (label "demo" non present dans la liste d'exclusion plateforme), entrainant des 404 sur les appels API `/api/public/hotels/by-slug/demo`, `/api/public/demo/settings`, `/api/public/demo/recommendations`. Le `tenant.ts` ne peut pas etre modifie (regle explicite), et creer un mapping ad hoc `demo → demo-paris-local` est interdit. Retirer la racine du Web clone fait que `https://demo.hotelmanager.fr/` n'a plus de route Traefik, et l'utilisateur est force d'utiliser les URLs canoniques.

Impact : `fqdn` final du Web clone = `https://demo-paris-local.welcomeparis.hotelmanager.fr,https://admin-demo-paris-local.welcomeparis.hotelmanager.fr`. Le fallback path-based `https://demo.hotelmanager.fr/h/demo-paris-local/welcome` n'est plus accessible (acceptable, les URLs canoniques le rendent redondant). La config Traefik est regeneree cote Coolify (plus de route `Host(demo.hotelmanager.fr)` visible dans les custom_labels). Le reverse-proxy Caddy du conteneur Web clone continue de repondre 200 sur la racine jusqu'au prochain redéploiement du Web clone (recommandé pour figer la suppression au runtime). Aucune modification de la prod, du code applicatif, de `tenant.ts`, ni de l'API clone.

Statut : adopte, valide par tests HTTP. Documentation mise a jour dans `docs/COOLIFY_DEMO_ISOLATION.md` (section 12 simplifiee a 2 URLs canoniques), `current-state.md`, `DEMO_CHECKLIST_AVANT_RDV.md`, `DEMO_COMMERCIALE.md`.

---

## 2026-06-06
Decision : ajouter les FQDNs canoniques `demo-paris-local.welcomeparis.hotelmanager.fr` (Guest) et `admin-demo-paris-local.welcomeparis.hotelmanager.fr` (Reception) au Web clone (COOLIFY-DEMO-3 etape 2).

Motif : apres le nettoyage des FQDNs incoherents (`demo-vendome.*`), ouvrir la racine `https://demo.hotelmanager.fr/` faisait deduire `slug=demo` par `tenant.ts` (le label "demo" n'est pas dans la liste d'exclusion plateforme), entrainant des 404 sur les appels API. L'URL path-based `https://demo.hotelmanager.fr/h/demo-paris-local/welcome` marchait mais obligeait l'utilisateur a connaitre le slug a l'avance. L'ajout des FQDNs canoniques au pattern prod (`{slug}.welcomeparis.hotelmanager.fr` + `admin-{slug}.welcomeparis.hotelmanager.fr`) permet a `tenant.ts:21-30` de correctement extraire le slug `demo-paris-local` depuis le hostname, et a `tenant.ts:24-26` d'identifier le contexte `reception` depuis le prefixe `admin-`.

Impact : Web clone fqdn final = `https://demo.hotelmanager.fr,https://demo-paris-local.welcomeparis.hotelmanager.fr,https://admin-demo-paris-local.welcomeparis.hotelmanager.fr`. Les 3 URLs servent maintenant la Guest App avec le bon contexte : racine (avec fallback path), Guest canonique (slug deduit du hostname), et Reception canonique (contexte admin). L'API clone a ete verifiee : `demo-paris-local`=200, `vendome`=404, isolation preservee. Aucun code applicatif modifie (`tenant.ts` inchange). Aucune modification de la prod.

Statut : adopte, valide. Documentation mise a jour dans `docs/COOLIFY_DEMO_ISOLATION.md` (section 12 restructuree avec les 3 URLs officielles), `current-state.md`, `DEMO_CHECKLIST_AVANT_RDV.md`, `DEMO_COMMERCIALE.md`.

---

## 2026-06-06
Decision : nettoyer les FQDNs du Web clone et les doublons `SEED_DEMO_*` de l'API clone (COOLIFY-DEMO-3).

Motif : les FQDNs exposes `demo-vendome.welcomeparis.hotelmanager.fr` et `demo-admin.vendome.welcomeparis.hotelmanager.fr` avaient ete configures par mimetisme avec le pattern prod (`vendome`, `admin.vendome`) mais ne correspondaient pas au slug seede (`demo-paris-local`). Le frontend, via `tenant.ts`, en deduisait le slug `demo-vendome` depuis le hostname et faisait des appels API sur `/api/public/hotels/by-slug/demo-vendome` qui retournaient 404. Cote API clone, les env vars `SEED_DEMO_ENABLED` et `SEED_DEMO_SECRET` etaient dupliquees (2 paires), creant un risque de confusion et de consommation de doublons lors des futures verifications.

Impact : FQDN du Web clone reduit a `https://demo.hotelmanager.fr` (les 2 sous-domaines `demo-vendome.*` ont ete retires). Les URLs `https://demo-vendome.welcomeparis.hotelmanager.fr` ne servent plus de frontend coherent (apres redéploiement Web clone). L'URL officielle de demo devient `https://demo.hotelmanager.fr/h/demo-paris-local/welcome` (slug dans le path, independant des FQDNs exposes). Cote API clone, 1 seule occurrence de `SEED_DEMO_ENABLED` (`j3cmt07cr…`) et de `SEED_DEMO_SECRET` (`fem1d8mzx…`) est conservee. Aucun code applicatif n'a ete modifie (le code `tenant.ts` n'est pas touche, conforme a la consigne).

Statut : adopte, en attente de redéploiement Web clone pour prise en compte de la nouvelle config Traefik. Documentation mise a jour dans `docs/COOLIFY_DEMO_ISOLATION.md` (section 12 ajoutee pour l'URL officielle).

---

## 2026-06-06
Decision : deployer un clone Coolify dedie `paris-local-demo` (COOLIFY-DEMO-1) avec DB PostgreSQL dediee, JWT_SECRET distinct, et endpoints sur `*.demo.hotelmanager.fr`, pour permettre des demos tablette en ligne sans `localhost`.

Motif : la demo locale necessite un acces machine, pas compatible avec un RDV client tablette. Un clone complet de la stack isole de la prod evite tout risque de fuite vers la prod tout en donnant acces a un environnement realiste.

Impact : nouvelle DB `paris-local-postgres-demo` (UUID `xa4milhem5vfe1s9bwnue9dx`, env=27) hebergeant uniquement des donnees 100% fictives (`.test` TLD, `demo-phone-*`, `demo-wifi-only`, etc.). API clone (UUID `e1u5so7e1kx216d5e16cwtur`) sur `https://api-demo.hotelmanager.fr`, Web clone (UUID `qhibcwqshd484o90ufcchbg0`) sur `https://demo.hotelmanager.fr`. Isolation prouvee par asymetrie `clone /vendome=404` vs `prod /vendome=200`. Aucun UUID prod touche (`m2rfu2ypdlq07jylh59e8oh6`, `gukenjn38rxuj9n7sn5g43ey`, `hl7aaurvn9xrmj5y3g6bw5ds`).

Statut : adopte, valide par redéploiement manuel de l'API clone et du Web clone via UI Coolify (le token Coolify du MCP n'a pas la permission `deploy`). Documentation centralisee dans `docs/COOLIFY_DEMO_ISOLATION.md`.

---

## 2026-06-06
Decision : ajouter un endpoint one-off `POST /api/admin/seed-demo` (COOLIFY-DEMO-2, PR #100) pour executer le seed demo via HTTP, sans shell dans le conteneur, avec triple garde-fou (feature flag + secret env + header timing-safe) + soft check `demo.hotelmanager.fr`.

Motif : apres le redéploiement du clone, la DB demo est vide. La commande one-off via MCP etant impossible (pas d'exec dans le MCP, pas de `tsx` dans l'image finale), il fallait un point d'entree HTTP pour jouer `prisma/seed.demo.ts` sur la DB demo uniquement. L'endpoint est temporaire, desactive apres usage (`SEED_DEMO_ENABLED=false` + redéploiement), et un PR de cleanup est a planifier.

Impact : nouvelle route `POST /api/admin/seed-demo` montee sur `/api/admin`, code duplique intentionnellement depuis `prisma/seed.demo.ts` (le fichier source n'est pas compile par le build API et le runtime n'a pas `tsx`). Endpoint protege par 4 couches, secret `SEED_DEMO_SECRET` genere aleatoirement (64 chars base64url) et jamais documente en clair. Apres redéploiement propre, l'endpoint retourne 403 sur toutes les combinaisons (avec/sans secret, bon/mauvais secret).

Statut : adopte, valide (seed execute avec succes, hotel `demo-paris-local` accessible sur le clone, isolation preservee, cles sensibles absentes du select public clone, logins demo OK, endpoint desactive). Documentation dans `docs/COOLIFY_DEMO_ISOLATION.md`.

---

## 2026-06-06
Decision : finaliser localement la chaine services configurables Vague 6B a 6F avant toute validation staging ou production.

Motif : les services hotel doivent etre configurables par hotel sans casser le rendu historique de la Guest App. Le decoupage PR #91 a #97 garde une separation nette entre types partages, stockage/API privee, attribution Super Admin, personnalisation Hotel Admin, DTO public safe, hook frontend et rendu final.

Impact : Super Admin attribue les services autorises, Hotel Admin personnalise uniquement les services de son forfait, l'API publique settings expose seulement les services actifs et publics, et la Guest App affiche les services dynamiques avec fallback legacy strict si la configuration est absente, vide, invalide ou totalement desactivee. Les formulaires existants Taxi, Room service, linge/Pressing/Blanchisserie et Reception restent preserves.

Statut : adopte, valide localement (health/ready/web OK, fallback legacy OK, Taxi dynamique OK, Room service dynamique OK, service desactive masque, mobile 375px OK, audit UI 6/6, typecheck/build/diff OK, aucun secret expose). Staging et production non valides.

---

## 2026-06-03
Decision : cloturer la Vague 5F en trois PR dediees (API publique, composants isoles, branchement avec fallback) avant toute evolution metier plus lourde.

Motif : la Vague 5F devait rendre les cartes Guest App configurables tout en gardant un fallback strict vers le rendu legacy. Decouper en trois PR limite la surface de chaque review, isole la couche API de la couche UI et permet de tester independamment le rendu, la securite des liens externes et le branchement final.

Impact : PR #87 expose publiquement `guestCards` actifs tries et tronques par plan ; PR #88 livre les composants isoles avec `target="_blank" rel="noopener noreferrer"` et validation stricte `http`/`https` ; PR #89 branche `GuestShell` avec `useGuestCards`, remplace uniquement les sections "Actions rapides" et "Guide local" par les cartes dynamiques, preserve les StayCard et le suivi des demandes, et conserve le rendu legacy si `guestCards` est absent, vide, invalide ou totalement desactive. Voir `docs/GUEST_CARDS_DISPLAY.md` pour le detail.

Statut : adopte, valide en local (audit UI 6/6, typecheck/build/diff OK, health/ready OK, aucun secret expose). Staging et production non valides.

---
Decision : decouper la personnalisation des cartes Guest App en couches successives.

Motif : eviter de melanger modele, API, plan commercial, editeur Hotel Admin et affichage public dans une seule PR.

Impact : PR #81 integre `guestCards` + `commercialPackage`; PR #82 integre l'API plan commercial ; PR #84 permet au Super Admin de modifier le forfait et a Hotel Admin de le lire ; PR #85 ajoute l'API privee guest-cards ; PR #86 ajoute l'editeur Hotel Admin. `GuestShell` et la route publique restent inchanges jusqu'a la Vague 5F.

Statut : adopte.

---

## 2026-06-03
Decision : cadrer la Phase 10 produit autour de cinq petites PR ordonnees.

Motif : la messagerie Reception / Client est stabilisee et les prochaines demandes doivent rester decoupees : services client, tags de demandes, tri clients presents, supervision Admin Hotel, historique client.

Impact : utiliser `docs/PRODUCT_ROADMAP_SERVICES_REQUESTS_HISTORY.md` comme reference avant d'ouvrir une PR technique Phase 10. Chaque evolution doit rester multi-hotel, sans valeur demo codee en dur, et ne pas lancer de migration sans validation explicite.

Statut : adopte.

---

## 2026-06-02
Decision : rendre obligatoire une checklist de validation staging controle avant tout seed, migration ou deploiement hors local.

Motif : la demo locale est validee, mais les URLs publiques demo ne prouvent pas un staging isole et la Guest App publique a ete observee en `Hotel not found`.

Impact : toute action hors local doit d'abord prouver l'environnement staging, l'app web, l'API, la DB PostgreSQL, la non-production de `DATABASE_URL`, la protection d'acces, l'absence de donnees reelles et un rollback.

Statut : adopte.

---

## 2026-06-02
Decision : limiter la demonstration Phase 9E a l'environnement local tant que le staging public n'est pas clarifie.

Motif : la demo locale `demo-paris-local` / Hôtel Lumière Demo Paris est validee, mais les URLs publiques repondent sans prouver le tenant neutre : Guest App publique en `Hotel not found`, reception publique en login generique, Coolify lecture seule non disponible.

Impact : aucun seed, migration, deploy ou db push ne doit etre lance hors local tant qu'une DB staging dediee, une API/Web dedies, une protection d'acces et un rollback staging ne sont pas confirmes.

Statut : adopte.

---

## 2026-06-02
Decision : preparer un seed demo neutre separe et manuel pour `demo-paris-local`.

Motif : creer Hôtel Lumière Demo Paris sans modifier le seed historique Vendome et sans execution automatique.

Impact : le seed demo doit rester isole, idempotent, cible uniquement sur le `hotel_id` demo et ne jamais etre lance sans validation explicite.

Statut : adopte.

---

## 2026-06-02
Decision : distinguer les audits UI locaux, staging et production.

Motif : les captures Playwright locales initiales peuvent montrer des etats de fallback, login ou erreur lorsque localhost n'est pas representatif. Les captures reelles observees sur captures partagees le 2026-06-02 montrent des surfaces Reception, Guest App Vendome et Super Admin fonctionnelles, sans constituer a elles seules une validation production-ready complete.

Impact : ne pas traiter les captures localhost comme verite unique. Les audits UI doivent etre compares a un environnement representatif, et la priorite Phase 9E reste la stabilisation du tenant demo neutre `demo-paris-local` / Hôtel Lumière Demo Paris.

Statut : adopte.

---

## 2026-06-02
Decision : valider le tenant demo neutre `demo-paris-local` et l'hotel Hôtel Lumière Demo Paris.

Motif : aligner la demonstration commerciale Phase 9E sur un support neutre, sans dependance a Vendome et sans donnees personnelles reelles.

Impact : les documents de demo doivent utiliser `demo-paris-local`; Vendome ne doit rester qu'une reference historique, production ou monitoring si necessaire.

Statut : adopte.

---

## 2026-06-02
Decision : creer des fichiers de contexte officiels du projet.

Motif : permettre a tout nouvel agent de reprendre ParisLocalStack sans relire l'historique complet des conversations.

Impact : PROJECT_BRAIN.md, TECHNICAL_BRAIN.md et ARCHITECTURE_REALITY_CHECK.md deviennent les trois documents de passation principaux.

Statut : adopte.

---

## 2026-06-02
Decision : la prochaine priorite produit est un tenant demo neutre.

Motif : preparer la commercialisation sans exposer de donnees reelles ou d'hotels existants.

Impact : creation de docs phase 9E, scenario demo et checklist avant rendez-vous.

Statut : adopte.

---

## 2026-05
Decision : garder une architecture multi-tenant unique.

Motif : eviter de generer une application React par hotel et conserver une exploitation SaaS maintenable.

Impact : un frontend, une API, une base PostgreSQL, isolation par hotel_id.

Statut : adopte.

---

## 2026-05
Decision : utiliser Coolify pour le deploiement auto-heberge.

Motif : garder la maitrise de l'infrastructure VPS et eviter une dependance coeur a Firebase/Supabase.

Impact : services web, api et postgres geres par Coolify.

Statut : adopte.

---

## 2026-05
Decision : privilegier admin-{slug}.welcomeparis.hotelmanager.fr pour la reception.

Motif : faciliter les wildcards et certificats par rapport au sous-domaine multi-niveau admin.{slug}.

Impact : les URLs reception generees doivent utiliser le format recommande, tout en preservant le format legacy si deja actif.

Statut : adopte.

---

## 2026-05
Decision : separer clients presents et historique CRM.

Motif : rendre le dashboard reception plus operationnel et eviter que les clients partis encombrent les files actives.

Impact : les sejours actifs restent dans l'exploitation courante, les sejours termines passent dans l'historique.

Statut : adopte.

---

## 2026-05
Decision : les donnees CRM internes ne sont jamais publiques.

Motif : securite, confidentialite et isolation multi-tenant.

Impact : notes internes, tags CRM, preferences et statut relation restent uniquement dans les surfaces authentifiees.

Statut : adopte.

---

## 2026-06-07
Decision : rotater le mot de passe de `reception@vendome.test` (SECURITY-ROTATION-2C-A) pour eliminer la dependance au mot de passe dev `ChangeMe123!` expose en clair dans `prisma/seed.ts:7`.

Motif : le mot de passe dev a ete historiquement utilise pour les comptes seed (super_admin + receptionist Vendome) et est considere compromis (visible dans le code source versionne, etait le defaut avant l'instauration de `SEED_ADMIN_PASSWORD`). La rotation du super admin est bloquee par construction (ligne 99-101 de `apps/api/src/modules/hotels/routes.ts` : 403 si `membership.user.role === super_admin`). La rotation du receptionist est en revanche possible via l'endpoint PATCH `/api/hotels/:hotelId/users/:userId` qui accepte un champ `password` (ligne 108 de `adminUserUpdateSchema`).

Impact : nouveau mot de passe (43 chars base64url) applique via PATCH sur l'utilisateur `5473057e-e9c3-4814-8927-0e99bbc1e0b6` (Vendome). Verifications post-rotation : ancien mdp = 401, nouveau mdp = 200 + JWT 188 chars, `/api/auth/me` avec token = 200, `/api/auth/me` sans token = 401, `admin@paris-local.test` toujours OK avec mdp dev (isole), API clone intacte. Documentation creee dans `SECURITY_ROTATION.md` (Phases 1, 2A, 2B, 2C, 2C-A documentees ; Phase 2C-B documentee comme BLOQUE). Aucune modification code (PR possible mais non necessaire : l'endpoint PATCH standard suffit pour les non-super-admin).

Statut : adopte, valide par tests HTTP. Phase 2C-B (super admin) en attente de decision utilisateur (PR temporaire, SQL direct, ou autre).

---

## 2026-05
Decision : deploiement production via migrations Prisma versionnees.

Motif : eviter les synchronisations destructives de schema en production.

Impact : les migrations doivent etre preparees et deployees proprement.

Statut : adopte.
