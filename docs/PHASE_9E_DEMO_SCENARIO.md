# PHASE_9E_DEMO_SCENARIO.md

## Objectif
Definir un scenario demo neutre pour presenter ParisLocalStack sans aucune donnee reelle.

## Tenant demo
Nom valide : Hôtel Lumière Demo Paris.

Slug valide : demo-paris-local.

URL client cible : https://demo-paris-local.welcomeparis.hotelmanager.fr

URL reception cible recommandee : https://admin-demo-paris-local.welcomeparis.hotelmanager.fr

Les donnees doivent rester 100 % fictives. Vendome ne doit pas etre utilise comme support de demo commerciale client.

## Hotel demo
Identite fictive :
- Nom : Hôtel Lumière Demo Paris.
- Ville : Paris.
- Pays : France.
- Positionnement : boutique hotel 4 etoiles fictif.
- Ambiance : premium, elegante, parisienne.

Informations pratiques fictives :
- WiFi : Lumiere Demo WiFi.
- Petit-dejeuner : 07:00 - 10:30.
- Check-in : 15:00.
- Check-out : 11:00.
- Reception : disponible 24h/24.

## Chambres demo
Chambres proposees : 101, 204, 305, 410.

## Clients demo
Clients fictifs :
- Camille Martin, chambre 204, langue fr, consentement CRM oui.
- Alex Turner, chambre 101, langue en, consentement CRM non.
- Sofia Rossi, chambre 305, langue it, consentement CRM oui.
- Lea Dubois, chambre 410, langue fr, statut relation prioritaire.

Coordonnees : utiliser uniquement des exemples fictifs non routables.

## CRM demo
Tags CRM proposes : VIP, Famille, Business, Allergie alimentaire, Preference chambre calme.

Preferences fictives : chambre calme, taxi van, restaurant vegetarien, depart tardif souhaite.

Notes internes fictives : client sensible a la rapidite de reponse, preference pour communication en anglais, demande oreillers supplementaires recurrente.

## Demandes demo
Demandes a preparer :
- Taxi vers aeroport CDG, 2 passagers, 3 bagages.
- Reservation restaurant pour 2 personnes, cuisine francaise, budget premium.
- Serviettes supplementaires, priorite normale.
- Assistance reception urgente pour climatisation.

Statuts a preconfigurer : Nouveau, En cours, Urgent, Traite.

## Messages demo
Conversation type :
1. Client demande l'heure du petit-dejeuner.
2. Reception repond avec horaires.
3. Client demande un taxi.
4. Reception confirme la prise en charge.

## Avis demo
Avis positifs : 5/5 sur la qualite de l'accueil, 4/5 sur le guide local.

Avis faible pour demo alerte : 2/5 sur un delai de room service fictif.

## Recommandations demo
Categories : Restaurants, Cafes, Musees, Pharmacies, Transports, Bons plans quartier.

Exemples fictifs : Bistrot Demo Rive Droite, Cafe Demo Palais, Galerie Demo Paris, Pharmacie Demo Centrale, Metro Demo Ligne 1.

## Scenario de demonstration
1. Montrer le QR code.
2. Ouvrir la Guest App mobile.
3. Faire l'onboarding client.
4. Consulter WiFi et horaires.
5. Envoyer une demande taxi.
6. Basculer reception et voir la demande.
7. Repondre au client.
8. Montrer la fiche client/sejour.
9. Montrer CRM et historique.
10. Montrer les avis.
11. Montrer la personnalisation hotel.

## Controle environnement
Avant de jouer ce scenario, distinguer clairement l'environnement utilise : local, staging ou production. Un audit Playwright local peut afficher un etat d'erreur, de fallback ou de login si l'API, la DB ou le tenant demo ne sont pas disponibles.

Les captures reelles observees sur captures partagees le 2026-06-02 montrent des surfaces plus avancees que les premieres captures Playwright locales, mais ne remplacent pas la verification complete du tenant neutre `demo-paris-local`.

Statut Phase 9E au 2026-06-02 :
- local valide : Guest App OK, Reception post-auth OK, Admin Hotel post-auth OK, donnees 100 % fictives.
- public/staging non valide : Guest App publique HTTP 200 mais `Hotel not found`; Reception/Admin publique HTTP 200 avec login generique.
- separation staging/production, DB dediee, API dediee, web dedie et protection d'acces non verifies.
- seed staging interdit tant que l'isolation n'est pas prouvee.

## Regle importante
Aucune donnee reelle. Aucune capture infrastructure. Aucune exposition de configuration sensible.
