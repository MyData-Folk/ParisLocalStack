# DESIGN BACKLOG 2026

> Backlog executable derive de `docs/DESIGN_VISION_2026.md`.
> Direction artistique : Parisian Concierge Editorial.
> Critere principal de priorisation : valeur percue maximale pour effort minimal.

---

## P0 — Avant prochain rendez-vous hotelier

Actions qui augmentent immediatement la perception premium et la qualite de demo.

### P0-1. Landing page one-page

- **Description** : creer une page vitrine sur `welcomeparis.hotelmanager.fr` presentant la proposition de valeur, les 3 surfaces (Guest, Reception, Admin), un CTA de prise de RDV.
- **Impact commercial** : un prospect contacte n'a actuellement rien a consulter. La landing cree le premier point de confiance.
- **Effort** : 4-6h (une seule page React, pas de backend).
- **Risque** : nul (page statique, pas de logique metier).
- **Dependances** : aucune.
- **Gain percu** : +40% credibilite avant RDV.

### P0-2. Skeleton loaders Guest App + Hotel Admin

- **Description** : remplacer les textes "Chargement..." par des composants Skeleton (deja crees dans DESIGN-PASS-1A). Integrer dans GuestShell (chargement initial), HotelAdminDashboard (KPIs), et tables Reception.
- **Impact commercial** : elimine les moments "vides" pendant la demo. Perception de vitesse.
- **Effort** : 2-3h.
- **Risque** : nul (remplacement visuel uniquement).
- **Dependances** : composant Skeleton.tsx deja disponible.
- **Gain percu** : +20% perception qualite.

### P0-3. Microcopy concierge Guest App

- **Description** : remplacer les textes generiques par un ton concierge prive. Exemples : "Bienvenue" → "Bonjour [prenom]", "Services" → "A votre service", "Envoyer" → "Envoyer a la reception".
- **Impact commercial** : le ton fait 50% de la perception premium. Un hotelier remarque immediatement la qualite du texte.
- **Effort** : 1-2h (strings uniquement, pas de logique).
- **Risque** : nul.
- **Dependances** : aucune.
- **Gain percu** : +25% perception premium.

### P0-4. Contraste texte secondaire Reception

- **Description** : remplacer `text-zinc-500` et `text-slate-400` par `text-zinc-400` / `text-zinc-300` dans la sidebar et les labels Reception.
- **Impact commercial** : meilleure lisibilite en demo sur ecran externe / projecteur.
- **Effort** : 30min.
- **Risque** : nul.
- **Dependances** : aucune.
- **Gain percu** : +10% lisibilite.

### P0-5. PDF offre commerciale

- **Description** : creer un PDF 1-2 pages presentant l'offre Boutique, les avantages, et un CTA contact. Format A4, design premium.
- **Impact commercial** : support de closing apres la demo. Laisse une trace physique.
- **Effort** : 3h (design + redaction).
- **Risque** : nul.
- **Dependances** : aucune (document externe au code).
- **Gain percu** : +30% taux de closing.

---

## P1 — Demo commerciale

### Guest App

#### P1-G1. Onboarding en 2 etapes visuelles

- **Objectif** : transformer le formulaire unique en experience guidee (etape 1 : identite, etape 2 : sejour).
- **Difficulte** : moyenne.
- **Dependances** : aucune (meme API, meme flow, juste split visuel).
- **PR recommandee** : `design/guest-onboarding-steps`

#### P1-G2. Featured recommendation pleine largeur

- **Objectif** : la premiere recommandation "Coup de coeur" prend toute la largeur avec une grande image et un overlay editorial.
- **Difficulte** : faible.
- **Dependances** : aucune.
- **PR recommandee** : `design/guest-featured-recommendation`

#### P1-G3. Transitions entre sections

- **Objectif** : ajouter un fade-in 250ms lors du changement de section (home → services → guide → messages).
- **Difficulte** : faible.
- **Dependances** : aucune.
- **PR recommandee** : `design/guest-page-transitions`

#### P1-G4. Active:scale feedback mobile

- **Objectif** : ajouter `active:scale-[0.97]` sur tous les boutons et cards interactifs Guest App pour un feel iOS natif.
- **Difficulte** : tres faible.
- **Dependances** : aucune.
- **PR recommandee** : `design/guest-tactile-feedback`

