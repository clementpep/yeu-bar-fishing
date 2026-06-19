# Handoff — Bar d'Yeu

> Dernière mise à jour : 2026-06-18. À lire en début de session pour reprendre le projet.

## 1. En une phrase
PWA mobile-first (SvelteKit + SQLite) pour aider à pêcher le bar à l'**île d'Yeu** :
assistant de conditions (marées/météo/lune/score), contenu éducatif interactif, et carnet
de pêche social (records, duel amical, badges, quiz) pour **2 pêcheurs**. Design **premium**
exigé, iOS **et** Android, utilisable **hors-ligne**.

## 2. Où en est-on
- **Plan 2 — Auth & Profil : ✅ mergé** (PR #3) — argon2, sessions cookie httpOnly, route-group `(app)` protégé, login/profil.
- **Plan 2b — Inscription publique : ✅ mergé** (PR #4) — `/register` ouvert ; **tout inscrit est ami par défaut** (pas de table friends, impacte Plan 6).
- **Plan 3 — Moteur Conditions : ✅ livré** — marées par **fit harmonique** (proxy L'Herbaudière/IOC calibré Port-Joinville vs SHOM : étales ±~10 min, hauteurs ±0,1 m), **Open-Meteo** (sans clé) + cache offline, **suncalc** (lune/soleil), **score de pêche explicable**, écran « Le moment » câblé. Pas de cron ; spot en constante. Régénérer les constituantes : `node scripts/fit-tide-constituents.mjs` (données IOC dans `scripts/.tidedata/`, non versionnées).
- **Plan 1 — Fondations : ✅ terminé, revu, mergé sur `main`** (PR #1).
  Livré : scaffold SvelteKit+TS+Vitest, **design system** (tokens nautiques, Fraunces/Inter
  auto-hébergées), primitives UI (Button/Card/TabBar), **shell + navigation 5 onglets**
  (safe areas iOS/Android), **PWA installable** (manifest + service worker + icônes maskable),
  **SQLite/Drizzle** (table `users` + migration). 10 tests passent, build OK.
  Les 5 écrans (Le moment, Savoir, Carnet, Duel, Profil) sont des **placeholders**.
- **Déploiement : en ligne** via **Dokploy** (Compose) sur **https://yeu-bar-fishing.clementpep.cloud**
  (sous-domaine A `yeu-bar-fishing` → IP du VPS `clementpep.cloud`).
  ⚠️ **Point ouvert** : le domaine renvoyait un **404 Traefik** (« no router »). Fix poussé sur
  `main` (`b95c800`) : le service rejoint **`dokploy-network`** dans `docker-compose.yml`.
  **À faire : redéployer dans Dokploy puis revérifier** que `https://yeu-bar-fishing.clementpep.cloud`
  sert l'app (et non un 404). Voir la section *Dépannage* de `docs/DEPLOY.md`.
  Penser à définir `ORIGIN=https://yeu-bar-fishing.clementpep.cloud` dans *Environment* (Dokploy).

## 3. Prochaine étape de dev
**Plan 4 — Carnet** : saisie d'une prise (taille, poids, technique, leurre/appât, gardé/relâché),
**capture automatique des conditions** au moment de la prise (réutiliser `getDayConditions`),
validation maille **42 cm** (signalée, non bloquante), historique + records. **Sans photo en v1**
(décision de cadrage 2026-06-19). Puis Plan 5 (Savoir, contenu starter + illustrations SVG),
Plan 6 (Duel/badges — amis = tous les inscrits), Plan 7 (offline & finitions).
Chantier branding en attente : nom **« PÊCHE AU BAR »** + logo (déposer dans `static/branding/`).

Roadmap complète (chaque plan = un cycle, livre du logiciel fonctionnel) :
Plan 2 Auth · Plan 3 Moteur Conditions (marées API gratuite + cache cron, météo Open-Meteo
sans clé, lune locale, **score de pêche explicable**) · Plan 4 Carnet (capture conditions,
validation maille **42 cm**) · Plan 5 Savoir & Quiz · Plan 6 Duel & Gamification ·
Plan 7 Offline avancé & finitions.

## 4. Documents de référence (dans le repo)
- **Spec produit** : `docs/superpowers/specs/2026-06-18-bar-yeu-fishing-app-design.md`
  (vision, décisions verrouillées, écrans, modèle de données, **direction UX/UI section 7**,
  périmètre, risques, tests). Android est cible de premier rang (mise à jour intégrée).
- **Plan 1** : `docs/superpowers/plans/2026-06-18-plan-1-fondations.md`.
- **Déploiement** : `docs/DEPLOY.md` (Dokploy + Compose + dépannage 404/502).
- **README** : présentation publique + scripts + structure.
- **Ledger d'exécution Plan 1** : `.git/sdd/progress.md` (⚠️ **local à ce poste**, non versionné ;
  contient les commits par task + les *Minor findings* reportés au Plan 2 — voir §6).

## 5. Stack & conventions
- SvelteKit 2 + **Svelte 5 (runes)**, TypeScript **strict**, Vitest + @testing-library/svelte.
- Drizzle ORM + better-sqlite3 (code DB sous `src/lib/server/**`, server-only).
- PWA : `@vite-pwa/sveltekit`. Build : `@sveltejs/adapter-node` (sortie `build/`, `node build`).
- **Design = single source of truth** : tout style dérive des tokens (`src/lib/design/tokens.ts`
  + vars CSS dans `src/app.css`). Pas de couleurs/espacements en dur dans les composants.
- Langue : **français**. Modèle : **opus** (qualité exigée). Merges via **PR** GitHub.
- `vite.config.ts` : la condition `resolve: process.env.VITEST ? {conditions:['browser']} : undefined`
  est **nécessaire** (tests Svelte 5) et **ne doit pas** fuiter dans le build SSR — ne pas la rendre globale.

## 6. Dette / items reportés au Plan 2 (depuis le ledger)
- Durcir `scripts/gen-icons.mjs` (null-guards sur les regex d'extraction SVG).
- Corriger `svelte-check`/tsconfig pour que les matchers jest-dom (`toBeInTheDocument`) type-résolvent
  (`npm run check` remonte des faux positifs ; les tests passent au runtime).
- Prévoir un fallback `color-mix()` pour iOS Safari < 16.1 / Android Chrome < 118 si besoin.
- Recalibrer les tokens via `frontend-design` quand du vrai contenu apparaît.

## 7. Risque principal à trancher (Plan 3)
**Source de marées gratuite** pour Port-Joinville : pas d'API totalement gratuite *sans clé*
fiable. Approche retenue : API en **tier gratuit (clé gratuite)** mise en **cache quotidien par
un cron VPS** → quotas respectés + offline. Choisir le fournisseur (WorldTides/Stormglass) et la
méthode des coefficients au Plan 3. Météo = Open-Meteo (sans clé). Lune = calcul local.

## 8. Commandes clés
```sh
npm install
npm run dev            # dev (http://localhost:5173)
npm test               # tests (10 passent actuellement)
npm run build          # build prod
npm run db:generate    # nouvelle migration Drizzle
npm run db:migrate     # applique les migrations
```
Repo : https://github.com/clementpep/yeu-bar-fishing — branche par défaut `main`.

## 9. Première action conseillée en reprise
1. Vérifier/finaliser le déploiement (404 → redeploy avec `dokploy-network`, ou coller les logs).
2. Puis lancer le **Plan 2 (Auth & Profil)** via `writing-plans`.
