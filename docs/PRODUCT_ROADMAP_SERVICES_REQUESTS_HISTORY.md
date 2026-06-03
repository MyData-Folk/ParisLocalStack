# Roadmap produit - Services, demandes, dashboards et historique client

Statut : cadrage documentaire avant Phase 10.

Objectif : organiser les prochaines petites PR produit autour des services client, des tags de demandes, des dashboards Reception/Admin Hotel, du tri clients et de l'historique client.

## Diagnostic

### Services client

Constat :
- Les services visibles cote Guest App sont aujourd'hui definis dans `apps/web/src/apps/guest/GuestShell.tsx`.
- Les services ne sont pas encore configurables par hotel, meme si `HotelSettings.modules` permet deja d'activer ou masquer des modules.
- Le service `towels` existe dans le frontend sous le libelle `Serviettes`.
- Les demandes creees portent deja un `type`, un `title`, une `description`, des `details`, un `status` et une `priority`.
- Remplacer le libelle visible `Serviettes` par `Service d'etage` est possible sans migration si le `type` historique reste stable ou si un mapping d'affichage est ajoute.

Lecture produit :
- La Guest App doit separer les services internes de l'hotel et les reservations externes.
- La future configuration par hotel devra rester multi-hotel et ne jamais coder une valeur specifique au tenant demo.

Services de l'hotel cibles :
- Service d'etage
- Maintenance
- Petit dejeuner
- Room service
- Restauration de l'hotel
- Spa
- Piscine
- Parking
- Bagagerie
- Blanchisserie

Reservations externes cibles :
- Taxi
- Restaurant exterieur
- Excursion
- Musee
- Transfert aeroport
- Visite guidee

Future PR probable : `feat(guest): reorganize hotel services and request categories`.

Fichiers probables :
- `apps/web/src/apps/guest/GuestShell.tsx`
- eventuellement `apps/web/src/apps/reception/ReceptionApp.tsx` pour les libelles de demande
- eventuellement `packages/shared` si les categories deviennent partagees

### Tags de demandes

Constat :
- Le modele `ServiceRequest` contient deja `type`, `details`, `status` et `priority`.
- Aucun champ `category` ou `tag` separe n'est necessaire pour afficher un premier badge cote Reception.
- Les informations actuelles suffisent pour deriver un tag visible depuis `type` et parfois `details.category`.
- Une migration ne devient necessaire que si le produit veut stocker plusieurs tags persistants, une categorie canonique editable par hotel, ou des statistiques normalisees independantes du `type`.

Tags simples recommandes :
- Service d'etage
- Maintenance
- Room service
- Petit dejeuner
- Restauration
- Spa
- Piscine
- Taxi
- Restaurant
- Excursion
- Musee
- Transfert
- Urgent
- Autre

Future PR probable : `feat(requests): show category tags in reception`.

Fichiers probables :
- `apps/web/src/apps/reception/ReceptionApp.tsx`
- eventuellement `apps/web/src/apps/guest/GuestShell.tsx` pour aligner les libelles

### Dashboard Admin Hotel / Manager

Constat :
- L'Admin Hotel charge deja l'hotel courant et expose profil, recommandations, settings, modules, analytics, QR et CRM.
- Aucune route UI Admin Hotel dediee aux demandes client n'est visible dans l'etat actuel.
- Les donnees necessaires existent deja via les helpers API : demandes, messages, stays actifs, reviews et analytics.
- La reponse au client est deja possible cote Reception via le flux message staff sortant ; une vue Admin Hotel peut le reutiliser si le role `hotel_admin` est autorise sur le meme `hotelId`.

Vue cible :
- Demandes en attente
- Demandes en cours
- Demandes traitees
- Demandes urgentes
- Derniers messages
- Clients actifs
- Demandes par categorie
- Possibilite de repondre au client si besoin

Metriques disponibles sans migration :
- nombre de demandes par statut
- nombre de demandes urgentes
- nombre de messages ouverts
- nombre de clients actifs
- derniers messages/demandes par date
- categories derivees du `type`

Future PR probable : `feat(hotel-admin): add request supervision dashboard`.

Fichiers probables :
- `apps/web/src/apps/hotelAdmin/HotelAdminApp.tsx`
- nouveaux composants/pages locaux Admin Hotel
- `apps/web/src/lib/api.ts` seulement si un helper manque

