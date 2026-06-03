# Runbook Demo Commerciale - ParisLocalStack

## 1. Objectif

Demo B2B hoteliere de 10 a 15 minutes.

Narration recommandee :

Guest App -> Reception live -> Admin Hotel -> CRM / RGPD / reservation directe.

Objectif :

- montrer la valeur metier ;
- ne pas exposer la stack technique ;
- ne pas montrer Super Admin, Generator, Coolify, Prisma, R2, GitHub, logs ou variables d'environnement.

Public cible :

- directeur hotelier ;
- gerant ;
- responsable reception ;
- revenue / CRM manager ;
- responsable experience client.

## 2. Environnement de demo

Surfaces recommandees :

- Local pret RDV :
  - Guest App : `http://localhost:5173/h/demo-paris-local/welcome`
  - Messages client : `http://localhost:5173/h/demo-paris-local/messages`
  - Reception : `http://localhost:5173/reception`
  - Admin Hotel : `http://localhost:5173/hotel-admin`
  - Super Admin : `http://localhost:5173/admin`, interne uniquement.
  - API health : `http://localhost:4000/health`
  - API ready : `http://localhost:4000/ready`
- Guest App demo : https://demo-paris-local.welcomeparis.hotelmanager.fr
- Reception / Admin Hotel demo : https://admin-demo-paris-local.welcomeparis.hotelmanager.fr ou route equivalente documentee

Statut public au 2026-06-02 : ces URLs ne sont pas encore validees pour une demonstration client. La Guest App publique repond HTTP 200 mais affiche `Hotel not found`; la Reception/Admin publique repond HTTP 200 avec login generique. La demonstration prete RDV est locale uniquement tant que l'environnement public/staging n'est pas clarifie.

Tenant demo valide :

- Tenant : demo-paris-local ;
- Hotel : Hôtel Lumière Demo Paris ;
- donnees : 100 % fictives.

Donnees :

- utiliser uniquement des donnees fictives pour la demo commerciale ;
- ne jamais afficher de donnees personnelles reelles ;
- ne pas utiliser Vendome comme support de demo client, sauf mention historique ou monitoring hors ecran client ;
- les acces de demonstration doivent etre prepares hors Git, dans un canal securise.
- comptes demo attendus : `reception@demo-paris-local.test`, `manager@demo-paris-local.test`, `admin@paris-local.test` pour Super Admin interne uniquement ; ne jamais ecrire le mot de passe dans Git.

Garde-fous staging :

- ne jamais lancer le seed demo hors local sans confirmation d'une DB staging dediee ;
- ne jamais lancer migration, deploy, reset ou db push sur un environnement non identifie ;
- proteger les comptes demo si un domaine public est utilise ;
- confirmer un rollback staging avant seed ;
- ne jamais utiliser production comme staging.

Ne pas committer :

- identifiants ;
- emails de connexion ;
- mots de passe ;
- tokens ;
- URLs privees de monitoring ;
- variables d'environnement.

## 3. Routes autorisees en demo client

- `/h/:hotelSlug/*` - Guest App.
- `/reception/*` - Reception.
- `/hotel-admin/*` - Admin Hotel.

## 4. Routes interdites en demo client

- `/admin/*` - Super Admin plateforme, vocabulaire interne et technique.
- `/generator/*` - onboarding interne.
- `/admin/deployments` - infrastructure interne.
- `/admin/integrations` - infrastructure interne.
- Pages de logs, monitoring, backups, GitHub, Coolify, Prisma, R2 - outils techniques non destines au client hotelier.

## 5. Script demo 10-15 minutes

### Etape 1 - Introduction probleme hotelier, 1 a 2 min

Expliquer :

- les clients OTA arrivent souvent sans relation directe ;
- les memes questions reviennent souvent : Wi-Fi, petit-dejeuner, check-in, check-out, restaurants, transports ;
- la reception perd du temps ;
- le CRM reste incomplet ;
- les demandes client sont dispersees.