#### P1-G5. Message d'accueil personnalise

- **Objectif** : apres onboarding, afficher "Bonjour [prenom], bienvenue a [hotel]" au lieu d'un texte generique.
- **Difficulte** : faible (la donnee existe deja dans la session).
- **Dependances** : P0-3 (microcopy).
- **PR recommandee** : `design/guest-personalized-greeting`

### Reception

#### P1-R1. Resume jour en haut du dashboard

- **Objectif** : afficher 3 KPI inline en haut de la page d'accueil Reception (messages ouverts, demandes urgentes, clients presents).
- **Difficulte** : faible (donnees deja chargees).
- **Dependances** : aucune.
- **PR recommandee** : `design/reception-day-summary`

#### P1-R2. Badge "nouveau" anime

- **Objectif** : ajouter une animation pulse-once (600ms) sur les badges de notification quand un nouvel element arrive.
- **Difficulte** : tres faible.
- **Dependances** : aucune.
- **PR recommandee** : `design/reception-animated-badge`

#### P1-R3. Skeleton loaders tables

- **Objectif** : remplacer "Chargement..." par des SkeletonTableRow dans les tables messages, demandes, clients.
- **Difficulte** : faible.
- **Dependances** : composant Skeleton.tsx existant.
- **PR recommandee** : `design/reception-skeleton-tables`

#### P1-R4. Templates reponses rapides

- **Objectif** : ajouter 5-8 reponses pre-configurees dans la messagerie (horaires petit-dejeuner, Wi-Fi, taxi, etc.). Selection rapide avant envoi.
- **Difficulte** : moyenne (nouveau composant, pas de changement API — les templates sont frontend-only).
- **Dependances** : aucune cote API.
- **PR recommandee** : `design/reception-quick-replies`

### Hotel Admin

#### P1-A1. Vocabulaire hotelier

- **Objectif** : remplacer "Modules & offre" → "Mon offre", "guestCards" → "Cartes d'accueil", "enabledServices" → "Services actifs", etc.
- **Difficulte** : faible (strings uniquement).
- **Dependances** : aucune.
- **PR recommandee** : `design/admin-hotelier-vocabulary`

#### P1-A2. Page "Mon hotel" fusionnee

- **Objectif** : fusionner Profil + Settings en une seule page avec onglets (Profil | Pratique | Theme).
- **Difficulte** : moyenne.
- **Dependances** : navigation 5 items deja en place.
- **PR recommandee** : `design/admin-hotel-page-tabs`

#### P1-A3. Barre de progression configuration

- **Objectif** : afficher "Configuration complete a X%" sur le dashboard avec les etapes manquantes.
- **Difficulte** : moyenne (calcul frontend basee sur les donnees existantes).
- **Dependances** : aucune cote API.
- **PR recommandee** : `design/admin-progress-bar`

---

## P2 — Version Beta hotels

### P2-1. Preview Guest App dans l'editeur

- **Objectif** : montrer un apercu mobile de ce que le client verra quand le directeur configure les cartes.
- **Difficulte** : elevee (rendu conditionnel dans un iframe ou composant isole).
- **Dependances** : P1-A2 (page fusionnee).
- **PR recommandee** : `design/admin-guest-preview`

### P2-2. Theme par hotel (couleur primaire visible dans la Guest App)

- **Objectif** : la couleur de l'hotel (`primaryColor`) influence visuellement les accents de la Guest App.
- **Difficulte** : moyenne.
- **Dependances** : systeme de theme existant.
- **PR recommandee** : `design/guest-hotel-color`

### P2-3. Analytics enrichis (graphiques)

- **Objectif** : ajouter des sparklines ou mini-graphiques dans la page Analytics (tendance 7 jours).
- **Difficulte** : moyenne (recharts deja installe).
- **Dependances** : API analytics existante (pas de nouvelle route).
- **PR recommandee** : `design/admin-analytics-charts`

### P2-4. Galerie photos hotel

- **Objectif** : utiliser les photos de la mediatheque dans le hero Guest App et les recommandations.
- **Difficulte** : faible (la mediatheque existe, juste branchement visuel).
- **Dependances** : storage existant.
- **PR recommandee** : `design/guest-hotel-photos`

