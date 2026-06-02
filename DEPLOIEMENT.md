# DEPLOIEMENT.md - ParisLocalStack

## 1. Objectif
Documenter le deploiement ParisLocalStack sans exposer de secret.

Ce fichier complete la documentation existante et sert de resume operationnel.

## 2. Architecture de deploiement
ParisLocalStack est deploye comme une stack SaaS multi-tenant : service web, service API, service PostgreSQL, stockage fichiers selon configuration, reverse proxy et SSL geres par l'environnement de deploiement.

## 3. Docker
Fichiers connus : Dockerfile.web, Dockerfile.api, docker-compose.yml.

Regles :
- le service API doit appliquer les migrations versionnees au demarrage production.
- le service API ne doit pas utiliser de commande destructive de synchronisation schema en production.
- les builds doivent etre verifies avant deploiement.

## 4. Coolify
Projet connu : ParisLocalStack.

Services connus :
- paris-local-web.
- paris-local-api.
- paris-local-postgres.

Domaines connus :
- welcomeparis.hotelmanager.fr.
- api.welcomeparis.hotelmanager.fr.
- {hotelSlug}.welcomeparis.hotelmanager.fr.
- admin-{hotelSlug}.welcomeparis.hotelmanager.fr.
- admin.{hotelSlug}.welcomeparis.hotelmanager.fr pour compatibilite legacy.

Regles :
- ne pas modifier les domaines sans validation.
- verifier les logs apres deploiement.
- verifier `/health` et `/ready` apres changement API.

## 5. Cloudflare / DNS
Objectif : supporter les sous-domaines multi-tenant.

A verifier avant toute intervention : wildcard app client, wildcard reception recommandee, certificat SSL valide, routage API separe.

Information non verifiee : configuration Cloudflare exacte dans cette passe.

## 6. VPS
Le VPS heberge Coolify et les services applicatifs.

Regles :
- ne pas lancer de backup/restore sans procedure explicite.
- ne pas afficher de secrets dans les logs ou rapports.
- verifier l'espace disque avant operations lourdes.

Information non verifiee : capacite disque et charge actuelle du VPS dans cette passe.

## 7. PostgreSQL
Base centrale multi-tenant.

Regles :
- isolation par hotel_id.
- migrations versionnees.
- pas de suppression physique de donnees client sans procedure.
- les donnees historiques CRM restent consultables selon permissions.

## 8. Stockage objet / R2
Backups R2 documentes dans l'historique projet.

Regles :
- ne jamais documenter les valeurs sensibles.
- verifier periodicite et retention.
- tester les restores uniquement en environnement non production.

## 9. Sauvegardes
Etat connu : monitoring et sauvegardes ont ete documentes et valides historiquement.

Checklist de verification : backup planifie actif, notification d'echec active, restore staging/test valide, pas de restore production sans validation explicite.

## 10. Healthchecks
Endpoints connus :
- `/health` : disponibilite API.
- `/ready` : disponibilite API + dependances critiques.

A verifier apres deploiement : reponse API OK, readiness OK, logs sans erreur critique.

## 11. Interdits operationnels
- Ne jamais afficher de secrets.
- Ne jamais committer de fichier d'environnement.
- Ne jamais lancer de migration non preparee.
- Ne jamais restaurer la production sans procedure.
- Ne jamais modifier DNS/Coolify pendant une session docs-only.

## 12. Garde-fous staging demo
Statut Phase 9E au 2026-06-02 : la demo locale `demo-paris-local` / Hôtel Lumière Demo Paris est validee, mais le staging public n'est pas valide.

Constats publics sans login :
- `https://demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 mais affiche `Hotel not found`.
- `https://admin-demo-paris-local.welcomeparis.hotelmanager.fr` repond HTTP 200 avec un login generique.

Avant toute action staging :
- confirmer quelle app web, quelle API et quelle base servent ces domaines ;
- confirmer une DB staging dediee, distincte de production ;
- confirmer une protection d'acces si les comptes demo sont exposes sur domaine public ;
- confirmer un rollback staging avant seed ;
- ne jamais utiliser production comme staging ;
- ne jamais lancer seed, migration, deploy, reset ou db push sur un environnement non identifie.

## 13. Validation staging controle avant seed hors local
Cette checklist est obligatoire avant tout seed, migration ou deploiement hors local pour une demo `demo-paris-local`.

### Preuves d'environnement attendues
- [ ] Environnement staging identifie par nom.
- [ ] Application web staging dediee identifiee.
- [ ] Application API staging dediee identifiee.
- [ ] Base PostgreSQL staging dediee identifiee.
- [ ] Confirmation explicite que `DATABASE_URL` ne pointe pas vers production, sans afficher sa valeur.
- [ ] Domaines staging/demo associes listes.
- [ ] Protection d'acces confirmee, ou decision explicite d'exposition publique documentee.
- [ ] Absence de donnees reelles verifiee avant seed.
- [ ] Rollback staging defini avant seed.
- [ ] Methode d'execution du seed compatible staging confirmee.
- [ ] Methode de suppression ciblee du tenant demo definie par `slug` ou `hotel_id`.

### Validations applicatives attendues
- [ ] `/health` repond correctement sur l'API staging.
- [ ] `/ready` confirme la disponibilite DB sur l'API staging.
- [ ] Guest App publique charge le tenant `demo-paris-local`.
- [ ] Hôtel Lumière Demo Paris est visible sur la Guest App staging.
- [ ] Reception/Admin staging sont accessibles sans exposer de credentials.
- [ ] Aucun login public non autorise n'est tente.
- [ ] Aucun contenu Vendome ou donnees reelles ne sont visibles dans le parcours demo.

### Garde-fous obligatoires
- Aucun seed hors local sans DB staging dediee prouvee.
- Aucune migration hors local sans environnement identifie.
- Aucun deploiement vers production pour tester une demo.
- Ne jamais utiliser production comme staging.
- Ne jamais afficher de secret, valeur d'environnement, token ou mot de passe.
- Proteger les comptes demo si un domaine public est utilise.
- Ne pas lancer de backup, restore, reset ou db push pour preparer une demo.

### Etat actuel connu
- Local Phase 9E : pret RDV.
- Staging : non valide.
- URLs publiques demo : repondent, mais Guest App publique observee en `Hotel not found`.
- Admin/Reception publique : observee en login generique.
- Coolify lecture seule : precedemment non disponible (`Unauthenticated`).