### Etape 2 - Guest App, 3 min

- Ouvrir la Guest App.
- Montrer l'acces QR ou sous-domaine.
- Montrer onboarding client : nom, langue, consentement.
- Montrer guide local : recommandations, services hotel, infos pratiques.
- Envoyer un message ou une demande de service.
- Expliquer que le client n'a pas besoin de telecharger une application.

### Etape 3 - Reception live, 5 min

- Montrer dashboard reception.
- Montrer messages ou demandes recues.
- Montrer clients presents.
- Montrer fiche client : sejour, historique, consentement.
- Montrer avis ou satisfaction.
- Insister sur le gain de temps reception.

### Etape 4 - Admin Hotel, 4 min

- Montrer QR code hotel.
- Montrer recommandations locales.
- Montrer modules & offre.
- Montrer si utile l'editeur interne des cartes Guest App, uniquement comme capacite de configuration en preparation.
- Montrer analytics.
- Montrer CRM : filtres segmentation, export Excel/JSON.
- Insister sur RGPD, consentement et CRM propre.

Note Vague 5 : l'editeur Hotel Admin des cartes Guest App permet de sauvegarder image, titre, description, action, cible, ordre et actif/inactif selon le forfait. Super Admin reste maitre du forfait. Les cartes sauvegardees ne sont pas encore visibles cote Guest App avant la Vague 5F ; ne pas les presenter comme deja affichees au client.

### Etape 5 - Closing, 2 min

Conclure sur :

- CRM enrichi ;
- communication directe ;
- reduction dependance OTA ;
- experience client moderne ;
- outil simple pour petits hotels ;
- possibilite de personnalisation progressive.

Mentionner l'infrastructure seulement en termes rassurants :

- sauvegardes quotidiennes ;
- monitoring ;
- HTTPS ;
- sans ouvrir les outils techniques.

## 6. Script oral court, 2 minutes

"Aujourd'hui, beaucoup d'hotels accueillent des clients venus des plateformes de reservation, mais gardent peu de lien direct avec eux. La reception repond souvent aux memes questions, les demandes arrivent par plusieurs canaux, et les informations utiles pour le CRM sont rarement bien consolidees.

Paris Local donne a chaque hotel une application client simple, accessible par QR code, sans telechargement. Le client retrouve les informations pratiques, les recommandations locales, les services de l'hotel, la messagerie et les avis. Cote reception, tout arrive dans un tableau de bord clair : messages, demandes, clients presents, historique et satisfaction.

Pour l'hotel, la valeur est double : l'equipe gagne du temps au quotidien, et la relation client devient plus directe. Les contacts et consentements peuvent etre mieux qualifies pour nourrir le CRM, preparer des campagnes propres et encourager la reservation directe. La mise en place reste progressive : on commence avec un QR code, quelques informations hotelieres, des recommandations locales, puis on enrichit selon les besoins."

## 7. Objections frequentes et reponses recommandees

**Est-ce complique a installer ?**  
Non. La mise en place peut commencer simplement avec un lien, un QR code et les informations principales de l'hotel.

**Est-ce RGPD ?**  
La demo met en avant le consentement client, la minimisation des donnees et l'usage prudent des exports CRM.

**Est-ce que mes receptionnistes devront apprendre un nouvel outil ?**  
L'interface est pensee comme un tableau de bord reception : messages, demandes, clients presents et actions simples.

**Est-ce que je peux personnaliser les recommandations ?**  
Oui. Les recommandations locales peuvent etre adaptees aux adresses, partenaires et experiences conseillees par l'hotel.

**Est-ce que je peux recuperer les emails clients ?**  
Oui, lorsque le client les renseigne et selon le consentement applicable. L'objectif est de constituer une base CRM propre.

**Est-ce que ca marche avec les clients OTA ?**  
Oui. Le QR code ou le lien peut etre presente a l'arrivee, dans la chambre ou dans les communications de sejour.

