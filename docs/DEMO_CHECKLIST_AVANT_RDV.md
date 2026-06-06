# DEMO_CHECKLIST_AVANT_RDV.md

## Objectif
Checklist commerciale avant demonstration ParisLocalStack.

## 1. Preparation generale
- Confirmer l'heure du rendez-vous.
- Confirmer le profil du prospect.
- Adapter le discours au type d'hotel.
- Preparer un navigateur propre.
- Fermer les onglets techniques non necessaires.
- Utiliser uniquement le tenant demo neutre.
- Confirmer l'environnement utilise : local, staging ou production.
- Ne pas interpreter une capture Playwright locale degradee comme etat production sans comparaison.

## 2. URLs a preparer
- Raccourcis locaux prets RDV :
  - Guest App locale : `http://localhost:5173/h/demo-paris-local/welcome`
  - Messages client locale : `http://localhost:5173/h/demo-paris-local/messages`
  - Reception demo locale : `http://localhost:5173/reception`
  - Admin Hotel demo locale : `http://localhost:5173/hotel-admin`
  - Super Admin local interne uniquement : `http://localhost:5173/admin`
  - API health locale : `http://localhost:4000/health`
  - API ready locale : `http://localhost:4000/ready`
  - Audit UI local : `npm run audit:ui`
- URL Guest App demo : https://demo-paris-local.welcomeparis.hotelmanager.fr
- URL Reception demo : https://admin-demo-paris-local.welcomeparis.hotelmanager.fr
- **URLs clone dedie (COOLIFY-DEMO-1, nettoye COOLIFY-DEMO-3, FQDNs canoniques ajoutes) :**
  - **URL officielle Guest : https://demo-paris-local.welcomeparis.hotelmanager.fr/** (slug deduit du hostname, contexte Guest)
  - **URL officielle Reception : https://admin-demo-paris-local.welcomeparis.hotelmanager.fr/** (slug deduit du hostname, contexte Reception)
  - **URL fallback path-based : https://demo.hotelmanager.fr/h/demo-paris-local/welcome** (slug dans le path, fonctionne toujours)
  - API (interne) : https://api-demo.hotelmanager.fr
  - Les sous-domaines `demo-vendome.welcomeparis.hotelmanager.fr` et `demo-admin.vendome.welcomeparis.hotelmanager.fr` ont ete retires du Web clone (COOLIFY-DEMO-3) car ils ne correspondaient pas au slug seede et provoquaient des 404.
- URL Super Admin uniquement si necessaire.
- QR code demo.

Statut au 2026-06-02 : ces URLs publiques repondent, mais ne sont pas validees pour RDV. La Guest App publique affiche `Hotel not found`; l'URL Reception/Admin publique affiche un login generique. La demo prete RDV est locale uniquement tant que l'environnement public/staging n'est pas clarifie.

Statut au 2026-06-06 (COOLIFY-DEMO-1 + COOLIFY-DEMO-2) : le clone dedie `paris-local-demo` est operationnel, isole de la prod, et seede avec l'hotel `demo-paris-local` (Hôtel Lumière Demo Paris, 100% fictif). La Guest App publique du clone sert l'hotel demo. URLs pretes pour demo tablette en ligne. Voir `docs/COOLIFY_DEMO_ISOLATION.md` pour la preuve d'isolation et la procedure de re-seed.

Tenant attendu : demo-paris-local.

Hotel attendu : Hôtel Lumière Demo Paris.

Comptes demo a utiliser sans jamais afficher le mot de passe :
- Reception : `reception@demo-paris-local.test`
- Admin Hotel / Manager : `manager@demo-paris-local.test`
- Super Admin interne : `admin@paris-local.test`

Ne pas afficher : depot GitHub, terminal, Coolify, configuration infrastructure, fichiers d'environnement, logs techniques.

## 3. Verification Guest App
- Page d'accueil charge correctement.
- Branding hotel demo visible.
- Le nom Hôtel Lumière Demo Paris est visible dans les surfaces demo.
- Aucun contenu Vendome n'apparait dans le parcours client.
- Onboarding client fonctionne.
- WiFi et horaires visibles.
- Services visibles.
- Messages fonctionnels.
- Avis fonctionnels.
- Recommandations visibles.
- Mobile responsive correct.

## 4. Verification Reception
- Connexion reception demo OK.
- Le contexte reception correspond a `demo-paris-local`.
- Dashboard lisible.
- Inbox affiche les conversations demo.
- Requests affiche demandes demo.
- Clients presents affiche les sejours actifs.
- Historique CRM affiche anciens sejours demo.
- Fiche client/sejour ouverte depuis plusieurs entrees.
- Avis visibles et exploitables.
- QR code disponible.

## 4 bis. Validation locale post-login
Statut local valide au 2026-06-02 :
- Guest App locale `demo-paris-local` OK.
- Reception demo : login OK, dashboard visible.
- Admin Hotel demo : login OK, espace hotel visible.
- Super Admin local `/admin/users` : login OK, page utilisateurs accessible.
- Hôtel Lumière Demo Paris visible dans les surfaces demo.
- Vendome absent des ecrans demo Reception et Admin Hotel.

Super Admin est interne uniquement et ne doit pas etre montre en demo client. Vendome peut y etre present localement car le seed principal a ete execute, mais cette surface sert seulement a l'administration et au reset local.

Ne jamais ecrire de mot de passe, hash ou secret dans Git.

