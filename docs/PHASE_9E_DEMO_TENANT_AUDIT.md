# PHASE_9E_DEMO_TENANT_AUDIT.md

## Objectif
Preparer et auditer un tenant demo neutre pour les demonstrations commerciales ParisLocalStack.

Le tenant demo doit permettre de presenter le produit sans exposer de donnees d'un hotel reel, clients reels, identifiants operationnels, logs, infrastructure ou details techniques sensibles.

## Principe
La demo doit raconter une histoire hotel credible avec des donnees entierement fictives.

Elle doit couvrir Guest App, Dashboard Reception, CRM, avis, demandes, recommandations et QR code.

## Perimetre d'audit
Verifier avant chaque rendez-vous :
- hotel demo actif.
- slug demo coherent.
- URL client accessible.
- URL reception accessible.
- QR code pointe vers l'URL client demo.
- onboarding client fonctionnel.
- messages client visibles reception.
- reponse reception visible client.
- demandes visibles reception.
- statuts modifiables.
- avis visibles reception.
- CRM demo sans donnees reelles.
- recommandations demo coherentes.

## Donnees interdites
Interdit dans le tenant demo : noms de vrais clients, emails personnels reels, numeros de telephone reels, reservations reelles, commentaires issus d'avis reels sans autorisation, captures contenant des informations internes.

## Checklist technique
- Le tenant demo est separe par hotel_id.
- Aucun compte hotel reel n'a acces au tenant demo.
- Les routes publiques ne retournent aucune donnee CRM.
- Les exports CRM demo ne contiennent que des donnees fictives.
- Les images et logos utilises sont libres ou generes pour la demo.
- Les recommandations demo sont fictives ou generiques.

## Checklist UX
- Parcours client lisible en mobile.
- Theme guest propre et premium.
- Textes demo comprehensibles sans explication technique.
- Reception sombre et professionnelle.
- Tableaux CRM propres.
- Etats vides evites pendant la demo.

## Points a verifier manuellement
- Creer un guest demo.
- Creer un sejour demo.
- Envoyer un message demo.
- Repondre depuis reception.
- Creer une demande taxi demo.
- Marquer la demande en cours puis traitee.
- Envoyer un avis positif.
- Envoyer un avis faible pour montrer l'alerte si pertinent.

## Risques
Confusion entre tenant demo et tenant reel, donnees fictives trop pauvres pour convaincre, QR code pointant vers le mauvais hotel, session navigateur conservant un contexte obsolete.

## Statut
A preparer avant demonstration commerciale.
