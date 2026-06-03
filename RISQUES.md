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

### Staging public non identifie
Risque : les URLs publiques demo repondent mais pointent vers un environnement non identifie, potentiellement production ou une base partagee.

Gravite : haute.

Mitigation : ne lancer aucun seed, migration, deploy ou db push tant que web/API/DB dedies ne sont pas verifies ; confirmer une protection d'acces et un rollback staging ; ne pas utiliser production comme staging.

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
Risque : un Hotel Admin sauvegarde des cartes Guest App dans l'editeur PR #86 et s'attend a les voir immediatement cote client, alors que `GuestShell` n'est pas encore branche.

Gravite : moyenne.

Mitigation : documenter clairement que les cartes sauvegardees ne seront visibles dans la Guest App qu'en Vague 5F ; ne pas presenter cette personnalisation comme visible client avant la PR d'affichage public.

### Exposition publique prematuree des guestCards
Risque : exposer des cartes configurees par hotel avant d'avoir valide le DTO public et les donnees autorisees.

Gravite : haute.

Mitigation : garder l'API guest-cards privee jusqu'a 5F ; ne pas modifier la route publique ni `GuestShell` sans validation explicite ; verifier que les cartes ne contiennent pas de donnees privees avant exposition.

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
- Vague 5 cartes Guest App : editeur Hotel Admin disponible, mais affichage Guest App non branche avant 5F ; ne pas montrer cette personnalisation comme visible client tant que `GuestShell` n'est pas modifie.