### Tri clients presents

Constat :
- Les clients presents sont listes dans `ReceptionApp.tsx` via `GuestsView` et `StaysTableView`.
- L'historique client utilise le meme tableau avec le mode `archived`.
- Les donnees disponibles permettent deja de trier sans migration.

Tris possibles :
- par chambre : `roomNumber`
- par nom : `guest.firstName` / `guest.lastName`
- par date d'arrivee : `checkinDate`
- par date de depart : `checkoutDate`
- par activite recente : dernier message, demande ou avis calcule dans `buildStayRow`
- par urgence : demandes ouvertes ou priorite `urgent`

Priorite recommandee :
1. Chambre
2. Nom A-Z
3. Date de depart
4. Derniere activite
5. Urgence

Future PR probable : `feat(reception): add guest sorting controls`.

Fichiers probables :
- `apps/web/src/apps/reception/ReceptionApp.tsx`

### Historique client / archivage apres depart

Constat :
- `Stay` possede `checkinDate`, `checkoutDate` et `status`.
- Les statuts actifs sont deja separes des statuts archives dans l'API stays.
- Les messages, demandes et avis sont rattaches a `hotelId`, et peuvent aussi etre rattaches a `guestId` et `stayId`.
- La Reception dispose deja d'une vue clients presents et d'une vue historique.
- La fiche client/sejour sait reconstruire une timeline a partir du sejour, des messages, des demandes et des avis.

Regle cible :
- Client present : visible dans la liste operationnelle Reception.
- Client parti : retire de la liste clients presents.
- Client parti : conserve dans Historique.
- Historique conserve : messages, demandes, reponses, avis, tags, dates de sejour, chambre et statuts.

Evolution DB :
- Pas necessaire pour une premiere clarification frontend/API si les statuts existants suffisent.
- A evaluer plus tard si le produit exige une date d'archivage explicite, une raison d'archivage, une retention RGPD ou une anonymisation.

Future PR probable : `feat(guests): separate active stays from guest history`.

Fichiers probables :
- `apps/api/src/modules/stays/routes.ts`
- `apps/web/src/apps/reception/ReceptionApp.tsx`
- eventuellement docs RGPD produit si la retention devient une decision formelle

## Roadmap Phase 10

### Phase 10A - Services client et categories

Complexite : faible a moyenne.

Objectifs :
- remplacer le libelle `Serviettes` par `Service d'etage` ;
- separer services internes et reservations externes ;
- preparer une configuration par hotel ;
- ne pas casser la demo locale neutre.

PR technique future probable : `feat(guest): reorganize hotel services and request categories`.

### Phase 10B - Tags visibles des demandes

Complexite : faible si `type/details` suffisent, moyenne si un modele persistant est exige.

Objectifs :
- afficher un tag visible cote Reception ;
- permettre filtres simples ;
- preparer des statistiques Admin Hotel.

PR technique future probable : `feat(requests): show category tags in reception`.

### Phase 10C - Tri clients presents

Complexite : faible.

Objectifs :
- tri par chambre ;
- tri par nom ;
- tri par date de depart ;
- tri par activite recente si disponible.

PR technique future probable : `feat(reception): add guest sorting controls`.

### Phase 10D - Admin Hotel supervision demandes

Complexite : moyenne.

Objectifs :
- permettre au manager de voir les demandes ;
- suivre en attente, en cours, traite et urgent ;
- repondre au client si necessaire ;
- ne pas melanger avec Super Admin.

PR technique future probable : `feat(hotel-admin): add request supervision dashboard`.

### Phase 10E - Historique client et archivage apres depart

Complexite : moyenne a elevee.

Objectifs :
- distinguer clients presents et clients partis ;
- archiver selon date/statut de depart ;
- conserver l'historique complet ;
- verifier le besoin de migration/API avant implementation.

PR technique future probable : `feat(guests): separate active stays from guest history`.

## Garde-fous produit

- Ne pas coder de valeur specifique `demo-paris-local` dans les futurs flux produit.
- Toute logique future doit rester multi-hotel.
- Les tags et services doivent etre rattaches a l'hotel, a la demande ou a une configuration explicite.
- Ne pas afficher de donnees reelles dans les docs.
- Ne pas lancer migration, seed ou operation DB sans validation explicite.
- L'historique client est sensible et doit rester prudent cote RGPD.
