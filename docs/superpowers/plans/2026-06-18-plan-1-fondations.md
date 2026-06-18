# Plan 1 — Fondations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser les fondations techniques et visuelles de l'app « Bar d'Yeu » : une PWA SvelteKit installable, avec un design system premium, un shell d'app navigable par onglets (ergonomie iOS), et la base de données SQLite/Drizzle initialisée.

**Architecture:** Application SvelteKit unique (front PWA + routes API), TypeScript strict, base SQLite locale via Drizzle ORM. Le rendu vise une perf maximale sur Safari iOS et un design distinctif piloté par un système de tokens. Cette phase ne contient ni auth fonctionnelle ni données métier — uniquement le socle réutilisé par tous les plans suivants.

**Tech Stack:** SvelteKit 2 + Svelte 5, TypeScript, Vite, Vitest + @testing-library/svelte (jsdom), Drizzle ORM + better-sqlite3, vite-plugin-pwa, adapter-node.

## Global Constraints

- **Langue de l'UI** : français.
- **Mobile-first strict** : conception pour iPhone Safari en priorité ; zones de tap ≥ 44px ; navigation au pouce ; safe areas iOS respectées (`env(safe-area-inset-*)`).
- **APIs externes** : gratuites uniquement (aucune dépendance payante). Pas d'appel d'API externe dans ce plan.
- **Design** : premium et distinctif, jamais « dashboard SaaS générique ». Tout style dérive des tokens du design system (pas de valeurs en dur dans les composants).
- **Accessibilité** : contraste AA minimum, focus visibles, respect de `prefers-reduced-motion`.
- **Lieu par défaut** : île d'Yeu / Port-Joinville.
- **Node** : ≥ 20.
- **Gestionnaire de paquets** : npm.
- **TypeScript** : mode strict activé.

---

## File Structure

```
yeu-bar-fishing/
├── package.json, svelte.config.js, vite.config.ts, tsconfig.json
├── drizzle.config.ts
├── static/
│   ├── manifest.webmanifest
│   └── icons/ (192, 512, maskable, apple-touch)
├── src/
│   ├── app.html              (meta viewport-fit=cover, theme-color)
│   ├── app.css               (reset + tokens globaux + base)
│   ├── app.d.ts
│   ├── lib/
│   │   ├── design/
│   │   │   ├── tokens.ts      (tokens typés : couleurs, typo, espacements)
│   │   │   └── tokens.test.ts
│   │   ├── components/ui/
│   │   │   ├── Button.svelte / Button.test.ts
│   │   │   ├── Card.svelte
│   │   │   └── TabBar.svelte / TabBar.test.ts
│   │   └── server/
│   │       └── db/
│   │           ├── schema.ts  (table users — socle)
│   │           ├── index.ts   (client Drizzle)
│   │           └── db.test.ts
│   └── routes/
│       ├── +layout.svelte     (shell : <main> + TabBar + safe areas)
│       ├── +page.svelte       (Accueil placeholder)
│       ├── savoir/+page.svelte
│       ├── carnet/+page.svelte
│       ├── duel/+page.svelte
│       └── profil/+page.svelte
└── drizzle/                   (migrations générées)
```

---

### Task 1: Scaffold du projet SvelteKit + tooling de test

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.css`, `src/app.d.ts`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`
- Create: `src/lib/smoke.ts`, `src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: rien (premier task).
- Produces: projet SvelteKit lançable (`npm run dev`), runner Vitest opérationnel (`npm test`), adapter-node configuré.

- [ ] **Step 1: Scaffolder le projet SvelteKit minimal**

Run (dans le dossier racine déjà initialisé en git) :
```bash
npx sv create . --template minimal --types ts --no-add-ons
```
Si `sv` demande d'écraser le dossier non vide, accepter (le `.git`, `LICENSE` et `docs/` doivent être préservés — vérifier ensuite avec `git status`).

- [ ] **Step 2: Installer les dépendances de test et l'adapter-node**

Run:
```bash
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom @vitest/coverage-v8
npm install -D @sveltejs/adapter-node
```

- [ ] **Step 3: Configurer Vitest dans `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
```

Create `vitest-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Utiliser adapter-node dans `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() }
};

export default config;
```

- [ ] **Step 5: Écrire un test smoke qui échoue**

Create `src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { appName } from './smoke';

describe('smoke', () => {
  it('expose le nom de l\'app', () => {
    expect(appName()).toBe("Bar d'Yeu");
  });
});
```

- [ ] **Step 6: Lancer le test et vérifier l'échec**

