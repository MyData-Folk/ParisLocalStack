# Product Strategy & Roadmap - ParisLocalStack

## 1. Objectif du document

Ce document sert a cadrer la strategie produit de ParisLocalStack et a guider les futurs agents de code. Il aide a eviter la dispersion, a distinguer le MVP vendable de la differenciation et de la vision long terme, et a aligner produit, demo commerciale et roadmap.

Il ne remplace pas le runbook de demo. Il fixe le cap produit : quoi vendre en premier, quoi construire ensuite, et quoi ne pas developper maintenant.

## 2. Cible commerciale prioritaire

### Cible principale

- hotels 3 etoiles independants ;
- boutique hotels ;
- petits hotels 4 etoiles independants ;
- appart-hotels et residences hotelieres.

### Pourquoi

Ces etablissements ont souvent une reception surchargee, une digitalisation limitee, un besoin CRM concret, des recommandations locales a valoriser et un budget limite mais reel. Ils recherchent surtout un outil cle en main, rapide a mettre en place, qui ameliore l'experience client sans projet technique lourd.

### Cibles secondaires

- petits hotels 2 etoiles independants, seulement avec une offre Starter tres simple ;
- hotels 5 etoiles et palaces plus tard, apres validation commerciale ;
- grandes chaines plus tard, notamment lorsque les integrations PMS seront justifiees.

## 3. Positionnement commercial

Promesse recommandee :

ParisLocalStack aide les hotels independants a transformer un QR code en canal client direct : informations utiles, demandes en chambre, messagerie reception, recommandations locales et CRM avec consentement, sans application a telecharger.

Regles commerciales :

- ne pas promettre de chiffres garantis ;
- parler de potentiel, de gain de temps, d'opportunites d'upsell et de relation directe ;
- rester centre sur l'hotelier et l'exploitation quotidienne ;
- presenter la technologie comme un support fiable, pas comme le coeur du discours.

## 4. Packages commerciaux recommandes

### Starter

Cible :

- petits hotels 2-3 etoiles ;
- independants avec budget serre.

Modules :

- Guest App QR ;
- infos Wi-Fi, horaires et services ;
- messagerie ;
- taxi simple ;
- housekeeping ;
- maintenance ;
- avis ;
- dashboard basique ;
- recommandations simples ;
- theme standard.

Prix indicatif :

- 49 EUR/mois recommande ;
- 29 EUR/mois seulement comme offre d'appel tres limitee.

### Boutique

Cible prioritaire :

- boutique hotels ;
- hotels 3 etoiles premium ;
- petits 4 etoiles.

Modules :

- tout Starter ;
- recommandations avec images ;
- transfert aeroport ;
- late checkout et upgrade ;
- FAQ multilingue ;
- theme personnalise ;
- CRM basique ;
- exports.

Prix indicatif :

- 79 a 129 EUR/mois.

Mention : Boutique est le package principal de lancement.

### Premium

Cible :

- hotels 4 etoiles ;
- appart-hotels haut de gamme.

Modules :

- tout Boutique ;
- room service structure ;
- analytics ;
- CRM avance ;
- carte quartier ;
- modules longs sejours ;
- multilangue etendu.

Prix indicatif :

- 199 a 349 EUR/mois.

### Palace

Cible :

- hotels 5 etoiles ;
- palaces ;
- luxe.

Modules :

- conciergerie VIP ;
- integration PMS ;
- chauffeur prive ;
- preferences memorisees ;
- IA multilingue ;
- SLA ;
- onboarding sur site.

Prix :

- sur devis.

Decision : Palace ne doit pas etre vise comme MVP.

## 5. Modules P1 / P2 / P3

### P1 - MVP commercial immediat

- Guest App QR code ;
- Wi-Fi, horaires et infos services ;
- informations check-in / check-out ;
- messagerie client <-> reception ;
- demande taxi / VTC ;
- housekeeping ;
- maintenance ;
- avis client / feedback ;
- recommandations locales simples ;
- dashboard reception ;
- CRM consentement ;
- exports CRM.