**Est-ce que le client doit telecharger une app ?**  
Non. L'experience s'ouvre dans le navigateur, depuis un QR code ou un lien.

**Est-ce que je peux imprimer un QR code ?**  
Oui. Le QR code hotel peut etre affiche a la reception, dans les chambres ou dans les supports de bienvenue.

**Est-ce que les donnees sont sauvegardees ?**  
Oui, l'environnement projet prevoit des sauvegardes quotidiennes et une surveillance externe, sans ouvrir ces outils pendant la demo client.

**Est-ce compatible avec un petit hotel independant ?**  
Oui. La proposition vise justement les hotels qui veulent une experience digitale claire sans projet technique lourd.

**Combien de temps faut-il pour demarrer ?**  
Une premiere demo peut etre preparee rapidement. Le demarrage commercial doit ensuite etre cadre avec les contenus, les acces et les donnees de l'hotel.

## 8. Checklist avant demo

- [ ] Guest App demo `demo-paris-local` accessible et responsive.
- [ ] Reception demo accessible.
- [ ] Admin Hotel demo accessible.
- [ ] Environnement confirme : local ou staging dedie et protege.
- [ ] Si URLs publiques : aucun `Hotel not found`, tenant `demo-paris-local` visible, Hôtel Lumière Demo Paris visible.
- [ ] Donnees 100 % fictives presentes.
- [ ] Aucun contenu Vendome affiche dans le parcours client.
- [ ] Messages / demandes / sejours actifs prets pour la demo.
- [ ] Better Stack monitors UP.
- [ ] Healthchecks backup OK.
- [ ] Aucun onglet Super Admin ouvert.
- [ ] Aucun onglet Generator ouvert.
- [ ] Aucun onglet GitHub / Coolify / R2 / Prisma ouvert.
- [ ] Aucun secret visible.
- [ ] Si l'editeur cartes Guest App est montre, preciser que l'affichage client arrive en Vague 5F.
- [ ] Notifications desktop activees si demonstration live.
- [ ] QR code pret si besoin.
- [ ] Scenario client simple prepare.

## 9. Incidents frequents pendant la demo

- Guest App inaccessible : basculer sur captures ou environnement de secours.
- Reception non connectee : verifier l'acces hors ecran client.
- Donnees vides : ne pas improviser ; utiliser un scenario prepare ou reporter la demonstration fonctionnelle.
- Socket.IO ou live lag : rafraichir la page reception.
- Erreur acces hotel : verifier le lien hors ecran client.
- Monitoring ou backup : ne pas ouvrir les outils techniques en demo client.

## 10. Ce qu'il ne faut jamais montrer

- Super Admin.
- Generator.
- Coolify.
- Prisma.
- R2 / S3.
- GitHub.
- Terminal.
- Logs.
- Variables d'environnement.
- Credentials.
- Donnees personnelles reelles non validees.
- Ecrans d'erreur techniques.
- Code source.

## 11. Demo client vs demo interne

### Demo client hotelier

Objectif : valeur metier.  
Montrer : Guest App, Reception, Admin Hotel.  
Eviter : technique.

### Demo investisseur / partenaire technique

Objectif : robustesse et architecture.  
Montrer eventuellement : monitoring, backup, architecture, sans secrets.

### Demo interne fondateur

Objectif : pilotage plateforme.  
Super Admin et Generator peuvent etre montres uniquement en interne.

## 12. Preparation future

Prochaines ameliorations possibles :

- creer un hotel demo neutre ;
- preparer des donnees fictives propres ;
- preparer un QR code imprimable ;
- preparer une page vitrine claire ;
- preparer une offre commerciale ;
- preparer la Phase 10 Design System / Templates.
- Vague 5F : brancher la Guest App sur les cartes sauvegardees apres validation de l'exposition publique.

Voir aussi : `docs/PRODUCT_STRATEGY.md` pour le cadrage produit, les packages et la roadmap.
