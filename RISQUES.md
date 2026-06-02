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

### Guest App trop SaaS/admin
Risque : l'experience client ne parait pas premium.

Gravite : moyenne.

Mitigation : themes hoteliers, mobile-first, visuels, navigation simple, ton concierge.

### Demo commerciale confuse
Risque : trop de surfaces techniques affichees au prospect.

Gravite : haute.

Mitigation : demo tenant neutre, runbook, checklist avant rendez-vous, ne pas montrer infrastructure.

### Confusion Vendome / tenant demo neutre
Risque : la demonstration commerciale affiche Vendome au lieu de `demo-paris-local`, ce qui affaiblit le discours commercial et peut exposer une reference hotel existante.

Gravite : haute.

Mitigation : utiliser Hôtel Lumière Demo Paris comme support demo, garder Vendome uniquement comme reference historique, production ou monitoring si necessaire, verifier la checklist avant rendez-vous.

## 4. Risques business
### Surpromesse integrations
Risque : promettre PMS, paiement, AI ou APIs externes avant disponibilite.

Gravite : haute.

Mitigation : package Boutique au lancement, modules futurs clairement separes.

### Donnees demo non convaincantes
Risque : demo trop vide, peu credible.

Gravite : moyenne.

Mitigation : scenario demo riche avec clients, demandes, avis, CRM, recommandations.

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
- Tenant demo `demo-paris-local` valide dans la documentation mais non encore cree dans cette passe.