### P2 - Differenciation commerciale

- transfert aeroport ;
- reservation restaurant ;
- late checkout ;
- upgrade ;
- recommandations avec images ;
- FAQ multilingue ;
- suivi statut demandes cote client ;
- carte quartier simple ;
- blanchisserie ;
- accessibilite PMR ;
- themes UI personnalisables.

### P3 - Premium / long terme

- room service complet ;
- spa / wellness ;
- billetterie musees et spectacles ;
- chauffeur prive ;
- conciergerie VIP ;
- integration PMS Opera/Mews ;
- IA multilingue ;
- app native ;
- RATP / IDF Mobilites API.

Decision : P3 ne doit pas etre developpe avant validation commerciale P1/P2.

## 6. Formulaires structures prioritaires

### 1. Taxi / VTC

- Valeur client : commander un trajet clairement, sans aller-retour inutile.
- Valeur reception : recevoir date, heure, destination et contraintes.
- Champs principaux : date, heure, depart, destination, aeroport/gare si applicable, passagers, bagages, telephone, commentaire.
- Statuts attendus : nouveau, en cours, confirme, urgent, traite, annule.
- Alertes utiles : depart proche, aeroport, beaucoup de bagages, demande urgente.
- Interet CRM : habitudes de transport, aeroport prefere, besoins famille/business.

### 2. Housekeeping

- Valeur client : demander linge, nettoyage ou confort chambre rapidement.
- Valeur reception : qualifier la demande et la transmettre.
- Champs principaux : type, quantite, chambre, urgence, commentaire.
- Statuts attendus : nouveau, assigne, en cours, traite.
- Alertes utiles : urgence, plusieurs demandes meme chambre.
- Interet CRM : preferences de confort et besoins repetes.

### 3. Maintenance

- Valeur client : signaler un probleme simple.
- Valeur reception : prioriser selon impact sejour.
- Champs principaux : categorie, description, photo future, urgence, chambre.
- Statuts attendus : nouveau, en cours, technicien demande, resolu.
- Alertes utiles : chauffage, eau, serrure, electricite, securite.
- Interet CRM : suivi qualite et historique incident sejour.

### 4. Reservation restaurant simple

- Valeur client : demander une table sans chercher seul.
- Valeur reception : comprendre besoin, budget et contraintes.
- Champs principaux : date, heure, nombre de personnes, cuisine, budget, quartier, restaurant souhaite, contraintes alimentaires.
- Statuts attendus : nouveau, recherche, confirme, impossible, traite.
- Alertes utiles : demande tardive, grande table, contrainte alimentaire.
- Interet CRM : preferences culinaires et potentiel recommandations.

### 5. Transfert aeroport

- Valeur client : organiser arrivee/depart avec confiance.
- Valeur reception : capter un service premium et coordonner le prestataire.
- Champs principaux : aeroport, date, heure, numero de vol, passagers, bagages, type vehicule, telephone.
- Statuts attendus : nouveau, devis, confirme, chauffeur assigne, traite.
- Alertes utiles : horaire proche, vol international, besoin van.
- Interet CRM : profil voyageur, upsell transport, anticipation prochain sejour.

## 7. Dashboard Reception cible

La Reception est le coeur de l'adoption operationnelle. Elle doit rester rapide, lisible et orientee action.

Vision cible :

- demandes actives ;
- filtres statut, type, urgence, chambre et date ;
- code couleur urgence ;
- fiche demande detaillee ;
- reponse rapide ;
- assignation interne ;
- notes internes ;
- historique client ;
- timeline demande ;
- cloture ;
- archivage post-checkout ;
- notifications live ;
- compteur demandes ouvertes.

## 8. CRM et RGPD

Donnees utiles :