### P2-5. Mode tablette Reception optimise

- **Objectif** : vue condensee des tables sur tablette (masquer colonnes secondaires, cards au lieu de lignes).
- **Difficulte** : moyenne.
- **Dependances** : aucune.
- **PR recommandee** : `design/reception-tablet-mode`

---

## P3 — Pre-production

### P3-1. Design system consolide

- **Objectif** : documenter tous les tokens, composants, patterns dans un Storybook ou fichier de reference.
- **Difficulte** : moyenne-elevee.
- **Dependances** : stabilite des composants.

### P3-2. Bibliotheque photos Paris

- **Objectif** : constituer une collection de photos Paris haute qualite pour les recommandations par defaut.
- **Difficulte** : faible (curation).
- **Dependances** : aucune.

### P3-3. Animations finales (spring physics)

- **Objectif** : remplacer les transitions CSS lineaires par des animations spring (type iOS).
- **Difficulte** : moyenne (framer-motion ou CSS spring()).
- **Dependances** : P1-G3.

### P3-4. Accessibilite WCAG AA

- **Objectif** : audit et correction de tous les problemes de contraste, focus, ARIA, keyboard nav.
- **Difficulte** : moyenne.
- **Dependances** : stabilite du design.

### P3-5. Responsive complet (320px → 1920px)

- **Objectif** : verification et correction de tous les breakpoints sur toutes les interfaces.
- **Difficulte** : moyenne.
- **Dependances** : aucune.

### P3-6. Favicon + logo SVG + Open Graph

- **Objectif** : identite visuelle dans les onglets navigateur et les previews de liens partages.
- **Difficulte** : faible.
- **Dependances** : direction artistique validee.

---

## MATRICE DE PRIORISATION

| Item | Impact | Effort | Risque | Priorite |
|------|--------|--------|--------|----------|
| P0-1 Landing page | 5/5 | 3/5 | Nul | **MUST** |
| P0-2 Skeleton loaders | 4/5 | 2/5 | Nul | **MUST** |
| P0-3 Microcopy concierge | 5/5 | 1/5 | Nul | **MUST** |
| P0-4 Contraste Reception | 2/5 | 1/5 | Nul | **MUST** |
| P0-5 PDF offre | 4/5 | 2/5 | Nul | **MUST** |
| P1-G1 Onboarding 2 etapes | 4/5 | 3/5 | Faible | **SHOULD** |
| P1-G2 Featured recommendation | 3/5 | 2/5 | Nul | **SHOULD** |
| P1-G3 Transitions sections | 3/5 | 1/5 | Nul | **SHOULD** |
| P1-G4 Active:scale | 2/5 | 1/5 | Nul | **SHOULD** |
| P1-G5 Greeting personnalise | 3/5 | 1/5 | Nul | **SHOULD** |
| P1-R1 Resume jour | 3/5 | 2/5 | Nul | **SHOULD** |
| P1-R2 Badge anime | 2/5 | 1/5 | Nul | **SHOULD** |
| P1-R3 Skeleton tables | 3/5 | 2/5 | Nul | **SHOULD** |
| P1-R4 Reponses rapides | 4/5 | 3/5 | Faible | **SHOULD** |
| P1-A1 Vocabulaire hotelier | 4/5 | 1/5 | Nul | **SHOULD** |
| P1-A2 Page Mon hotel | 3/5 | 3/5 | Faible | **COULD** |
| P1-A3 Progress bar | 3/5 | 3/5 | Nul | **COULD** |
| P2-1 Preview Guest | 4/5 | 4/5 | Moyen | **COULD** |
| P2-2 Theme couleur hotel | 3/5 | 3/5 | Faible | **COULD** |
| P2-3 Analytics graphiques | 2/5 | 3/5 | Nul | **LATER** |
| P2-4 Galerie photos | 3/5 | 2/5 | Nul | **COULD** |
| P2-5 Tablette Reception | 2/5 | 3/5 | Faible | **LATER** |
| P3-1 Design system | 2/5 | 4/5 | Nul | **LATER** |
| P3-2 Photos Paris | 2/5 | 2/5 | Nul | **LATER** |
| P3-3 Animations spring | 1/5 | 3/5 | Faible | **LATER** |
| P3-4 Accessibilite | 3/5 | 3/5 | Nul | **LATER** |
| P3-5 Responsive complet | 2/5 | 3/5 | Nul | **LATER** |
| P3-6 Favicon + OG | 2/5 | 1/5 | Nul | **SHOULD** |