Run: `npm test -- run`
Expected: FAIL — `Cannot find module './smoke'` (ou `appName is not a function`).

- [ ] **Step 7: Implémentation minimale**

Create `src/lib/smoke.ts`:
```ts
export function appName(): string {
  return "Bar d'Yeu";
}
```

Ajouter le script de test dans `package.json` (`"scripts"`) s'il n'existe pas :
```json
"test": "vitest"
```

- [ ] **Step 8: Lancer le test et vérifier le succès**

Run: `npm test -- run`
Expected: PASS (1 test).

- [ ] **Step 9: Vérifier que le dev server démarre**

Run: `npm run build`
Expected: build réussit sans erreur.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold SvelteKit + vitest + adapter-node"
```

---

### Task 2: Design tokens (système premium)

> **REQUIRED SUB-SKILL pour cette task :** utiliser `frontend-design:frontend-design` pour arrêter la direction visuelle fine (valeurs exactes de palette, duo typographique, échelle d'espacement) AVANT d'écrire les tokens. Les valeurs ci-dessous sont une base de départ cohérente avec le spec ; le designer doit les raffiner pour un rendu « premium nautique » distinctif (abysse/marine, accents laiton/sable). Ne pas livrer les valeurs par défaut sans passage par la skill.

**Files:**
- Create: `src/lib/design/tokens.ts`, `src/lib/design/tokens.test.ts`
- Modify: `src/app.css` (injecter les tokens en variables CSS + reset + base typographique)

**Interfaces:**
- Consumes: rien.
- Produces:
  - `tokens` (objet typé) avec au minimum : `color.abyss`, `color.marine`, `color.slate`, `color.brass`, `color.sand`, `color.text`, `color.textMuted`, `color.danger`, `color.success`.
  - `cssVar(path: string): string` → retourne `var(--<path-en-kebab>)` (ex. `cssVar('color.brass')` → `'var(--color-brass)'`).
  - Variables CSS `--color-*`, `--space-*`, `--font-display`, `--font-body` disponibles globalement via `app.css`.

- [ ] **Step 1: Écrire le test des tokens (échoue)**

Create `src/lib/design/tokens.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { tokens, cssVar } from './tokens';

