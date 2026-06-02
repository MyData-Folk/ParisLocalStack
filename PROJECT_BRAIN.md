# PROJECT_BRAIN.md - Source de verite ParisLocalStack

## 1. Vision produit
ParisLocalStack, aussi appele Paris Local / Digital Hotel Concierge, est une plateforme SaaS B2B multi-tenant pour hotels independants, boutique hotels, aparthotels et petits groupes hoteliers.

Le produit remplace une partie du livret d'accueil papier, du QR code statique et des demandes reception dispersees par une experience digitale unique : une application concierge client, un dashboard reception, un CRM operationnel et un outil d'onboarding hotel.

Le principe fondamental est simple : une seule plateforme technique, plusieurs hotels, separation stricte des donnees par hotel_id.

## 2. Objectifs business
- Permettre a un hotel d'activer rapidement une app concierge accessible par QR code.
- Donner a la reception un centre operationnel clair pour messages, demandes, avis et CRM.
- Donner au super admin une interface pour onboarder un nouvel hotel sans modifier le code.
- Commercialiser une offre SaaS stable, premium et simple a deployer.
- Prepararer une bibliotheque future de themes et templates hoteliers.

## 3. Proposition de valeur
- Installation sans application mobile native : le client scanne un QR code.
- Multi-tenant centralise : pas de nouvelle app React par hotel.
- Parcours client complet : onboarding, sejour, services, messages, avis.
- Reception plus efficace : messages, demandes, CRM, historique, fiche sejour.
- Personnalisation hotel : branding, couleurs, theme, recommandations locales, QR code.
- Exploitation commerciale : demos, packages, deploiement Coolify, monitoring et sauvegardes documentes.

## 4. Clientele cible
Priorite actuelle : hotels independants 3 etoiles, boutique hotels parisiens, petits hotels 4 etoiles independants, aparthotels et residences haut de gamme.

Clients secondaires futurs : petits groupes hoteliers, palaces et hotels 5 etoiles uniquement apres maturite produit plus elevee.

## 5. Packages commerciaux envisages
Le package de lancement recommande est Boutique.

Packages cibles : Starter, Boutique, Premium et Palace.

Starter couvre le QR concierge et les informations pratiques. Boutique couvre messagerie, demandes structurees, avis, CRM, recommandations et branding. Premium ajoute themes avances, analytics, exports et automatisations. Palace reste reserve aux integrations avancees et workflows concierge VIP futurs.

## 6. Etat actuel du projet
Etat connu au 2026-06-02 :
- Monorepo GitHub MyData-Folk/ParisLocalStack.
- Frontend React/Vite/Tailwind.
- Backend Express/Prisma/PostgreSQL.
- Deploiement Coolify en production.
- Multi-tenant par hotel_id et hotelSlug.
- Wildcard subdomains operationnels selon historique projet.
- Guest App premium fonctionnelle.
- Dashboard Reception fonctionnel.
- Super Admin fonctionnel.
- Generator hotel fonctionnel.
- Auth reelle JWT fonctionnelle.
- Socket.IO prepare et utilise pour la synchronisation temps reel.
- CRM reception prive avec clients presents, historique, fiche client/sejour et timeline.
- QR code hotel disponible dans les interfaces pertinentes.
- Documentation commerciale et technique deja commencee.

Niveau de maturite estime dans les documents existants : MVP fonctionnel environ 93 a 96%, production-ready environ 70%, commercial-ready environ 65%.

## 7. Roadmap synthetique
Termine : architecture multi-tenant, API commune, auth reelle, onboarding client, onboarding hotel, dashboard reception, Super Admin, Generator, CRM et exports, monitoring et sauvegardes documentes, strategie produit et demo commerciale documentees.

En cours : construire un tenant demo neutre sans donnees reelles, verifier le parcours demo complet avant rendez-vous commercial, consolider les workflows client reception backend, ameliorer progressivement la maintenabilite frontend.

Priorite suivante : demandes structurees plus riches, gestion avancee des recommandations par hotel, design system/templates Guest App, nettoyage des pages orphelines et types legacy.

## 8. Decisions majeures
- Une seule application web multi-tenant, jamais une app par hotel.
- Une seule base PostgreSQL centrale.
- Isolation obligatoire par hotel_id pour toutes les donnees privees.
- Resolution publique par hotelSlug.
- Reception recommandee : admin-{slug}.welcomeparis.hotelmanager.fr.
- Ancien format admin.{slug}.welcomeparis.hotelmanager.fr a conserver tant qu'il existe en production.
- Le domaine racine welcomeparis.hotelmanager.fr reste reserve a la plateforme, au Super Admin et aux surfaces centrales.
- Le dashboard reception conserve une identite sombre operationnelle.
- La Guest App doit etre premium, mobile-first et differenciee visuellement.
- Aucune donnee CRM privee ne doit etre exposee dans l'app publique.

## 9. Regles de travail
- Travailler par petites etapes.
- Ne pas refactoriser massivement sans validation.
- Ne pas modifier Prisma sans migration claire.
- Ne pas toucher a Coolify/DNS sans demande explicite.
- Toujours verifier le build avant production.
- Preserver le flux critique : client envoie, API sauvegarde, reception voit, reception repond, client voit.
- Les changements d'interface doivent rester modernes, premium, responsives et production-ready.
- Les secrets ne doivent jamais etre affiches dans la documentation.

## 10. Priorites en cours
- Stabiliser la documentation de contexte pour passation a d'autres agents.
- Preparer la phase demo neutre.
- Continuer a enrichir la Guest App et les workflows reception sans casser le MVP.
- Maintenir la securite multi-tenant comme priorite critique.

## 11. Prochaine etape recommandee
Construire et valider un tenant demo neutre, avec hotel fictif, clients fictifs, demandes fictives, recommandations fictives et scenario commercial complet. Cette etape doit permettre de faire une demonstration client sans exposer Vendome, Folkestone ou des donnees operationnelles reelles.
