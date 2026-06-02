# DECISIONS.md - Journal de decisions ParisLocalStack

## 2026-06-02
Decision : preparer un seed demo neutre separe et manuel pour `demo-paris-local`.

Motif : creer Hôtel Lumière Demo Paris sans modifier le seed historique Vendome et sans execution automatique.

Impact : le seed demo doit rester isole, idempotent, cible uniquement sur le `hotel_id` demo et ne jamais etre lance sans validation explicite.

Statut : adopte.

---

## 2026-06-02
Decision : distinguer les audits UI locaux, staging et production.

Motif : les captures Playwright locales initiales peuvent montrer des etats de fallback, login ou erreur lorsque localhost n'est pas representatif. Les captures reelles observees sur captures partagees le 2026-06-02 montrent des surfaces Reception, Guest App Vendome et Super Admin fonctionnelles, sans constituer a elles seules une validation production-ready complete.

Impact : ne pas traiter les captures localhost comme verite unique. Les audits UI doivent etre compares a un environnement representatif, et la priorite Phase 9E reste la stabilisation du tenant demo neutre `demo-paris-local` / Hôtel Lumière Demo Paris.

Statut : adopte.

---

## 2026-06-02
Decision : valider le tenant demo neutre `demo-paris-local` et l'hotel Hôtel Lumière Demo Paris.

Motif : aligner la demonstration commerciale Phase 9E sur un support neutre, sans dependance a Vendome et sans donnees personnelles reelles.

Impact : les documents de demo doivent utiliser `demo-paris-local`; Vendome ne doit rester qu'une reference historique, production ou monitoring si necessaire.

Statut : adopte.

---

## 2026-06-02
Decision : creer des fichiers de contexte officiels du projet.

Motif : permettre a tout nouvel agent de reprendre ParisLocalStack sans relire l'historique complet des conversations.

Impact : PROJECT_BRAIN.md, TECHNICAL_BRAIN.md et ARCHITECTURE_REALITY_CHECK.md deviennent les trois documents de passation principaux.

Statut : adopte.

---

## 2026-06-02
Decision : la prochaine priorite produit est un tenant demo neutre.

Motif : preparer la commercialisation sans exposer de donnees reelles ou d'hotels existants.

Impact : creation de docs phase 9E, scenario demo et checklist avant rendez-vous.

Statut : adopte.

---

## 2026-05
Decision : garder une architecture multi-tenant unique.

Motif : eviter de generer une application React par hotel et conserver une exploitation SaaS maintenable.

Impact : un frontend, une API, une base PostgreSQL, isolation par hotel_id.

Statut : adopte.

---

## 2026-05
Decision : utiliser Coolify pour le deploiement auto-heberge.

Motif : garder la maitrise de l'infrastructure VPS et eviter une dependance coeur a Firebase/Supabase.

Impact : services web, api et postgres geres par Coolify.

Statut : adopte.

---

## 2026-05
Decision : privilegier admin-{slug}.welcomeparis.hotelmanager.fr pour la reception.

Motif : faciliter les wildcards et certificats par rapport au sous-domaine multi-niveau admin.{slug}.

Impact : les URLs reception generees doivent utiliser le format recommande, tout en preservant le format legacy si deja actif.

Statut : adopte.

---

## 2026-05
Decision : separer clients presents et historique CRM.

Motif : rendre le dashboard reception plus operationnel et eviter que les clients partis encombrent les files actives.

Impact : les sejours actifs restent dans l'exploitation courante, les sejours termines passent dans l'historique.

Statut : adopte.

---

## 2026-05
Decision : les donnees CRM internes ne sont jamais publiques.

Motif : securite, confidentialite et isolation multi-tenant.

Impact : notes internes, tags CRM, preferences et statut relation restent uniquement dans les surfaces authentifiees.

Statut : adopte.

---

## 2026-05
Decision : deploiement production via migrations Prisma versionnees.

Motif : eviter les synchronisations destructives de schema en production.

Impact : les migrations doivent etre preparees et deployees proprement.

Statut : adopte.