describe('design tokens', () => {
  it('expose les couleurs signature de la palette nautique', () => {
    expect(tokens.color.abyss).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.brass).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.sand).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('cssVar convertit un chemin pointé en variable CSS kebab-case', () => {
    expect(cssVar('color.brass')).toBe('var(--color-brass)');
    expect(cssVar('space.4')).toBe('var(--space-4)');
  });
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/design/tokens.test.ts`
Expected: FAIL — module `./tokens` introuvable.

- [ ] **Step 3: Implémenter les tokens**

Create `src/lib/design/tokens.ts` (valeurs de base — à raffiner via frontend-design) :
```ts
export const tokens = {
  color: {
    abyss: '#0A1722',      // fond profond dominant
    marine: '#0E2A3B',     // surfaces
    slate: '#1B3A4B',      // cartes / élévation
    brass: '#C9A24B',      // accent or/laiton
    sand: '#E7D8B8',       // accent clair
    text: '#F2F6F8',       // texte principal
    textMuted: '#9DB2BE',  // texte secondaire
    danger: '#E2574C',     // sous maille / alerte
    success: '#5BB98B'     // maille OK / validé
  },
  space: { '1': '4px', '2': '8px', '3': '12px', '4': '16px', '6': '24px', '8': '32px' },
  font: {
    display: "'Fraunces', Georgia, serif",   // titres éditoriaux (à valider)
    body: "'Inter', system-ui, sans-serif"   // data/texte
  }
} as const;

export function cssVar(path: string): string {
  return `var(--${path.replace(/\./g, '-')})`;
}
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/design/tokens.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Injecter tokens + reset dans `src/app.css`**

```css
:root {
  --color-abyss: #0A1722;
  --color-marine: #0E2A3B;
  --color-slate: #1B3A4B;
  --color-brass: #C9A24B;
  --color-sand: #E7D8B8;
  --color-text: #F2F6F8;
  --color-text-muted: #9DB2BE;
  --color-danger: #E2574C;
  --color-success: #5BB98B;
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-abyss);
  color: var(--color-text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  min-height: 100dvh;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 600; }
:focus-visible { outline: 2px solid var(--color-brass); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

S'assurer que `app.css` est importé dans `src/routes/+layout.svelte` (`import '../app.css';`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(design): tokens nautiques premium + reset global"
```

---

### Task 3: Primitives UI (Button, Card)

**Files:**
- Create: `src/lib/components/ui/Button.svelte`, `src/lib/components/ui/Button.test.ts`, `src/lib/components/ui/Card.svelte`
- (Svelte 5 runes ; composants stylés via tokens)

**Interfaces:**
- Consumes: tokens CSS de la Task 2.
- Produces:
  - `Button` props : `variant?: 'primary' | 'ghost'` (défaut `'primary'`), `type?`, `disabled?`, slot enfant ; émet le clic natif. Hauteur ≥ 44px.
  - `Card` : conteneur stylé (surface `--color-slate`, rayon, ombre douce), slot par défaut.

- [ ] **Step 1: Écrire le test du Button (échoue)**

Create `src/lib/components/ui/Button.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  it('rend le label fourni en slot', () => {
    render(Button, { props: { children: undefined } as any });
    // fallback : vérifie qu'un <button> est présent
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applique la variante primary par défaut', () => {
    render(Button);
    expect(screen.getByRole('button').className).toContain('primary');
  });
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/Button.test.ts`
Expected: FAIL — `Button.svelte` introuvable.

- [ ] **Step 3: Implémenter `Button.svelte` (Svelte 5)**

```svelte
<script lang="ts">
  let { variant = 'primary', type = 'button', disabled = false, children, onclick }:
    { variant?: 'primary' | 'ghost'; type?: 'button' | 'submit'; disabled?: boolean; children?: any; onclick?: (e: MouseEvent) => void } = $props();
</script>

<button class="btn {variant}" {type} {disabled} {onclick}>
  {@render children?.()}
</button>

<style>
  .btn {
    min-height: 44px;
    padding: 0 var(--space-6);
    border-radius: 12px;
    font: inherit;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: transform 120ms ease, background 120ms ease;
  }
  .btn:active { transform: scale(0.98); }
  .btn.primary { background: var(--color-brass); color: var(--color-abyss); }
  .btn.ghost { background: transparent; color: var(--color-text); border-color: var(--color-slate); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/Button.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Implémenter `Card.svelte`**

```svelte
<script lang="ts">
  let { children }: { children?: any } = $props();
</script>

<div class="card">{@render children?.()}</div>

<style>
  .card {
    background: var(--color-slate);
    border-radius: 16px;
    padding: var(--space-6);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  }
</style>
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): primitives Button et Card basées sur les tokens"
```

---

### Task 4: Shell d'app + navigation par onglets (safe areas iOS)

**Files:**
- Create: `src/lib/components/ui/TabBar.svelte`, `src/lib/components/ui/TabBar.test.ts`
- Modify: `src/routes/+layout.svelte` (shell : `<main>` scrollable + `<TabBar>`)
- Create: `src/routes/savoir/+page.svelte`, `src/routes/carnet/+page.svelte`, `src/routes/duel/+page.svelte`, `src/routes/profil/+page.svelte`
- Modify: `src/routes/+page.svelte` (Accueil placeholder)
- Modify: `src/app.html` (meta viewport `viewport-fit=cover`, `theme-color`)

**Interfaces:**
- Consumes: tokens (Task 2).
- Produces:
  - `TabBar` : 5 onglets (`/` Le moment, `/savoir` Savoir, `/carnet` Carnet, `/duel` Duel, `/profil` Profil). Met en évidence l'onglet actif via `$page.url.pathname`. Respecte `env(safe-area-inset-bottom)`.

- [ ] **Step 1: Mettre à jour `src/app.html`**

Dans `<head>`, remplacer la balise viewport et ajouter le theme-color :
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0A1722" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

- [ ] **Step 2: Écrire le test de la TabBar (échoue)**

Create `src/lib/components/ui/TabBar.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import TabBar from './TabBar.svelte';

vi.mock('$app/stores', () => ({
  page: readable({ url: new URL('http://localhost/carnet') })
}));

describe('TabBar', () => {
  it('rend les 5 onglets', () => {
    render(TabBar);
    expect(screen.getByText('Le moment')).toBeInTheDocument();
    expect(screen.getByText('Savoir')).toBeInTheDocument();
    expect(screen.getByText('Carnet')).toBeInTheDocument();
    expect(screen.getByText('Duel')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
  });

  it('marque l\'onglet courant (carnet) comme actif', () => {
    render(TabBar);
    const lien = screen.getByText('Carnet').closest('a');
    expect(lien?.getAttribute('aria-current')).toBe('page');
  });
});
```

- [ ] **Step 3: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/TabBar.test.ts`
Expected: FAIL — `TabBar.svelte` introuvable.

- [ ] **Step 4: Implémenter `TabBar.svelte`**

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  const tabs = [
    { href: '/', label: 'Le moment' },
    { href: '/savoir', label: 'Savoir' },
    { href: '/carnet', label: 'Carnet' },
    { href: '/duel', label: 'Duel' },
    { href: '/profil', label: 'Profil' }
  ];
  const isActive = (href: string, path: string) =>
    href === '/' ? path === '/' : path.startsWith(href);
</script>

<nav class="tabbar">
  {#each tabs as tab}
    <a
      href={tab.href}
      class="tab"
      aria-current={isActive(tab.href, $page.url.pathname) ? 'page' : undefined}
    >
      {tab.label}
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    display: flex;
    justify-content: space-around;
    background: color-mix(in srgb, var(--color-marine) 92%, black);
    border-top: 1px solid var(--color-slate);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 10;
  }
  .tab {
    flex: 1;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--color-text-muted);
    text-decoration: none;
  }
  .tab[aria-current='page'] { color: var(--color-brass); font-weight: 600; }
</style>
```

- [ ] **Step 5: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/TabBar.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Implémenter le shell dans `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  import TabBar from '$lib/components/ui/TabBar.svelte';
  let { children }: { children?: any } = $props();
</script>

<div class="app-shell">
  <main>{@render children?.()}</main>
  <TabBar />
</div>

<style>
  .app-shell { min-height: 100dvh; }
  main {
    padding: var(--space-6) var(--space-4);
    padding-top: max(var(--space-6), env(safe-area-inset-top));
    padding-bottom: calc(64px + env(safe-area-inset-bottom));
    max-width: 640px;
    margin: 0 auto;
  }
</style>
```

- [ ] **Step 7: Créer les pages placeholder**

`src/routes/+page.svelte` :
```svelte
<h1>Le moment</h1>
<p>Conditions de pêche du jour — île d'Yeu (à venir).</p>
```
`src/routes/savoir/+page.svelte` :
```svelte
<h1>Savoir</h1>
<p>Techniques, stratégies et réglementation (à venir).</p>
```
`src/routes/carnet/+page.svelte` :
```svelte
<h1>Carnet</h1>
<p>Vos prises et records (à venir).</p>
```
`src/routes/duel/+page.svelte` :
```svelte
<h1>Duel</h1>
<p>Classement amical, badges et défis (à venir).</p>
```
`src/routes/profil/+page.svelte` :
```svelte
<h1>Profil</h1>
<p>Compte et réglages (à venir).</p>
```

- [ ] **Step 8: Vérifier le build et la navigation**

Run: `npm run build`
Expected: build réussit. (Vérification visuelle de la navigation au lancement `npm run preview`.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(shell): navigation par onglets + safe areas iOS + pages placeholder"
```

---

### Task 5: PWA installable (manifest + service worker + icônes)

**Files:**
- Create: `static/manifest.webmanifest`, `static/icons/` (192, 512, maskable, apple-touch-icon)
- Modify: `vite.config.ts` (vite-plugin-pwa), `src/app.html` (lien manifest + apple-touch-icon)

**Interfaces:**
- Consumes: shell (Task 4).
- Produces: app installable sur écran d'accueil iOS/Android ; service worker enregistré (precache de l'app shell). En v1, stratégie offline minimale (precache build) ; l'offline avancé est traité au Plan 7.

