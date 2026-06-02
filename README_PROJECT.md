# Paris Local / Digital Hotel Concierge — Brief projet

## Statut actuel
Prototype frontend SaaS React/TypeScript/Vite/Tailwind déjà structuré avec plusieurs pages : Admin/Dashboard, Generator, Guest App, Inbox, Guests, Analytics, Settings, etc.

Ce dépôt doit maintenant devenir une base SaaS de production auto-hébergée sur Coolify.

## Objectif produit
Créer une plateforme SaaS B2B pour hôtels indépendants et boutique hôtels permettant de générer et exploiter :

1. une application client accessible par QR code ;
2. un dashboard réception connecté à l’application client ;
3. une collecte CRM client ;
4. une messagerie client ↔ réception ;
5. un système d’avis/satisfaction ;
6. des recommandations locales ;
7. une configuration personnalisée par hôtel ;
8. une architecture multi-tenant sécurisée par `hotel_id`.

## Architecture cible
Architecture auto-hébergée :

- Frontend React sur Coolify
- Backend API Node.js/TypeScript sur Coolify
- PostgreSQL sur Coolify
- Storage local ou S3 compatible
- Docker / Docker Compose
- Une seule base PostgreSQL centrale
- Isolation des données par `hotel_id`

## Outils à séparer

### 1. Admin principal
Utilisé par le propriétaire de la plateforme pour gérer les hôtels, utilisateurs, templates, déploiements, abonnements et paramètres globaux.

### 2. Générateur
Utilisé en interne pour créer/configurer un hôtel : branding, contenus, services, recommandations, preview, QR code, configuration et préparation déploiement.

### 3. App client hôtel
Accessible via QR code et/ou sous-domaine hôtel. Elle permet au client de consulter le guide hôtel, envoyer des demandes, contacter la réception, laisser un avis et partager ses informations CRM.

### 4. Dashboard réception
Utilisé par l’hôtel pour gérer les messages, demandes, avis, alertes, clients et statistiques.

### 5. Backend API
API commune à tous les hôtels, connectée à PostgreSQL et au storage.

## Domaine / multi-tenant
Le système doit supporter des sous-domaines par hôtel :

- App client : `{hotelSlug}.welcomeparis.hotelmanager.fr`
- Dashboard réception : `admin-{hotelSlug}.welcomeparis.hotelmanager.fr`
- Exemple demo neutre : `demo-paris-local.welcomeparis.hotelmanager.fr` et `admin-demo-paris-local.welcomeparis.hotelmanager.fr`, a valider separement avant usage public.

Le frontend doit détecter le `hotelSlug` depuis le hostname. Ne pas créer une application par hôtel. Utiliser une seule application multi-tenant.

## À ne pas faire
- Ne pas recréer un énorme `App.tsx` monolithique.
- Ne pas utiliser `localStorage` comme base principale.
- Ne pas créer une base de données par hôtel.
- Ne pas mélanger admin, générateur, app client et réception dans une logique confuse.
- Ne pas supprimer les éléments UI utiles sans raison.

## Priorité MVP
1. Backend API Node.js/TypeScript.
2. PostgreSQL multi-tenant.
3. Auth JWT et rôles.
4. App client QR code.
5. Onboarding client → guest + stay.
6. Message/demande client.
7. Dashboard réception qui reçoit et répond.
8. Avis/satisfaction avec alerte mauvaise note.
9. Storage local puis compatibilité S3.
10. Docker/Coolify prêt au déploiement.
