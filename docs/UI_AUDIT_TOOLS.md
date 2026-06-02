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

## Interpretation des resultats

Les audits locaux peuvent afficher des etats de fallback, login ou erreur si l'API, la DB ou le tenant demo ne sont pas disponibles. Ne pas interpreter ces captures comme l'etat production sans comparaison.

Les captures Playwright locales initiales du 2026-06-02 ont montre des etats degrades car l'environnement localhost n'etait pas representatif. Les captures reelles observees sur captures partagees le meme jour montrent des surfaces Reception, Guest App Vendome et Super Admin fonctionnelles, mais ne constituent pas une validation production-ready complete.

Pour un audit exploitable avant demo commerciale, preciser la cible auditee : local, staging ou production. La priorite Phase 9E reste la stabilisation du tenant neutre `demo-paris-local` / Hôtel Lumière Demo Paris.

## Securite

- Ne pas lancer l'audit avec des secrets visibles.
- Ne pas utiliser de compte client reel.
- Ne pas capturer de donnees personnelles reelles.
- Ne pas ouvrir Coolify, Prisma, logs, monitoring prive ou fichiers d'environnement pendant les captures.
