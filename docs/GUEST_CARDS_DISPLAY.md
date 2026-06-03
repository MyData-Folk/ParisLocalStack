# Guest Cards Display (Vague 5F)

Statut : Vague 5F finalisee et validee en local (PR #87, #88, #89 mergees dans `main`). Staging et production non encore valides.

## Ce que fait la Guest App

La Guest App lit maintenant les cartes configurees depuis la reponse
publique `GET /api/public/:hotelSlug/settings`. Si la liste est
vide ou invalide, le rendu historique est conserve tel quel
(retrocompatibilite stricte).

## Sources de verite

* Super Admin : pilote le forfait (`commercialPackage`)
  via `PATCH /api/hotels/:id/plan`.
* Hotel Admin : edite les cartes via
  `PATCH /api/hotels/:id/guest-cards`.
* API publique : expose uniquement les cartes
  `enabled === true`, triees par `slot` puis `slotIndex`,
  tronquees par les limites du forfait.
* Guest App : consomme la reponse via le hook
  `useGuestCards(settings)` puis dispatche :
  - `slot: "hero"` -> composant `GuestHeroCard`
  - `slot: "shortcut"` -> composant `GuestShortcutCard`

## Fallback

Le rendu actuel (StayCard Wi-Fi / petit-dejeuner / check-out /
reception, Actions rapides hardcodees, Guide local, Suivi
reception) est preserve si :

* `guestCards` est absent du payload
* `guestCards` est un tableau vide
* toutes les cartes sont `enabled === false`
* le payload est invalide

Aucun skeleton ni ecran d'erreur : le client final voit le meme
ecran qu'avant la Vague 5F.

## Actions

| `actionType`      | Rendu                                            |
| ----------------- | ------------------------------------------------ |
| `none`            | carte non cliquable, CTA masque                  |
| `section`         | navigation interne via `useNavigate`            |
| `service_request` | ouverture du `ServiceRequestSheet` si template trouve |
| `external_url`    | `<a target="_blank" rel="noopener noreferrer">`  |

Les liens externes ne s'ouvrent que si le plan autorise
`allowExternalLinks === true` (defaut securise `false`).

## Securite publique

* `wifiPassword` et `whatsappNumber` ne sont jamais exposes.
* Les cartes exposees n'incluent que les champs metier
  (id, slot, slotIndex, kind, title, description, imageUrl,
  icon, actionLabel, actionType, actionTarget, enabled, locked).
* Aucune donnee CRM privee, aucun mot de passe, aucun token.

## Validation

* `npm run typecheck --workspaces --if-present`
* `npm run build --workspaces --if-present`
* `npm run audit:ui` (avec dev server local actif)
* `git diff --check`

## Validation finale 5F (2026-06-03)

* Audit UI Playwright : 6/6 OK (desktop + mobile sur guest-demo, reception, hotel-admin)
* `npm run typecheck --workspaces --if-present` OK
* `npm run build --workspaces --if-present` OK
* `git diff --check` OK
* `GET http://localhost:4000/health` -> `{"status":"ok"}`
* `GET http://localhost:4000/ready` -> `{"status":"ready","database":"ok"}`
* `GET http://localhost:5173` -> 200
* Aucun secret, mot de passe, token, hash ou valeur d'environnement expose
* Staging et production non encore valides (action hors locale bloquee tant que la checklist `DEPLOIEMENT.md` n'est pas completee)

## Risques residuels apres 5F

* Aucune URL de cartes n'est crawlee ou auditee automatiquement a ce stade. Les images casseees tombent sur le fallback icone mais aucun rapport de sante n'est expose cote staff.
* La migration des hotels existants du rendu hardcode vers le rendu dynamique n'est pas faite : les cartes "Actions rapides" et "Guide local" actuelles restent affichees tant qu'aucune carte `enabled === true` n'est sauvegardee.
* Le seed Vendome n'a pas ete enrichi en 5G : la couche seed est une phase distincte non couverte par 5F.
