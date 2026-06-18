# Élévation premium « Bar d'Yeu » — design spec

> Date : 2026-06-18
> Statut : validé en brainstorming, prêt pour plan d'implémentation
> Auteur : Clément Peponnet
> Contexte : passe de qualité sur la fondation du Plan 1 (livrée par un modèle léger),
> avant la reprise des développements (Plan 2 Auth). Cette spec ne change pas le périmètre
> produit (voir `2026-06-18-bar-yeu-fishing-app-design.md`) ; elle exécute la **direction
> visuelle premium** (§7 de la spec produit) qui avait été reportée.

## 1. Problème

La fondation du Plan 1 est techniquement saine (build OK, tests verts, PWA installable,
déployée) mais **n'a pas reçu la passe de direction visuelle** exigée par la spec produit §7.
Concrètement : tokens = valeurs *placeholder* du plan (couleurs brutes + familles de police,
rien d'autre) ; écrans = `<h1>+<p>` nus ; TabBar texte 12px sans icônes ; aucun polish
web-app mobile (flash de tap, profondeur, motion, safe-areas partielles). Le rendu n'est pas
au niveau « premium nautique, jamais générique » qui est l'exigence centrale du projet.

## 2. Objectif

Élever la fondation au niveau premium attendu **sans déborder sur le périmètre des Plans 2–7**
(pas d'API réelle, pas d'auth, pas de persistance). Produire un **design system complet** et
les **composants signature** réutilisables, et les démontrer sur un **écran vitrine « Le moment »**
avec données factices réalistes.

## 3. Direction visuelle retenue

**« Abysse & laiton — instrument de précision »** (validé) : fond profond dégradé, énorme
respiration, gros chiffres éditoriaux (Fraunces) en sable, laiton parcimonieux comme accent
précieux, contraste élevé pour lisibilité plein soleil. Sobre, profond, durable. Palette et
duo typographique restent ceux verrouillés par la spec produit (abysse/marine/ardoise +
laiton/sable ; Fraunces display + Inter data).

## 4. Architecture des tokens (single source of truth)

Deux couches, séparation nette :

- **Primitives** (`src/lib/design/tokens.ts` + `:root` dans `app.css`) : échelles brutes.
  - `color.*` : palette existante (conservée).
  - `space.*` : échelle existante (conservée).
  - `font.*` : familles existantes (conservées).
  - **`text.*`** (NOUVEAU) : échelle de tailles `xs, sm, base, lg, xl, 2xl, 3xl, display`
    (rem), + `score` fluide `clamp(3.5rem, 18vw, 5rem)`. Plus `lineHeight.*` et `tracking.*`
    (`tight -0.02em`, `normal 0`, `wide 0.08em`).
  - **`radius.*`** (NOUVEAU) : `sm 8px, md 12px, lg 16px, xl 24px, full 999px`.
  - **`elevation.*`** (NOUVEAU) : `1, 2, 3` (ombres en couches, adaptées au fond sombre).
    `shadow.md` conservé comme alias d'`elevation.2` (rétro-compat Card).
  - **`motion.*`** (NOUVEAU) : `durFast 120ms, durBase 240ms, durSlow 480ms` ;
    `easeOut cubic-bezier(0.22,1,0.36,1)`, `easeSpring cubic-bezier(0.34,1.56,0.64,1)`,
    `easeStandard cubic-bezier(0.4,0,0.2,1)`.
- **Sémantique** (alias CSS dans `app.css` uniquement, pas dans le TS) : les composants
  consomment ces variables, **jamais la palette brute**.
  - Surfaces : `--surface-base` (abysse), `--surface-raised` (marine), `--surface-overlay` (ardoise).
  - Bordures : `--border-subtle` `rgba(157,178,190,.12)`, `--border-strong` `rgba(157,178,190,.22)`
    (alpha sur le gris texte — **robuste partout**, remplace tout `color-mix()`).
  - Texte : `--text-primary`, `--text-secondary`, `--text-faint` `rgba(157,178,190,.6)`.
  - Accents : `--accent` (laiton), `--accent-soft` (sable).
  - Profondeur : `--gradient-depth`
    `radial-gradient(120% 80% at 50% -10%, #0E2A3B 0%, #0A1722 45%, #051120 100%)`.
  - Score : `--score-low` (danger), `--score-mid` (laiton), `--score-high` (success).

`cssVar()` (existant, gère déjà camelCase→kebab) reste l'accès typé depuis le TS.

## 5. Polish web-app mobile (global, `app.css`)

Non négociables, appliqués globalement : `-webkit-tap-highlight-color: transparent` ;
`-webkit-text-size-adjust: 100%` ; `overscroll-behavior-y: none` sur le shell ;
`::selection { background: var(--accent-soft); color: var(--surface-base); }` ;
`accent-color: var(--accent)` ; fond d'app via `--gradient-depth` fixé (`background-attachment`
géré pour iOS) ; `min-height: 100svh` avec repli `100dvh` ; safe-areas **haut et bas** ;
scrollbar discrète (WebKit + standard). `prefers-reduced-motion` déjà respecté, étendu aux
nouvelles animations.