- email ;
- telephone ;
- langue preferee ;
- dates de sejour ;
- preferences declarees ;
- demandes frequentes ;
- restaurants aimes ;
- transports utilises ;
- score satisfaction ;
- consentement CRM ;
- tags internes ;
- notes internes.

Regles :

- consentement explicite pour marketing ;
- opt-in SMS distinct si applicable ;
- ne pas exporter notes internes ou champs sensibles ;
- ne jamais afficher de donnees personnelles reelles en demo ;
- positionner le CRM comme outil de relation directe post-OTA.

## 9. Recommandations locales

Les recommandations locales sont un axe strategique fort pour les hotels independants et boutique hotels. Elles doivent etre editoriales, fiables et personnalisees par hotel.

Categories importantes :

- restaurants ;
- cafes et boulangeries ;
- bars ;
- musees ;
- pharmacies ;
- supermarches ;
- transports ;
- experiences locales ;
- lieux famille ;
- itineraires a pied ;
- bons plans quartier.

Positionnement :

- eviter un simple export Google Maps ;
- valoriser les choix de l'hotel ;
- prevoir images et personnalisation en P2 ;
- utiliser les recommandations comme support d'experience client et de differenciation.

## 10. Ce qu'il ne faut pas developper maintenant

- Oracle Opera ;
- Mews ;
- Salesforce CRM ;
- app native ;
- IA multilingue avancee ;
- billetterie complete ;
- paiement integre ;
- RATP temps reel ;
- modules Palace ;
- SLA dedie ;
- onboarding sur site ;
- automatisations complexes non necessaires a la demo.

Objectif : eviter la dispersion, proteger la vitesse de lancement et garder un MVP vendable.

## 11. Roadmap recommandee

### Etape A - Demo commerciale propre

- runbook demo ;
- donnees fictives ;
- QR code ;
- Guest App / Reception / Admin Hotel ;
- ne pas montrer Super Admin / Generator.

### Etape B - Hotel demo neutre

- tenant demo non lie a Vendome ;
- donnees fictives propres ;
- emails et telephones fictifs ;
- scenario stable.

### Etape C - Formulaires services prioritaires

- Taxi / VTC ;
- Housekeeping ;
- Maintenance ;
- Restaurant simple ;
- Transfert aeroport.

### Etape D - Recommandations enrichies

- categories ;
- images ;
- distances ;
- tags famille/business/couple/local.

### Etape E - Design System / Templates

- themes par package ;
- templates Super Admin ;
- choix Admin Hotel ;
- preview ;
- application Guest App/Reception.

### Etape F - CRM avance

- segmentation ;
- consentements ;
- exports ;
- historique sejour ;
- campagnes directes.

## 12. Risques et mitigations

- Onboarding trop complexe : limiter le premier setup a un hotel demo, QR, infos utiles, services P1 et quelques recommandations.
- Prix trop bas : garder Starter simple et pousser Boutique comme package principal de lancement.
- Surcharge fonctionnelle : separer P1, P2 et P3 et refuser PMS/IA/app native tant que P1/P2 ne sont pas valides commercialement.
- Absence de donnees de demo propres : creer un tenant demo neutre avec donnees fictives avant tout rendez-vous important.
- Promesses chiffrees non prouvees : parler de potentiel et de gain operationnel, pas de resultats garantis.
- Exposition de donnees personnelles : utiliser uniquement des donnees fictives ou explicitement validees en demo.
- Vocabulaire technique en demo : parler metier hotelier, pas infrastructure.
- Integrations PMS prematurees : les garder en P3 jusqu'a demande client payante ou partenariat clair.
- Design pas assez premium : cadrer une phase Design System / Templates apres le tenant demo.

## 13. Decision recommandee apres cette phase

1. Merger cette documentation.
2. Creer un hotel demo neutre avec donnees fictives.
3. Preparer les formulaires services prioritaires.
4. Lancer Phase 10 Design System / Templates apres cadrage du tenant demo.
5. Ne pas lancer PMS, IA avancee, app native ou Palace maintenant.