- [ ] **Step 1: Installer vite-plugin-pwa**

Run:
```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Configurer le plugin PWA dans `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "Bar d'Yeu",
        short_name: "Bar d'Yeu",
        description: 'Assistant de pêche au bar — île d\'Yeu',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A1722',
        theme_color: '#0A1722',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
```

Run (dépendance du plugin SvelteKit dédié) :
```bash
npm install -D @vite-pwa/sveltekit
```

- [ ] **Step 3: Générer les icônes**

Créer un visuel source carré `static/icons/source.png` (1024×1024, fond abysse + emblème laiton — voir frontend-design). Générer les déclinaisons :
```bash
npm install -D pwa-asset-generator
npx pwa-asset-generator static/icons/source.png static/icons --icon-only --padding "10%" --background "#0A1722"
```
Renommer/garantir la présence de : `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` (180×180).

- [ ] **Step 4: Référencer l'apple-touch-icon dans `src/app.html`**

Dans `<head>` :
```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

- [ ] **Step 5: Vérifier le build PWA**

Run: `npm run build`
Expected: build réussit ; un service worker (`sw.js`) et le manifest sont émis dans le dossier de build.

- [ ] **Step 6: Vérifier l'installabilité (manuel)**

Run: `npm run preview`
Vérifier dans Chrome DevTools > Application : manifest valide, SW enregistré, « Installable ». (Test iOS Safari réel à faire en fin de plan.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(pwa): manifest, service worker et icônes installables"
```

---

### Task 6: Base de données SQLite + Drizzle (table users socle)

**Files:**
- Create: `drizzle.config.ts`, `src/lib/server/db/schema.ts`, `src/lib/server/db/index.ts`, `src/lib/server/db/db.test.ts`
- Modify: `package.json` (scripts `db:generate`, `db:migrate`), `.gitignore` (ignorer `*.sqlite`)

**Interfaces:**
- Consumes: rien.
- Produces:
  - `schema.users` : table Drizzle avec colonnes `id` (text, pk), `name` (text), `email` (text, unique), `passwordHash` (text), `avatar` (text, nullable), `spotDefaultId` (text, nullable), `createdAt` (integer timestamp). *L'auth fonctionnelle est au Plan 2 ; ici on ne pose que le schéma + le client.*
  - `db` : instance Drizzle (`drizzle(better-sqlite3)`) exportée depuis `src/lib/server/db/index.ts`.
  - `createDb(path: string)` : factory testable retournant une instance Drizzle sur un fichier/`:memory:`.

- [ ] **Step 1: Installer Drizzle + better-sqlite3**

Run:
```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

- [ ] **Step 2: Définir le schéma `src/lib/server/db/schema.ts`**

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  spotDefaultId: text('spot_default_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

- [ ] **Step 3: Implémenter le client `src/lib/server/db/index.ts`**

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export function createDb(path = 'data.sqlite') {
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  return drizzle(sqlite, { schema });
}

export const db = createDb(process.env.DATABASE_PATH ?? 'data.sqlite');
```

- [ ] **Step 4: Configurer `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: 'data.sqlite' }
});
```

- [ ] **Step 5: Ajouter les scripts db + ignorer la base**

Dans `package.json` `"scripts"` :
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```
Dans `.gitignore`, ajouter :
```
*.sqlite
*.sqlite-*
```