## 6. Composants signature

Tout en **SVG inline fait main, zéro dépendance d'icônes/charts** (bundles légers + bannit la
banque d'icônes générique proscrite par la spec).

- **`ScoreGauge.svelte`** — score de pêche 0–100 *explicable*. Arc SVG + gros chiffre Fraunces
  tabulaire + libellé qualitatif (Faible/Moyen/Bon/Très favorable) + liste de **facteurs
  contributeurs** (marée, aube/crépuscule, vent, lune, saison) avec mini-barres pondérées.
  Couleur dérivée du score (low/mid/high). Animation de composition au montage (arc + chiffre),
  neutralisée sous reduced-motion. Props : `score: number` (clampé 0–100), `factors: Factor[]`,
  `label?`.
- **`TideCurve.svelte`** — courbe de marée SVG animée (tracé qui se dessine au montage),
  étales hautes/basses marquées, repère « maintenant », libellé coefficient. Props : points de
  marée + index « maintenant » + coefficient. Pas de lib de charting.
- **`StatTile.svelte`** — tuile de donnée (vent / mer / lune / température) : icône + grande
  valeur tabulaire + unité + label. Variante compacte pour rangée scrollable.
- **Icônes d'onglets** (`src/lib/components/icons/` — 5 SVG cohérents, trait unifié) : Le moment,
  Savoir, Carnet, Duel, Profil. La `TabBar` passe à icône + label, état actif soigné (laiton +
  indicateur), zones tactiles ≥ 44px conservées, safe-area bas.
- **Élévation des primitives** : `Button` (tailles `sm/md`, variantes `primary/ghost`, focus
  visible, état pressé via motion tokens) ; `Card` (variantes `raised`/`inset`, rayon + élévation
  par tokens).

## 7. Écran vitrine « Le moment »

Reconstruit (`src/routes/+page.svelte`) avec données factices **réalistes** (île d'Yeu, juin)
dans `src/lib/data/mock-moment.ts`, **clairement marqué provisoire** (remplacé par le moteur
de conditions du Plan 3 ; aucun appel réseau). Composition mobile-first :

1. En-tête : lieu « Île d'Yeu · Port-Joinville » + date, safe-area haut.
2. Héro : `ScoreGauge` + libellé qualitatif + une ligne « pourquoi ».
3. `TideCurve` + coefficient + compte à rebours prochaine étale.
4. Rangée de `StatTile` : vent, mer, lune (+ temp).
5. « Conseil du jour » : technique contextualisée (carte).
6. « Fenêtres conseillées » : lever/coucher soleil, étales (liste).

Les 4 autres onglets (Savoir, Carnet, Duel, Profil) restent des **placeholders soignés**
(même langage visuel : titre éditorial + carte « à venir » cohérente), pas des `<h1>+<p>` nus.

## 8. Qualité de code & dette (lot séparé)

- `package.json` `name` → `yeu-bar-fishing`.
- Indentation homogène (tabs, convention SvelteKit) sur les fichiers touchés + `.editorconfig`.
- Suppression du `color-mix()` fragile (TabBar) au profit d'un token solide.
- Fix `npm run check` : résolution des types jest-dom (`toBeInTheDocument`) — dette handoff §6 —
  pour une vérification verte.

## 9. Stratégie de test (TDD)

- **Tokens** : étendre `tokens.test.ts` (présence des nouvelles échelles `text/radius/elevation/motion`,
  `cssVar` inchangé sur les nouveaux chemins).
- **`ScoreGauge`** : score clampé 0–100 ; libellé qualitatif correct par seuil ; facteurs rendus ;
  classe/couleur dérivée du score.
- **`TideCurve`** : repères d'étales rendus ; position du repère « maintenant » dérivée des props.
- **`StatTile`** : valeur + unité + label rendus.
- **`TabBar`** : 5 onglets avec icône + label ; `aria-current` sur l'actif (étendre l'existant).
- Build + suite complète + `npm run check` verts avant « terminé ».

## 10. Hors périmètre (YAGNI — Plans 2–7)

Aucune API réelle, aucune auth/session, aucune persistance de prise, aucun cron/cache, aucun
moteur de calcul (marée/lune/score réels). Les données de l'écran vitrine sont factices et
isolées dans un module dédié, supprimable sans toucher aux composants.
