# RISQUES.md - ParisLocalStack

## 1. Risques techniques
### Fuite inter-tenant
Risque : une route oublie le filtre hotel_id et expose les donnees d'un autre hotel.

Gravite : critique.

Mitigation : auth obligatoire, requireHotelAccess, filtre hotel_id dans toutes les requetes privees, audit regulier des modules API.

### Refactor frontend trop large
Risque : les grands fichiers frontend contiennent beaucoup de logique et un deplacement trop rapide peut casser des flux.

Gravite : haute.

Mitigation : refactor par phases, commits atomiques, build apres chaque phase, pas de changement metier pendant extraction.

### Session obsolete cote navigateur
Risque : un utilisateur garde un contexte hotel precedent et voit une erreur sur un nouveau sous-domaine.

Gravite : moyenne.

Mitigation : session scoping par hostname, nettoyage du contexte si hotelSlug change, messages d'erreur clairs.

### Migration Prisma fragile
Risque : une migration echoue en production si les donnees existantes ne respectent pas les valeurs attendues.

Gravite : haute.

Mitigation : migrations versionnees, verification des donnees avant conversion, pas de commande destructive en production.

### Seed demo lance sur le mauvais environnement
Risque : executer le seed demo neutre sur production ou sur une base non autorisee.

Gravite : haute.

Mitigation : garder le seed demo manuel, ne pas ajouter de script automatique, documenter la commande future sans l'executer, verifier l'environnement cible avant toute execution.