- [ ] **Step 6: Générer la migration initiale**

Run:
```bash
npm run db:generate
```
Expected: un fichier SQL apparaît dans `drizzle/` créant la table `users`.

- [ ] **Step 7: Écrire le test d'intégration DB (échoue d'abord si schéma absent)**

Create `src/lib/server/db/db.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from './index';
import { users } from './schema';

describe('db', () => {
  it('insère et relit un utilisateur en base mémoire', () => {
    const db = createDb(':memory:');
    // crée la table à la volée pour le test (le schéma de prod vient des migrations)
    db.run(sql`CREATE TABLE users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, avatar TEXT, spot_default_id TEXT,
      created_at INTEGER NOT NULL
    )`);

    db.insert(users).values({
      id: 'u1', name: 'Papa', email: 'papa@example.com',
      passwordHash: 'x', createdAt: new Date()
    }).run();

    const rows = db.select().from(users).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('papa@example.com');
  });
});
```

- [ ] **Step 8: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/server/db/db.test.ts`
Expected: PASS (1 test).

- [ ] **Step 9: Lancer toute la suite + build**

Run: `npm test -- run && npm run build`
Expected: tous les tests PASS, build OK.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(db): SQLite + Drizzle, schéma users socle et migration initiale"
```

---

## Self-Review

**1. Spec coverage (Plan 1 = fondations uniquement) :**
- Stack SvelteKit + SQLite/Drizzle → Tasks 1 & 6 ✅
- PWA installable iOS → Task 5 ✅
- Design system premium / tokens → Task 2 (avec frontend-design) ✅
- Shell + navigation 5 onglets + safe areas → Task 4 ✅
- Primitives UI → Task 3 ✅
- Auth, conditions, carnet, savoir, duel, offline avancé, déploiement → **hors périmètre, plans 2-7** (intentionnel).

**2. Placeholder scan :** chaque step contient du code réel ou une commande exacte avec sortie attendue. Les pages « (à venir) » sont des placeholders **fonctionnels assumés** (le contenu arrive dans les plans dédiés), pas des trous de plan.

**3. Type consistency :** `createDb(path)` défini en Task 6 et utilisé de façon cohérente ; `tokens`/`cssVar` définis en Task 2 ; props `Button`/`TabBar` cohérentes entre test et implémentation. Svelte 5 runes (`$props`, `{@render children?.()}`) utilisées uniformément.

**Note d'exécution :** la Task 2 exige le passage par la skill `frontend-design` pour arrêter la direction visuelle finale avant de figer les valeurs des tokens — c'est le point d'ancrage de l'exigence UX/UI premium du projet.
