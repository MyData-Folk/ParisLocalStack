# Design Vision 2026 — Paris Local

> Direction artistique et strategie design pour la plateforme Paris Local.
> Document de reference avant toute nouvelle passe de developpement visuel.

## 1. Positionnement

Paris Local n'est pas un outil.
Paris Local est un concierge prive numerique.

L'identite doit dire :
- "Votre hotel a un service premium" (pour le client)
- "Vous avez un outil moderne et elegant" (pour le directeur)
- "C'est simple et efficace" (pour la reception)

Signature : "Le luxe discret de la simplicite."

## 2. Nom du style

**Parisian Concierge Editorial**

Inspire par : le hall d'un boutique hotel parisien le matin — lumiere naturelle, materiaux nobles, magazine ouvert sur la table, silence et attention.

## 3. Audit design actuel

| Interface | Score | Perception |
|-----------|-------|------------|
| Guest App | 7/10 | "Application utile, bien faite" — pas encore "Wow, mon hotel a un service premium" |
| Reception | 8/10 | "Outil fonctionnel et professionnel" — pas encore "j'adore l'utiliser" |
| Hotel Admin | 6.5/10 | "Je comprends" — pas encore "c'est fait pour moi" |
| Super Admin | 5/10 | Acceptable pour usage interne uniquement |

### Problemes transverses identifies

- Image hero identique pour tous les hotels (stock generique)
- Pas de signature visuelle unique differenciante
- Manque de micro-interactions (sentiment de qualite)
- Uniformite des sections (meme rythme, meme poids visuel)
- Vocabulaire parfois technique au lieu d'hotelier
- Pas de progression visible pour le directeur
- Pas de gratification pour la reception

## 4. Benchmark

### Ce qui inspire

| Source | Lecon pour Paris Local |
|--------|----------------------|
| Airbnb Guest | Photos immersives full-width, emotion avant information |
| Airbnb Host | Dashboard = KPI + actions, pas de bruit |
| Apple Wallet | Blanc dominant + accents minimalistes, luxe discret |
| Stripe Dashboard | Hierarchie blanche ultra claire, scanne en 2 secondes |
| Notion / Linear | Navigation minimale, pas de paralysie du choix |
| CitizenM / Zoku | Identite forte (couleur + typo + ton), simplicite radicale |

### Concurrents hoteliers (LoungeUp, Bowo, Hotelbird)

- QR → app concept valide par le marche
- UI souvent datee (2018-2020 feel)
- Trop de couleurs customisees, incoherent
- Parfois surcharge (trop de features visibles)

Paris Local doit etre plus elegant, plus simple, et plus moderne que ces concurrents.

## 5. Direction artistique

### 5.1 Palette — Guest App (mode clair)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#1a1613` | Titres, CTA principaux |
| Secondary | `#4a3f37` | Texte courant |
| Muted | `#8c7e73` | Labels, metadata |
| Background | `#fdfaf6` | Fond principal |
| Surface | `#f5f1ec` | Cards subtiles |
| Accent | `#b8973a` | Or mat — accents, eyebrows, highlights |
| Accent soft | `#b8973a15` | Backgrounds accent |
| Success | `#2d7a4f` | Confirmations |
| Alert | `#c44d3e` | Urgences |
| Info | `#3b6fa0` | Informations |

### 5.2 Palette — Admin / Reception (mode sombre)

| Token | Hex | Usage |
|-------|-----|-------|
| Base | `#09090b` | Fond principal |
| Card | `#111115` | Cards |
| Elevated | `#18181b` | Panels |
| Border | `rgba(255,255,255,0.06)` | Separations |
| Text | `#f4f4f5` | Titres |
| Secondary | `#a1a1aa` | Descriptions |

Principe : pas de couleur vive en grand. Les accents sont petits (badges, icones, eyebrows). Le reste est neutre et elegant.

### 5.3 Typographie

| Usage | Font | Poids | Tracking |
|-------|------|-------|----------|
| Titres Guest App | Playfair Display | 700 | -0.02em |
| Tout le reste | Inter | 400-700 | Normal a -0.01em |
| Chiffres / KPI | Inter tabular-nums | 700 | 0 |
| Labels uppercase | Inter | 600-700 | 0.08em |

Principe : serif uniquement pour les grands titres Guest App (h1, h2). Jamais sur les labels, cards, nav ou buttons. Le serif dit "editorial" ; le sans dit "efficace".

### 5.4 Style d'icones

- Lucide React, stroke 1.5px
- 16-20px max dans les interfaces
- Jamais d'icones remplies (pas de fill)
- Couleur muted par defaut, accent sur active
- Pas d'icones decoratives inutiles

### 5.5 Style de cartes

**Guest App (clair)** :
- Pas de bordure visible (`ring-1 ring-black/4%` uniquement)
- Shadow douce : `shadow-sm shadow-black/5`
- Radius : 12px (rounded-xl)
- Padding : 16-20px
- Hover : translateY(-1px) + shadow augmentee

**Admin / Reception (sombre)** :
- Border subtile : border-white/6%
- Shadow : shadow-black/20
- Radius : 12px
- Fond : #111115
- Hover : bg-white/3%

Principe : les cards ne sont jamais "dans une boite". Elles flottent legerement au-dessus du fond.

### 5.6 Style de navigation

**Guest App** :
- Bottom bar ultra fine (hauteur 52px max)
- 5 items avec icones 16px + label 10px
- Active = pill dark/white
- Fond glassmorphism leger

**Admin / Reception** :
- Sidebar fixe 240-260px
- Items avec icone + label (pas de groupe visible)
- Active = highlight accent avec pill
- Pas plus de 5-7 items

Principe : la navigation est invisible quand on n'en a pas besoin.

### 5.7 Style de photos