## 4 ter. Cartes Guest App / Hotel Admin
Etat Vague 5 :
- PR #81 : modele `guestCards` + `commercialPackage` integre.
- PR #82 : API plan commercial integree.
- PR #84 : Super Admin modifie le forfait ; Hotel Admin le voit en lecture seule.
- PR #85 : API privee guest-cards integree.
- PR #86 : Hotel Admin peut editer les cartes Guest App.

Vague 5F finalisee (PR #87, #88, #89) :
- L'API publique settings expose `guestCards` actifs, tries par `slot` puis `slotIndex`, tronques par les limites du forfait.
- Les composants `GuestHeroCard` et `GuestShortcutCard` sont isoles et gerent le rendu, les actions (`none` / `section` / `service_request` / `external_url`) et la securite des liens externes (`target="_blank"`, `rel="noopener noreferrer"`, validation stricte `http`/`https`).
- `GuestShell` est branche avec un hook `useGuestCards(settings)` et un fallback legacy strict : si `guestCards` est absent, vide, invalide ou totalement desactive, le rendu historique (StayCard + actions rapides hardcodees + Guide local) est preserve tel quel.

Dans Admin Hotel, les champs configurables sont : image, titre, description, action, cible, ordre et actif/inactif. Super Admin reste maitre du forfait ; Hotel Admin reste limite par son forfait.

Demo : la personnalisation configuree dans Admin Hotel est visible cote Guest App si au moins une carte `enabled === true` est sauvegardee. Si la liste est vide, le rendu legacy reste visible. Ne pas promettre de comportement different en staging/production sans validation prealable.

Voir `docs/GUEST_CARDS_DISPLAY.md` pour le detail (sources de verite, fallback, actions, securite).

Validation locale 5F : audit UI 6/6 (Playwright), typecheck/build OK, health/ready OK, aucun secret expose. Staging et production non encore valides.

## 4 quater. Services dynamiques Guest App / Hotel Admin
Etat Vague 6 :
- PR #91 : types/schemas services configurables integres.
- PR #92 : stockage `enabledServices` et API privee services integres.
- PR #93 : Super Admin attribue les services autorises par hotel.
- PR #94 : Hotel Admin personnalise les services autorises.
- PR #95 : API publique settings expose les services actifs et les limites safe.
- PR #96 : hook `useEnabledServices` integre.
- PR #97 : Guest App affiche les services dynamiques avec fallback legacy.

Ce qui est validable en demo locale :
- Super Admin voit la section Services autorises.
- Hotel Admin voit la section Services de l'hotel et personnalise les services autorises par son forfait.
- Guest App affiche uniquement les services actifs/visibles de l'hotel.
- Taxi et Room service dynamiques ouvrent les formulaires existants.
- Blanchisserie / Pressing restent relies au parcours linge existant si actives.
- Un service desactive ou non visible n'apparait pas.
- Si aucun service dynamique exploitable n'est actif, le rendu legacy reste visible.

Validation locale 6F : health/ready/web OK, fallback legacy OK, Taxi dynamique OK, Room service dynamique OK, service desactive masque, mobile 375px OK, audit UI 6/6, typecheck/build OK, aucun secret expose. Staging et production non encore valides.

## 5. Scenario a jouer
- Scanner ou ouvrir QR demo.
- Creer un client demo.
- Montrer la creation du sejour.
- Envoyer une demande.
- Montrer apparition reception.
- Changer statut demande.
- Repondre au client.
- Montrer reponse cote client.
- Montrer fiche client et CRM.
- Conclure par valeur business.

## 6. Points de discours
- Pas d'installation native pour le client.
- QR code simple.
- Reception centralisee.
- Donnees clients mieux structurees.
- Multi-tenant stable.
- Personnalisation hotel.
- Deploiement rapide.

## 7. A ne pas dire / montrer
- Ne pas promettre PMS Opera/Mews si non integre.
- Ne pas promettre paiement integre si non disponible.
- Ne pas promettre AI avancee immediate.
- Ne pas promettre application native.
- Ne pas montrer donnees reelles.
- Ne pas utiliser Vendome comme support principal de demo client.
- Ne pas montrer details de securite sensibles.

## 8. Plan B demo
Si la production est indisponible : utiliser captures preparees, video courte du flux ou documentation produit. Eviter d'improviser sur l'infrastructure.

Note : les captures reelles observees sur captures partagees le 2026-06-02 montrent des interfaces Reception, Guest App Vendome et Super Admin plus avancees que les premieres captures Playwright locales. Elles restent un support de contexte, pas une validation exhaustive du tenant neutre.

Garde-fous staging : ne jamais lancer seed hors local sans confirmation d'une DB staging dediee ; ne jamais lancer migration ou deploy sur un environnement non identifie ; proteger les comptes demo si un domaine public est utilise ; confirmer un rollback staging avant seed ; ne jamais utiliser production comme staging.

Avant d'utiliser une URL publique en rendez-vous, appliquer la checklist `Validation staging controle avant seed hors local` dans `DEPLOIEMENT.md`. Si la checklist n'est pas complete, utiliser la demo locale validee ou un support prepare.

## 9. Apres rendez-vous
- Noter objections.
- Noter modules demandes.
- Classer prospect par package probable.
- Mettre a jour roadmap si nouvelle demande recurrente.
- Ne pas ajouter de fonctionnalite sans validation produit.
