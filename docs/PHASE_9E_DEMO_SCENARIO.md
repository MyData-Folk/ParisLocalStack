# PHASE_9E_DEMO_SCENARIO.md

## Objectif
Definir un scenario demo neutre pour presenter ParisLocalStack sans aucune donnee reelle.

## Tenant demo
Nom valide : Hôtel Lumière Demo Paris.

Slug valide : demo-paris-local.

URL client cible : https://demo-paris-local.welcomeparis.hotelmanager.fr

URL reception cible recommandee : https://admin-demo-paris-local.welcomeparis.hotelmanager.fr

Les donnees doivent rester 100 % fictives. Vendome ne doit pas etre utilise comme support de demo commerciale client.

## Raccourcis demo locaux
Raccourcis complets a conserver pour la demonstration locale :
- Guest App : `http://localhost:5173/h/demo-paris-local/welcome`
- Messages client : `http://localhost:5173/h/demo-paris-local/messages`
- Reception demo : `http://localhost:5173/reception`
- Admin Hotel demo : `http://localhost:5173/hotel-admin`
- Super Admin : `http://localhost:5173/admin`, surface interne uniquement.
- API health : `http://localhost:4000/health`
- API ready : `http://localhost:4000/ready`
- Audit UI local : `npm run audit:ui`

Emails demo attendus, sans mot de passe dans Git :
- Reception : `reception@demo-paris-local.test`
- Admin Hotel / Manager : `manager@demo-paris-local.test`
- Super Admin : `admin@paris-local.test`

Les raccourcis Reception et Admin Hotel doivent ouvrir le contexte `demo-paris-local` / Hôtel Lumière Demo Paris. Ils ne doivent pas ouvrir Vendome dans le parcours demo client.

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

## Validation locale post-login
Statut local valide au 2026-06-02 :
- Guest App `demo-paris-local` accessible et affiche Hôtel Lumière Demo Paris.
- Reception demo : login OK, dashboard visible, Vendome absent du parcours demo.
- Admin Hotel demo : login OK, espace hotel visible, Vendome absent du parcours demo.
- Super Admin local `/admin/users` : login OK, page utilisateurs accessible.

Super Admin est une surface interne uniquement. Il peut contenir Vendome localement car le seed principal a ete execute pour creer le compte super admin ; cette presence est attendue et ne doit pas apparaitre dans le parcours de demonstration client.

## Note Vague 5 - Cartes Guest App
La personnalisation des cartes Guest App est en cours de construction par couches :
- PR #81 : modele `guestCards` et `commercialPackage`.
- PR #82 : API plan commercial.
- PR #84 : modification du forfait par Super Admin et lecture seule par Hotel Admin.
- PR #85 : API privee guest-cards.
- PR #86 : editeur Hotel Admin des cartes Guest App.

Hotel Admin peut configurer image, titre, description, action, cible, ordre et actif/inactif, dans les limites de son forfait. Super Admin reste responsable du forfait.

Limite importante pour le scenario : ces cartes sauvegardees ne sont pas encore affichees dans la Guest App locale ou publique. `GuestShell` sera branche plus tard en Vague 5F, apres validation des donnees publiques autorisees.

## Regle importante
Aucune donnee reelle. Aucune capture infrastructure. Aucune exposition de configuration sensible.
