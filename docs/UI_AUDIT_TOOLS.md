# UI Audit Tools

## Objectif

Ce socle installe des outils gratuits et open source pour auditer l'interface ParisLocalStack avant la Phase 10 Design System / Templates.

## Outils installes

- Playwright via `@playwright/test`.
- `@axe-core/playwright` pour relever les problemes d'accessibilite.

Aucun MCP, service cloud, outil payant, Storybook, Chromatic, Figma ou librairie UI externe n'est ajoute.

## Surfaces auditees

- Guest App demo : `/h/demo-paris-local/welcome`
- Reception : `/reception`
- Admin Hotel : `/hotel-admin`

Chaque surface est auditee en mobile et desktop.

## Lancer l'audit

Demarrer l'app web locale dans un terminal :

```bash
npm run dev:web
```

Puis lancer l'audit dans un autre terminal :

```bash
npm run audit:ui
```

Pour cibler une autre URL locale ou un environnement de test non sensible :

```bash
UI_AUDIT_BASE_URL=http://localhost:5173 npm run audit:ui
```

## Sorties

Les captures et rapports axe temporaires sont ecrits dans :

```txt
node_modules/.cache/parislocalstack-ui-audit
```

Ce dossier est ignore par Git via `node_modules/`. Ne pas committer de captures ou de rapports lourds sans validation explicite.

## Nature des audits

Les audits sont non bloquants : les violations axe sont enregistrees en JSON, mais elles ne font pas echouer la commande. Cette PR ne cree pas de baseline visuelle stricte.

## Securite

- Ne pas lancer l'audit avec des secrets visibles.
- Ne pas utiliser de compte client reel.
- Ne pas capturer de donnees personnelles reelles.
- Ne pas ouvrir Coolify, Prisma, logs, monitoring prive ou fichiers d'environnement pendant les captures.