---

## ROADMAP DESIGN — Sprints

### Sprint 1 (2 jours) — "Demo-Ready Premium"

| # | Action | Interface |
|---|--------|-----------|
| 1 | P0-3 Microcopy concierge | Guest App |
| 2 | P0-2 Skeleton loaders | Guest + Admin |
| 3 | P0-4 Contraste Reception | Reception |
| 4 | P1-G3 Transitions sections | Guest App |
| 5 | P1-G4 Active:scale feedback | Guest App |
| 6 | P1-A1 Vocabulaire hotelier | Hotel Admin |

**Bloquant** : rien. Tout est independant.
**Valeur** : la demo passe de "MVP fonctionnel" a "produit premium".

### Sprint 2 (3 jours) — "Experience Client"

| # | Action | Interface |
|---|--------|-----------|
| 1 | P1-G1 Onboarding 2 etapes | Guest App |
| 2 | P1-G5 Greeting personnalise | Guest App |
| 3 | P1-G2 Featured recommendation | Guest App |
| 4 | P1-R2 Badge anime | Reception |
| 5 | P1-R3 Skeleton tables | Reception |

**Bloquant** : P0-3 (microcopy) doit etre fait avant P1-G5.
**Valeur** : le client sent "c'est mon hotel, c'est personnel".

### Sprint 3 (3 jours) — "Operations Premium"

| # | Action | Interface |
|---|--------|-----------|
| 1 | P1-R1 Resume jour | Reception |
| 2 | P1-R4 Reponses rapides | Reception |
| 3 | P1-A2 Page Mon hotel | Hotel Admin |
| 4 | P1-A3 Progress bar | Hotel Admin |

**Bloquant** : P1-R4 est un nouveau composant (plus complexe).
**Valeur** : la reception gagne en productivite, l'admin guide le directeur.

### Sprint 4 (5 jours) — "Branding & Beta"

| # | Action | Interface |
|---|--------|-----------|
| 1 | P0-1 Landing page | Marketing |
| 2 | P0-5 PDF offre | Commercial |
| 3 | P2-4 Galerie photos | Guest App |
| 4 | P2-2 Theme couleur hotel | Guest App |
| 5 | P3-6 Favicon + OG | Global |

**Bloquant** : la landing page necessite du contenu redige et un design one-page.
**Valeur** : Paris Local existe comme marque, pas juste comme outil.

---

## TOP 10 — Valeur maximale pour effort minimal

| # | Action | Effort | Gain percu |
|---|--------|--------|------------|
| 1 | P0-3 Microcopy concierge | 1-2h | +25% premium |
| 2 | P0-4 Contraste Reception | 30min | +10% lisibilite |
| 3 | P1-G4 Active:scale feedback | 30min | +10% feel natif |
| 4 | P1-G3 Transitions sections | 1h | +15% fluidite |
| 5 | P1-A1 Vocabulaire hotelier | 1-2h | +20% confiance directeur |
| 6 | P0-2 Skeleton loaders | 2-3h | +20% perception vitesse |
| 7 | P1-G5 Greeting personnalise | 1h | +15% personnalisation |
| 8 | P1-R2 Badge anime | 30min | +10% demo vivante |
| 9 | P3-6 Favicon + OG | 1h | +10% credibilite |
| 10 | P1-G2 Featured recommendation | 2h | +15% style editorial |

**Total : environ 12h de travail pour +80% de perception globale.**

---

## REGLES D'EXECUTION

- Une PR par item (jamais de mega-PR multi-features).
- Typecheck + build obligatoires avant merge.
- Verification visuelle mobile 375px.
- Ne jamais modifier API, DB, Prisma, Auth, Routing backend.
- Ne jamais supprimer de fonctionnalite.
- Toute modification doit etre reversible.
- Reference visuelle : `docs/DESIGN_VISION_2026.md`.