Statut : **ferme pour le clone dedie** via COOLIFY-DEMO-1 + COOLIFY-DEMO-2 (PR #100). L'hotel `demo-paris-local` est maintenant execute uniquement contre la DB dediee `paris-local-postgres-demo` (UUID `xa4milhem5vfe1s9bwnue9dx`) via l'endpoint one-off `POST /api/admin/seed-demo` quadruple garde-fou. Isolation prouvée par `clone /vendome=404` vs `prod /vendome=200`. L'endpoint est desactive (`SEED_DEMO_ENABLED=false`) apres usage. Voir `docs/COOLIFY_DEMO_ISOLATION.md`.

Risque residuel : **ferme completement** via CLEANUP-DEMO-2 (2026-06-06). L'endpoint one-off `apps/api/src/modules/admin/seedDemo.ts` a ete supprime du code source via PR #101 (commit `9f4875c`), le wiring de la route dans `app.ts` a ete retire, et les env vars `SEED_DEMO_*` ont ete supprimees de l'API clone via MCP `coolify_env_vars` `action: delete`. Aucun chemin d'execution residuel n'existe : la regle "ne jamais lancer seed-demo" reste vraie par defaut, et le code ne contient plus aucun handler de seed.

### FQDNs clone incoherents avec le slug seede
Risque : les FQDNs exposes par le Web clone (ex. `demo-vendome.welcomeparis.hotelmanager.fr`) peuvent ne pas correspondre au slug cree par le seed demo (`demo-paris-local`). Le frontend, via `tenant.ts`, en deduit un slug inexistant et fait des appels API qui retournent 404.

Statut : **ferme via COOLIFY-DEMO-3** (2026-06-06). Les FQDNs `demo-vendome.*` et `demo-admin.vendome.*` ont ete retires du Web clone via MCP `coolify_application update` ; le `fqdn` du Web clone est maintenant `https://demo.hotelmanager.fr`. L'URL officielle de demo force le slug dans le path (`https://demo.hotelmanager.fr/h/demo-paris-local/welcome`), ce qui rend le dedoublement de deduire le slug du hostname inutile. Le code `tenant.ts` n'a pas ete modifie (volontairement, pour eviter un mapping ad hoc).

Risque residuel : les anciens FQDNs peuvent encore repondre 200 tant que le Web clone n'est pas redéploye (la config Traefik n'est regeneree qu'au redéploiement). Un redéploiement Web clone via UI Coolify est necessaire pour appliquer la nouvelle config.

**Mise a jour COOLIFY-DEMO-3 etape 2 (2026-06-06)** : les FQDNs canoniques `demo-paris-local.welcomeparis.hotelmanager.fr` (Guest) et `admin-demo-paris-local.welcomeparis.hotelmanager.fr` (Reception) ont ete ajoutes au Web clone via MCP `coolify_application.update`. Quand l'utilisateur ouvre l'une de ces URLs, `tenant.ts:21-30` deduit correctement le slug `demo-paris-local` du hostname (pattern `{slug}.welcomeparis.hotelmanager.fr` deja supporte) et `tenant.ts:24-26` identifie le contexte `reception` depuis le prefixe `admin-` (pattern `admin-{slug}` deja supporte). Plus de 404 console navigateur, plus besoin de connaitre le slug a l'avance. Le code `tenant.ts` reste inchange, conformement a la regle "Ne pas modifier tenant.ts / ne pas creer de mapping ad hoc".

**Mise a jour COOLIFY-DEMO-4 (2026-06-06)** : la racine `https://demo.hotelmanager.fr/` a ete retirees du Web clone. Cette racine faisait deduire `slug=demo` par `tenant.ts:33-41` ("demo" pas dans la liste d'exclusion plateforme), ce qui provoquait des 404 console quand l'utilisateur l'ouvrait par defaut. En la retirant, plus de piege silencieux. L'utilisateur doit utiliser les URLs canoniques (`demo-paris-local.welcomeparis.hotelmanager.fr` ou `admin-demo-paris-local.welcomeparis.hotelmanager.fr`). La config Traefik est regeneree cote Coolify (plus de route `Host(demo.hotelmanager.fr)` dans les custom_labels), mais le reverse-proxy Caddy du conteneur Web clone continue de repondre 200 jusqu'au prochain redéploiement (recommande, pour figer la suppression au runtime).

### Staging public non identifie
Risque : les URLs publiques demo repondent mais pointent vers un environnement non identifie, potentiellement production ou une base partagee.

Gravite : haute.

Mitigation : ne lancer aucun seed, migration, deploy ou db push tant que web/API/DB dedies ne sont pas verifies ; confirmer une protection d'acces et un rollback staging ; ne pas utiliser production comme staging.

Statut : **ferme pour le clone demo** via COOLIFY-DEMO-1. Le clone pointe vers une DB dediee distincte, un JWT_SECRET distinct, des CORS/WEB_URL coherents avec `*.demo.hotelmanager.fr`. L'isolation est prouvee par l'asymetrie `clone /vendome=404` vs `prod /vendome=200`. Voir `docs/COOLIFY_DEMO_ISOLATION.md`.

### Fuite de secret via tool MCP Coolify
Risque : le tool `coolify_get_database` du MCP `@masonator/coolify-mcp@2.12.0` retourne par defaut en clair `postgres_password` et `internal_db_url` de la DB ciblee (prod comme demo). Le tool `coolify_env_vars` retourne egalement `real_value` en clair (meme pour les secrets comme `SEED_DEMO_SECRET`).

Gravite : moyenne (le token n'est pas persiste par l'agent dans un fichier, log ou commit, mais apparait dans la transcription de conversation).

Mitigation : ne JAMAIS copier la valeur d'un secret recu via MCP vers un fichier, log ou commit. Toujours reafficher la cible par son UUID ou son nom logique, jamais par sa valeur. Privilegier l'usage de `reveal: false` quand l'API MCP le supporte. Rotation recommandee des secrets exposes : mot de passe prod `ParisLocal_2026_ChangeMe_9xN4` (DB prod `hl7aaurvn9xrmj5y3g6bw5ds`), `SEED_DEMO_SECRET` (API clone) avant suppression definitive de l'endpoint one-off.

### Cartes Guest configurables exposees publiquement
Risque : une route publique expose par erreur un champ sensible, une carte desactivee, ou une image non validee.

Statut Vague 5F (PR #87, #88, #89) : risque ferme en local. La route publique filtre `enabled === true`, trie par `slot` puis `slotIndex`, tronque par les limites du plan, exclut `wifiPassword` et `whatsappNumber`, et les liens externes sont valides strictement en `http`/`https` avec `target="_blank" rel="noopener noreferrer"`. Le rendu legacy reste conserve si `guestCards` est absent, vide, invalide ou totalement desactive. Validation : audit UI 6/6, typecheck/build/diff OK, aucun secret expose. Staging et production non encore valides.

### Services hotel configurables exposes publiquement
Risque : la Guest App affiche un service desactive, hors forfait, non visible cote client ou expose un champ interne de configuration.

Statut Vague 6F (PR #95, #96, #97) : risque ferme en local. La route publique settings retourne un DTO safe des services actifs, visibles, tries par `order` et limites defensivement par le forfait ; la Guest App filtre encore via `useEnabledServices` et conserve le rendu legacy si la configuration est absente, vide, invalide ou totalement desactivee. Les formulaires existants Taxi, Room service, linge/Pressing/Blanchisserie et Reception restent preserves. Validation locale : health/ready/web OK, fallback legacy OK, Taxi dynamique OK, Room service dynamique OK, service desactive masque, mobile 375px OK, audit UI 6/6, typecheck/build/diff OK, aucun secret expose. Staging et production non encore valides.

### Checklist staging ignoree
Risque : lancer une operation hors local sans avoir reuni les preuves minimales de staging controle.

Gravite : haute.

Mitigation : appliquer la checklist `Validation staging controle avant seed hors local` dans `DEPLOIEMENT.md` avant toute action ; stopper si une preuve manque.

### Phase 10 trop large
Risque : melanger services client, tags demandes, tri, supervision Admin Hotel et historique dans une seule PR technique.

Gravite : moyenne.

Mitigation : suivre l'ordre Phase 10A a 10E documente dans `docs/PRODUCT_ROADMAP_SERVICES_REQUESTS_HISTORY.md`, garder des PR petites, et stopper si une migration devient necessaire sans validation explicite.

## 2. Risques securite
### Exposition de donnees CRM publiques
Risque : notes internes, tags, preferences ou coordonnees clients exposees dans la Guest App.

Gravite : critique.

Mitigation : routes publiques limitees, DTO publics, tests manuels par hotelSlug.

### Secrets dans documentation
Risque : valeurs sensibles copiees dans un fichier Markdown.

Gravite : haute.

Mitigation : ne jamais afficher de secrets, utiliser uniquement des placeholders generiques, recherche anti-secrets avant commit docs.

### Droits utilisateurs insuffisamment stricts
Risque : hotel_admin ou receptionist accedent a un autre hotel ou a des surfaces super_admin.

Gravite : haute.

Mitigation : roles stricts, requireRole, requireHotelAccess, tests de tentative d'acces croise.

## 3. Risques UX/UI
### Interface reception trop dense
Risque : la reception perd en vitesse operationnelle.

Gravite : moyenne.

Mitigation : tables claires, filtres, badges, KPI lisibles, actions visibles.

### Tags demandes ambigus
Risque : afficher des tags incoherents si les libelles sont derives de `type` et `details` sans dictionnaire commun.

Gravite : moyenne.

Mitigation : commencer par un mapping frontend simple, documenter les libelles, puis evaluer une configuration par hotel seulement si le besoin est confirme.

### Guest App trop SaaS/admin
Risque : l'experience client ne parait pas premium.

Gravite : moyenne.

Mitigation : themes hoteliers, mobile-first, visuels, navigation simple, ton concierge.

### Cartes Guest App configurees mais non visibles
Risque historique : un Hotel Admin sauvegardait des cartes Guest App dans l'editeur PR #86 et s'attendait a les voir immediatement cote client, alors que `GuestShell` n'etait pas encore branche.

Gravite : moyenne.

Mitigation : Vague 5F finalisee localement. Les cartes actives sont visibles cote Guest App via le branchement public safe ; conserver la mention staging/production non valides et le fallback legacy.

### Exposition publique prematuree des guestCards
Risque historique : exposer des cartes configurees par hotel avant d'avoir valide le DTO public et les donnees autorisees.

Gravite : haute.

Mitigation : Vague 5F finalisee localement avec DTO public safe, filtrage `enabled === true`, limites de plan, securite des liens externes et fallback legacy. Staging et production restent a valider avant annonce publique.

### Demo commerciale confuse
Risque : trop de surfaces techniques affichees au prospect.

Gravite : haute.

Mitigation : demo tenant neutre, runbook, checklist avant rendez-vous, ne pas montrer infrastructure.

### Super Admin montre en demo client
Risque : Super Admin affiche des elements internes ou Vendome localement, ce qui brouille le discours demo neutre.

Gravite : moyenne.

Mitigation : garder Super Admin comme surface interne uniquement ; montrer au prospect Guest App, Reception et Admin Hotel demo ; ne jamais ouvrir `/admin/users` pendant une demo client.

### Confusion Vendome / tenant demo neutre
Risque : la demonstration commerciale affiche Vendome au lieu de `demo-paris-local`, ce qui affaiblit le discours commercial et peut exposer une reference hotel existante.

Gravite : haute.

Mitigation : utiliser Hôtel Lumière Demo Paris comme support demo, garder Vendome uniquement comme reference historique, production ou monitoring si necessaire, verifier la checklist avant rendez-vous.

### Audit UI local non representatif
Risque : tirer des conclusions UI a partir d'un environnement localhost degrade, avec API, DB ou tenant demo indisponibles.

Gravite : moyenne.

Mitigation : distinguer audit local, staging et production ; comparer les captures Playwright a un environnement representatif ; documenter explicitement les etats observes sur captures partagees.

### Confusion captures reelles / validation complete
Risque : considerer des captures partagees comme preuve que toutes les interfaces sont production-ready.

Gravite : moyenne.

Mitigation : utiliser la formulation "observe sur captures partagees", conserver les verifications manuelles avant demo, et ne pas annoncer production-ready sans audit complet.

## 4. Risques business
### Surpromesse integrations
Risque : promettre PMS, paiement, AI ou APIs externes avant disponibilite.

Gravite : haute.

Mitigation : package Boutique au lancement, modules futurs clairement separes.

### Donnees demo non convaincantes
Risque : demo trop vide, peu credible.

Gravite : moyenne.

Mitigation : scenario demo riche avec clients, demandes, avis, CRM, recommandations.

### Historique client mal cadre
Risque : garder les clients partis dans les listes operationnelles ou perdre le contexte complet du sejour.

Gravite : moyenne.

Mitigation : separer clients presents et historique, conserver les liens `guestId` et `stayId`, et cadrer toute evolution de retention avec prudence RGPD.

### Cible trop large
Risque : construire pour palaces et petits hotels simultanement.

Gravite : moyenne.

Mitigation : cible initiale independants et boutique hotels, package Boutique.

## 5. Dette technique
- Monofichiers frontend a continuer de decouper.
- Types legacy dans apps/web/src/types et pages orphelines.
- Typage API frontend a renforcer.
- Tests automatises encore a structurer.
- Documentation a maintenir apres chaque phase majeure.

## 6. Risques actuels a surveiller
- Etat live production non verifie dans cette passe docs-only.
- Configuration DNS/SSL non auditee dans cette passe.
- Tenant demo `demo-paris-local` valide localement avec donnees fictives, mais non valide sur les URLs publiques.
- URLs publiques demo : Guest App en HTTP 200 avec `Hotel not found`, Reception/Admin en HTTP 200 avec login generique.
- Separation staging/production, DB dediee, API dediee, web dedie, protection d'acces et absence de donnees reelles non verifiees.
- Checklist staging controle a appliquer avant tout seed, migration ou deploy hors local.
- Validation locale post-login OK : Reception demo et Admin Hotel demo ne montrent pas Vendome, Super Admin local reste interne uniquement.
- Les captures Playwright locales peuvent etre non representatives d'un environnement public/staging non prepare.
- Vendome reste une reference historique/production/monitoring possible, mais ne doit pas remplacer le tenant neutre commercial.
- Le seed demo neutre doit rester separe du seed Vendome et ne doit jamais supprimer de donnees hors `hotel_id` demo.
- Vague 5 cartes Guest App : affichage Guest App branche localement en Vague 5F avec fallback legacy ; staging et production non encore valides.
- Vague 6 services configurables : affichage Guest App branche localement en Vague 6F avec fallback legacy ; staging et production non encore valides.
