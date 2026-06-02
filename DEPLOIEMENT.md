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