- Hero Guest App : photo immersive de l'hotel reel (pas de stock)
- Recommandations : photos locales reelles (ou Unsplash premium Paris cible)
- Ratio : 16:9 ou 4:3, jamais carre
- Traitement : leger overlay gradient (du bas vers le haut)
- Fallback : icone dans un tile couleur accent (pas d'image cassee)

Principe : chaque photo doit donner envie d'y aller.

### 5.8 Niveau d'animation

| Type | Ou | Duree |
|------|----|-------|
| Hover cards | Partout | 200ms ease-out |
| Page transitions | Guest App | 250ms fade |
| Active press | Buttons mobile | 150ms scale(0.97) |
| Scroll reveal | Recommandations | 300ms slide-up |
| KPI counter | Dashboard Admin | 400ms count-up |
| Notification badge | Reception | pulse-once 600ms |

Principe : chaque animation existe pour un motif (feedback, attention, progression). Jamais decorative.

### 5.9 Ton visuel et microcopy

| Surface | Ton | Metaphore |
|---------|-----|-----------|
| Guest App | Concierge prive, chaleureux | "Votre sejour merite le meilleur" |
| Reception | Efficace, calme, fiable | "Tout sous controle" |
| Hotel Admin | Premium, maitrise, confiance | "Votre hotel entre vos mains" |

Exemples de microcopy :
- "Bienvenue" → "Bonjour Camille"
- "Envoyer" → "Envoyer a la reception"
- "Services" → "A votre service"
- "Statistiques" → "Activite de votre hotel"
- "Erreur" → "Nous verifions, un instant"

## 6. Identite differenciante

| Attribut | Paris Local | Concurrents (LoungeUp, Bowo) |
|----------|-------------|------------------------------|
| Ton | Concierge prive | Outil de communication |
| Visuel | Editorial, photographique | Template SaaS |
| Cible | Boutique hotels parisiens | Chaines / groupes |
| Personnalisation | Theme hotel integre | Couleur primaire |
| Tech | Invisible | Visible (admin lourds) |

## 7. Design Roadmap V2

### PHASE A — Quick Wins (1-2 jours)

| Action | Impact commercial | Difficulte |
|--------|-------------------|------------|
| Ameliorer le microcopy Guest App (ton concierge) | Perception premium +20% | Tres faible |
| Ajouter fade-in sur les changements de section Guest | "C'est fluide comme une app native" | Faible |
| Ajouter active:scale feedback sur tous les boutons mobile | Feel iOS natif | Tres faible |
| Corriger le contraste texte secondaire Reception | Demo plus lisible | Tres faible |

### PHASE B — Guest App Premium (3-5 jours)

| Action | Impact commercial | Difficulte |
|--------|-------------------|------------|
| Onboarding en 2 etapes visuelles (identite → sejour) | Conversion onboarding +30% | Moyen |
| Message d'accueil personnalise avec prenom post-onboarding | Fidelisation percue | Faible |
| Section sejour reorganisee : hero editorial + info pratique en drawer | "C'est comme Airbnb" | Moyen |
| Recommandations : premiere featured pleine largeur, reste en grille 2 colonnes | "On dirait TimeOut Paris" | Moyen |
| Skeleton loaders partout | "C'est instantane" | Faible |

### PHASE C — Reception Polish (2-3 jours)

| Action | Impact commercial | Difficulte |
|--------|-------------------|------------|
| Skeleton loaders sur les tables | Demo sans "chargement..." vide | Faible |
| Templates de reponses rapides | Argument productivite en demo | Moyen |
| Badge "nouveau" anime (pulse-once) | Demo vivante | Tres faible |
| Resume jour en haut du dashboard (3 KPI inline) | "En un coup d'oeil" | Faible |

### PHASE D — Hotel Admin Experience (3-5 jours)

| Action | Impact commercial | Difficulte |
|--------|-------------------|------------|
| Page "Mon hotel" fusionnee (Profil + Settings en onglets) | "Tout au meme endroit" | Moyen |
| Preview Guest App dans l'editeur de cartes | Argument personnalisation | Eleve |
| Barre de progression "Configuration complete a X%" | Argument activation | Moyen |
| Vocabulaire hotelier partout (pas "modules", "guestCards") | "C'est fait pour moi" | Faible |

### PHASE E — Branding Global (1 semaine)

| Action | Impact commercial | Difficulte |
|--------|-------------------|------------|
| Landing page welcomeparis.hotelmanager.fr | Premier contact commercial | Moyen |
| Email templates de prise de RDV | Conversion +50% | Faible |
| PDF offre commerciale (1-2 pages) | Close rate +30% | Faible |
| Favicon + logo SVG propre | Perception serieuse | Faible |
| Open Graph tags (preview liens partages) | Viralite organique | Tres faible |

## 8. Priorites absolues avant rendez-vous hotelier

| # | Action | Raison |
|---|--------|--------|
| 1 | Landing page one-page | Un prospect n'a rien a consulter aujourd'hui avant le RDV |
| 2 | Skeleton loaders Guest + Admin | Elimine les "Chargement..." qui tuent la perception |
| 3 | Microcopy concierge | Le ton fait 50% de la perception premium |

Ces 3 actions se font en 2 jours et changent la perception de "MVP avance" a "produit commercialisable".

## 9. Ce que Paris Local ne doit jamais etre

- Un dashboard technique avec du jargon
- Une app avec 47 options visibles simultanement
- Un template SaaS generique reskinne
- Un concurrent d'Opera/Mews (PMS lourd)
- Un produit qui montre sa complexite

## 10. Phrase directrice

Un directeur doit pouvoir dire a un confrere :

"On a un concierge digital. Les clients scannent un QR, ils ont tout. La reception voit tout en temps reel. C'est elegant et ca marche."
