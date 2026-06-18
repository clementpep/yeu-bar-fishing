# Élévation premium « Bar d'Yeu » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Élever la fondation du Plan 1 au niveau « premium nautique » exigé par la spec produit §7, en livrant un design system complet, des composants signature réutilisables, et un écran vitrine « Le moment » sur données factices.

**Architecture:** Tokens en deux couches (primitives typées dans `tokens.ts` + alias sémantiques CSS dans `app.css`), composants Svelte 5 (runes) consommant uniquement le sémantique, visuels en SVG inline fait main (zéro dépendance d'icônes/charts). Données de démonstration isolées dans un module dédié, supprimable sans toucher aux composants.

**Tech Stack:** SvelteKit 2 + Svelte 5, TypeScript strict, Vitest + @testing-library/svelte (jsdom), CSS custom properties.

## Global Constraints

- **Langue de l'UI** : français.
- **Direction visuelle** : « Abysse & laiton — instrument de précision ». Sobre, profond, contraste élevé, accents laiton parcimonieux. Jamais de « look IA générique ».
- **Mobile-first strict** : zones de tap ≥ 44px, navigation au pouce, safe areas iOS **et** Android (`env(safe-area-inset-*)`), `100svh`/`100dvh`, `viewport-fit=cover`.
- **Design = single source of truth** : tout style dérive des tokens. Les composants consomment les **variables sémantiques** (`--surface-*`, `--text-*`, `--accent`, `--border-*`), jamais la palette brute (`--color-*`).
- **Zéro dépendance nouvelle** : icônes et courbes en SVG inline maison.
- **Accessibilité** : contraste AA, focus visibles, `prefers-reduced-motion` respecté par toutes les animations.
- **Aucun débordement Plans 2–7** : pas d'API réelle, pas d'auth, pas de persistance. Données factices isolées.
- **TypeScript** : strict. **Node** ≥ 20. **npm**.
- **Convention de nommage des CSS vars** : `--<groupe>-<clé-kebab>`, identique à la sortie de `cssVar('<groupe>.<clé>')`.

---

## File Structure

```
src/
├── app.css                                  (MODIFY : tokens primitifs + sémantiques + polish mobile + typo base)
├── lib/
│   ├── design/
│   │   ├── tokens.ts                         (MODIFY : +text, +leading, +tracking, +radius, +elevation, +motion)
│   │   └── tokens.test.ts                    (MODIFY : assertions nouvelles échelles)
│   ├── types/
│   │   └── conditions.ts                     (CREATE : TidePoint, ScoreFactor, StatData, MomentData)
│   ├── data/
│   │   └── mock-moment.ts                    (CREATE : données factices île d'Yeu — provisoire)
│   ├── components/
│   │   ├── icons/
│   │   │   ├── IconMoment.svelte             (CREATE)
│   │   │   ├── IconSavoir.svelte             (CREATE)
│   │   │   ├── IconCarnet.svelte             (CREATE)
│   │   │   ├── IconDuel.svelte               (CREATE)
│   │   │   └── IconProfil.svelte             (CREATE)
│   │   └── ui/
│   │       ├── Button.svelte                 (MODIFY : tailles, motion, focus)
│   │       ├── Button.test.ts                (MODIFY)
│   │       ├── Card.svelte                   (MODIFY : variantes raised/inset, tokens)
│   │       ├── Card.test.ts                  (CREATE)
│   │       ├── TabBar.svelte                 (MODIFY : icônes + label + état actif)
│   │       ├── TabBar.test.ts                (MODIFY)
│   │       ├── StatTile.svelte               (CREATE)
│   │       ├── StatTile.test.ts              (CREATE)
│   │       ├── TideCurve.svelte              (CREATE)
│   │       ├── TideCurve.test.ts             (CREATE)
│   │       ├── ScoreGauge.svelte             (CREATE)
│   │       ├── ScoreGauge.test.ts            (CREATE)
│   │       ├── PagePlaceholder.svelte        (CREATE)
│   │       └── PagePlaceholder.test.ts       (CREATE)
│   └── ...
├── routes/
│   ├── +page.svelte                          (MODIFY : écran « Le moment » vitrine)
│   ├── savoir/+page.svelte                   (MODIFY : placeholder soigné)
│   ├── carnet/+page.svelte                   (MODIFY : placeholder soigné)
│   ├── duel/+page.svelte                     (MODIFY : placeholder soigné)
│   └── profil/+page.svelte                   (MODIFY : placeholder soigné)
├── vitest.d.ts                               (CREATE : augmentation types jest-dom pour svelte-check)
└── ...
.editorconfig                                 (CREATE)
package.json                                  (MODIFY : name)
```

---

### Task 1: Design system — tokens, sémantique, polish mobile

**Files:**
- Modify: `src/lib/design/tokens.ts`
- Modify: `src/lib/design/tokens.test.ts`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: rien.
- Produces :
  - `tokens` étendu : groupes `text`, `leading`, `tracking`, `radius`, `elevation`, `motion` (en plus de `color`, `space`, `font`, `shadow`).
  - `cssVar(path)` inchangé (déjà camelCase→kebab).
  - Variables CSS primitives `--text-*`, `--leading-*`, `--tracking-*`, `--radius-*`, `--elevation-*`, `--motion-*` ; variables **sémantiques** `--surface-base/raised/overlay`, `--border-subtle/strong`, `--text-primary/secondary/faint`, `--accent`, `--accent-soft`, `--score-low/mid/high`, `--gradient-depth`.

- [ ] **Step 1: Écrire les tests des nouvelles échelles (échouent)**

Remplacer le contenu de `src/lib/design/tokens.test.ts` par :
```ts
import { describe, it, expect } from 'vitest';
import { tokens, cssVar } from './tokens';

describe('design tokens', () => {
  it('expose les couleurs signature de la palette nautique', () => {
    expect(tokens.color.abyss).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.brass).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.sand).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('expose une échelle typographique en rem', () => {
    expect(tokens.text.base).toBe('1rem');
    expect(tokens.text['2xl']).toMatch(/rem$/);
    expect(tokens.text.score).toContain('clamp');
  });

  it('expose rayons, élévation et motion', () => {
    expect(tokens.radius.md).toBe('12px');
    expect(tokens.elevation['2']).toContain('rgba');
    expect(tokens.motion.easeOut).toContain('cubic-bezier');
  });

  it('cssVar convertit un chemin pointé en variable CSS kebab-case', () => {
    expect(cssVar('color.brass')).toBe('var(--color-brass)');
    expect(cssVar('space.4')).toBe('var(--space-4)');
    expect(cssVar('color.depthsLight')).toBe('var(--color-depths-light)');
  });

  it('cssVar gère les nouveaux groupes', () => {
    expect(cssVar('text.2xl')).toBe('var(--text-2xl)');
    expect(cssVar('radius.md')).toBe('var(--radius-md)');
    expect(cssVar('motion.easeOut')).toBe('var(--motion-ease-out)');
  });
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/design/tokens.test.ts`
Expected: FAIL — `tokens.text`/`tokens.radius`/`tokens.motion` indéfinis.

- [ ] **Step 3: Étendre `src/lib/design/tokens.ts`**

Remplacer le contenu par :
```ts
export const tokens = {
  color: {
    trench: '#051120',
    abyss: '#0A1722',
    marine: '#0E2A3B',
    slate: '#1B3A4B',
    depthsLight: '#2A4A5B',
    brass: '#C9A24B',
    sand: '#E7D8B8',
    text: '#F2F6F8',
    textMuted: '#9DB2BE',
    danger: '#D94C47',
    success: '#4FA083'
  },
  space: {
    '1': '4px', '2': '8px', '3': '12px', '4': '16px',
    '6': '24px', '8': '32px', '12': '48px', '16': '64px'
  },
  font: {
    display: '"Fraunces Variable", Georgia, serif',
    body: '"Inter Variable", system-ui, sans-serif'
  },
  text: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    '2xl': '1.75rem',
    '3xl': '2.25rem',
    display: '3rem',
    score: 'clamp(3.5rem, 18vw, 5rem)'
  },
  leading: { tight: '1.1', snug: '1.3', normal: '1.5' },
  tracking: { tight: '-0.02em', normal: '0', wide: '0.08em' },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '999px' },
  elevation: {
    '1': '0 1px 2px rgba(0, 0, 0, 0.4)',
    '2': '0 4px 16px rgba(0, 0, 0, 0.4)',
    '3': '0 12px 32px rgba(0, 0, 0, 0.5)'
  },
  shadow: { md: '0 4px 16px rgba(0, 0, 0, 0.4)' },
  motion: {
    durFast: '120ms',
    durBase: '240ms',
    durSlow: '480ms',
    easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easeStandard: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const;

/**
 * Convert a token path (e.g. "color.brass", "text.2xl", "motion.easeOut") to a CSS
 * variable reference. Dots become dashes, camelCase becomes kebab-case.
 *   cssVar('color.brass')   => 'var(--color-brass)'
 *   cssVar('motion.easeOut')=> 'var(--motion-ease-out)'
 */
export function cssVar(path: string): string {
  const kebabPath = path
    .replace(/\./g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `var(--${kebabPath})`;
}
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/design/tokens.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Réécrire `src/app.css`**

Remplacer tout le fichier par :
```css
/* Variable fonts (fontsource) */
@import '@fontsource-variable/fraunces';
@import '@fontsource-variable/inter';

:root {
  /* — Palette (primitives brutes) — */
  --color-trench: #051120;
  --color-abyss: #0A1722;
  --color-marine: #0E2A3B;
  --color-slate: #1B3A4B;
  --color-depths-light: #2A4A5B;
  --color-brass: #C9A24B;
  --color-sand: #E7D8B8;
  --color-text: #F2F6F8;
  --color-text-muted: #9DB2BE;
  --color-danger: #D94C47;
  --color-success: #4FA083;

  /* — Espacements — */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  /* — Typographie — */
  --font-display: "Fraunces Variable", Georgia, serif;
  --font-body: "Inter Variable", system-ui, sans-serif;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.125rem;
  --text-xl: 1.375rem; --text-2xl: 1.75rem; --text-3xl: 2.25rem; --text-display: 3rem;
  --text-score: clamp(3.5rem, 18vw, 5rem);
  --leading-tight: 1.1; --leading-snug: 1.3; --leading-normal: 1.5;
  --tracking-tight: -0.02em; --tracking-normal: 0; --tracking-wide: 0.08em;

  /* — Rayons — */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-full: 999px;

  /* — Élévation — */
  --elevation-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --elevation-2: 0 4px 16px rgba(0, 0, 0, 0.4);
  --elevation-3: 0 12px 32px rgba(0, 0, 0, 0.5);
  --shadow-md: var(--elevation-2);

  /* — Motion — */
  --motion-dur-fast: 120ms; --motion-dur-base: 240ms; --motion-dur-slow: 480ms;
  --motion-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* — Tokens sémantiques (consommés par les composants) — */
  --surface-base: var(--color-abyss);
  --surface-raised: var(--color-marine);
  --surface-overlay: var(--color-slate);
  --border-subtle: rgba(157, 178, 190, 0.12);
  --border-strong: rgba(157, 178, 190, 0.22);
  --text-primary: var(--color-text);
  --text-secondary: var(--color-text-muted);
  --text-faint: rgba(157, 178, 190, 0.6);
  --accent: var(--color-brass);
  --accent-soft: var(--color-sand);
  --score-low: var(--color-danger);
  --score-mid: var(--color-brass);
  --score-high: var(--color-success);
  --gradient-depth: radial-gradient(120% 80% at 50% -10%, #0E2A3B 0%, #0A1722 45%, #051120 100%);
}

/* — Reset — */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

body {
  background-color: var(--surface-base);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -webkit-tap-highlight-color: transparent;
  accent-color: var(--accent);
  overscroll-behavior-y: none;
  min-height: 100dvh;
}
@supports (min-height: 100svh) { body { min-height: 100svh; } }

/* Fond de profondeur fixe (robuste iOS : pas de background-attachment) */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--gradient-depth);
  z-index: -1;
}

/* — Typographie de base — */
h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  margin: 0;
}
p { margin: 0; }
a { color: inherit; }

[data-tabular], .tabular-nums { font-variant-numeric: tabular-nums; }

/* — Sélection & focus — */
::selection { background: var(--accent-soft); color: var(--surface-base); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* — Scrollbar discrète — */
* { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: var(--radius-full); }

/* — Reduced motion — */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Vérifier la suite complète + build**

Run: `npm test -- run && npm run build`
Expected: tous les tests PASS, build OK.

- [ ] **Step 7: Commit**

```bash
git add src/lib/design/tokens.ts src/lib/design/tokens.test.ts src/app.css
git commit -m "feat(design): échelles typo/rayon/élévation/motion + tokens sémantiques + polish mobile"
```

---

### Task 2: Qualité de code & fix `svelte-check`

**Files:**
- Modify: `package.json` (champ `name`)
- Create: `.editorconfig`
- Create: `src/vitest.d.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `npm run check` vert (types jest-dom résolus) ; nom de projet correct ; convention d'indentation déclarée.

- [ ] **Step 1: Renommer le projet dans `package.json`**

Remplacer la ligne `"name": "scaffold",` par :
```json
	"name": "yeu-bar-fishing",
```

- [ ] **Step 2: Créer `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = tab
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 3: Créer `src/vitest.d.ts` (augmentation des matchers jest-dom pour svelte-check)**

```ts
/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Vérifier que `npm run check` est vert**

Run: `npm run check`
Expected: 0 erreur (les matchers `toBeInTheDocument` se résolvent dans les `*.test.ts`).
> Si des avertissements préexistants subsistent sans rapport avec jest-dom, les noter mais ne pas élargir le périmètre.

- [ ] **Step 5: Commit**

```bash
git add package.json .editorconfig src/vitest.d.ts
git commit -m "chore(quality): nom projet, editorconfig et résolution des types jest-dom"
```

---

### Task 3: Icônes d'onglets + TabBar premium

**Files:**
- Create: `src/lib/components/icons/IconMoment.svelte`, `IconSavoir.svelte`, `IconCarnet.svelte`, `IconDuel.svelte`, `IconProfil.svelte`
- Modify: `src/lib/components/ui/TabBar.svelte`
- Modify: `src/lib/components/ui/TabBar.test.ts`

**Interfaces:**
- Consumes: tokens sémantiques (Task 1).
- Produces: 5 composants icône SVG (stroke `currentColor`, `viewBox 0 0 24 24`) ; `TabBar` rendant pour chaque onglet une icône + un label, l'onglet courant marqué `aria-current="page"` et stylé en accent.

- [ ] **Step 1: Créer les 5 icônes**

`src/lib/components/icons/IconMoment.svelte` (soleil sur l'eau) :
```svelte
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	<circle cx="12" cy="8.5" r="3" />
	<path d="M12 2.4v1.5M4.8 8.5H3.3M20.7 8.5h-1.5M6.6 3.5l1 1M17.4 3.5l-1 1" />
	<path d="M3 16.2c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2" />
	<path d="M3 20c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2" />
</svg>
```

`src/lib/components/icons/IconSavoir.svelte` (livre ouvert) :
```svelte
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	<path d="M12 6.4C10.4 5.2 7.8 4.7 4.8 5.1V18c3-0.4 5.6 0.1 7.2 1.3 1.6-1.2 4.2-1.7 7.2-1.3V5.1c-3-0.4-5.6 0.1-7.2 1.3Z" />
	<path d="M12 6.4v12.9" />
</svg>
```

`src/lib/components/icons/IconCarnet.svelte` (carnet à spirale) :
```svelte
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	<rect x="5" y="3.5" width="14" height="17" rx="2" />
	<path d="M9 3.5v17" />
	<path d="M12 8.5h4M12 12h4M12 15.5h2.5" />
</svg>
```

`src/lib/components/icons/IconDuel.svelte` (médaille à rubans) :
```svelte
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	<path d="M9 9.6 6.7 3.5M15 9.6 17.3 3.5" />
	<circle cx="12" cy="14.5" r="5" />
	<path d="M12 12.2l0.9 1.8 2 0.3-1.45 1.4 0.35 2L12 17.7l-1.8 0.95 0.35-2L9.1 14.3l2-0.3z" />
</svg>
```

`src/lib/components/icons/IconProfil.svelte` (personne) :
```svelte
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	<circle cx="12" cy="8" r="3.5" />
	<path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
</svg>
```

- [ ] **Step 2: Mettre à jour le test de la TabBar (échoue)**

Remplacer le contenu de `src/lib/components/ui/TabBar.test.ts` par :
```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import TabBar from './TabBar.svelte';

vi.mock('$app/stores', () => ({
	page: readable({ url: new URL('http://localhost/carnet') })
}));

describe('TabBar', () => {
	it('rend les 5 onglets avec leur label', () => {
		render(TabBar);
		expect(screen.getByText('Le moment')).toBeInTheDocument();
		expect(screen.getByText('Savoir')).toBeInTheDocument();
		expect(screen.getByText('Carnet')).toBeInTheDocument();
		expect(screen.getByText('Duel')).toBeInTheDocument();
		expect(screen.getByText('Profil')).toBeInTheDocument();
	});

	it('affiche une icône SVG dans chaque onglet', () => {
		render(TabBar);
		const liens = screen.getAllByRole('link');
		expect(liens).toHaveLength(5);
		for (const lien of liens) {
			expect(lien.querySelector('svg')).not.toBeNull();
		}
	});

	it("marque l'onglet courant (carnet) comme actif", () => {
		render(TabBar);
		const lien = screen.getByText('Carnet').closest('a');
		expect(lien?.getAttribute('aria-current')).toBe('page');
	});
});
```

- [ ] **Step 3: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/TabBar.test.ts`
Expected: FAIL — aucune `<svg>` dans les onglets (TabBar actuelle est texte seul).

- [ ] **Step 4: Réécrire `src/lib/components/ui/TabBar.svelte`**

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import IconMoment from '$lib/components/icons/IconMoment.svelte';
	import IconSavoir from '$lib/components/icons/IconSavoir.svelte';
	import IconCarnet from '$lib/components/icons/IconCarnet.svelte';
	import IconDuel from '$lib/components/icons/IconDuel.svelte';
	import IconProfil from '$lib/components/icons/IconProfil.svelte';

	const tabs = [
		{ href: '/', label: 'Le moment', icon: IconMoment },
		{ href: '/savoir', label: 'Savoir', icon: IconSavoir },
		{ href: '/carnet', label: 'Carnet', icon: IconCarnet },
		{ href: '/duel', label: 'Duel', icon: IconDuel },
		{ href: '/profil', label: 'Profil', icon: IconProfil }
	];

	const isActive = (href: string, path: string) =>
		href === '/' ? path === '/' : path.startsWith(href);
</script>

<nav class="tabbar" aria-label="Navigation principale">
	{#each tabs as tab (tab.href)}
		{@const active = isActive(tab.href, $page.url.pathname)}
		{@const Icon = tab.icon}
		<a
			href={tab.href}
			class="tab"
			class:active
			aria-current={active ? 'page' : undefined}
		>
			<span class="tab-icon"><Icon /></span>
			<span class="tab-label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		background: var(--surface-raised);
		border-top: 1px solid var(--border-subtle);
		padding-bottom: env(safe-area-inset-bottom);
		box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.25);
		z-index: 10;
	}
	.tab {
		position: relative;
		flex: 1;
		min-height: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--motion-dur-fast) var(--motion-ease-out);
	}
	.tab-icon {
		width: 24px;
		height: 24px;
		display: block;
	}
	.tab-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
	.tab-label {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-wide);
	}
	.tab.active {
		color: var(--accent);
	}
	.tab.active .tab-label {
		font-weight: 600;
	}
	.tab.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 22px;
		height: 2px;
		background: var(--accent);
		border-radius: var(--radius-full);
	}
</style>
```

- [ ] **Step 5: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/TabBar.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/icons src/lib/components/ui/TabBar.svelte src/lib/components/ui/TabBar.test.ts
git commit -m "feat(nav): TabBar avec jeu d'icônes SVG maison et état actif soigné"
```

---

### Task 4: Élévation des primitives Button & Card

**Files:**
- Modify: `src/lib/components/ui/Button.svelte`
- Modify: `src/lib/components/ui/Button.test.ts`
- Modify: `src/lib/components/ui/Card.svelte`
- Create: `src/lib/components/ui/Card.test.ts`

**Interfaces:**
- Consumes: tokens sémantiques (Task 1).
- Produces :
  - `Button` props : `variant?: 'primary' | 'ghost'` (défaut `primary`), `size?: 'sm' | 'md'` (défaut `md`), `type?: 'button' | 'submit'`, `disabled?: boolean`, `children?: Snippet`, `onclick?`. Hauteur ≥ 44px. Classe = `btn {variant} {size}`.
  - `Card` props : `variant?: 'raised' | 'inset'` (défaut `raised`), `children?: Snippet`. Classe = `card {variant}`.

- [ ] **Step 1: Mettre à jour le test du Button (échoue sur la taille)**

Remplacer le contenu de `src/lib/components/ui/Button.test.ts` par :
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
	it('rend un élément bouton', () => {
		render(Button);
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('applique la variante primary et la taille md par défaut', () => {
		render(Button);
		const btn = screen.getByRole('button');
		expect(btn.className).toContain('primary');
		expect(btn.className).toContain('md');
	});

	it('applique la taille sm quand demandée', () => {
		render(Button, { props: { size: 'sm' } });
		expect(screen.getByRole('button').className).toContain('sm');
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/Button.test.ts`
Expected: FAIL — la classe ne contient pas `md`/`sm` (props `size` absente).

- [ ] **Step 3: Réécrire `src/lib/components/ui/Button.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		children,
		onclick
	}: {
		variant?: 'primary' | 'ghost';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		disabled?: boolean;
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
	} = $props();
</script>

<button class="btn {variant} {size}" {type} {disabled} {onclick}>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 0 var(--space-6);
		border-radius: var(--radius-md);
		font: inherit;
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			transform var(--motion-dur-fast) var(--motion-ease-out),
			background var(--motion-dur-fast) var(--motion-ease-out),
			box-shadow var(--motion-dur-fast) var(--motion-ease-out);
	}
	.btn.sm {
		min-height: 44px;
		padding: 0 var(--space-4);
		font-size: var(--text-sm);
	}
	.btn:active {
		transform: scale(0.97);
	}
	.btn.primary {
		background: var(--accent);
		color: var(--surface-base);
		box-shadow: var(--elevation-1);
	}
	.btn.primary:active {
		box-shadow: none;
	}
	.btn.ghost {
		background: transparent;
		color: var(--text-primary);
		border-color: var(--border-strong);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
</style>
```

- [ ] **Step 4: Lancer et vérifier le succès du Button**

Run: `npm test -- run src/lib/components/ui/Button.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Écrire le test de la Card (échoue)**

Create `src/lib/components/ui/Card.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Card from './Card.svelte';

describe('Card', () => {
	it('applique la variante raised par défaut', () => {
		const { container } = render(Card);
		const card = container.querySelector('.card');
		expect(card).not.toBeNull();
		expect(card?.classList.contains('raised')).toBe(true);
	});

	it('applique la variante inset quand demandée', () => {
		const { container } = render(Card, { props: { variant: 'inset' } });
		expect(container.querySelector('.card')?.classList.contains('inset')).toBe(true);
	});
});
```

- [ ] **Step 6: Lancer et vérifier l'échec de la Card**

Run: `npm test -- run src/lib/components/ui/Card.test.ts`
Expected: FAIL — la classe `raised` n'existe pas encore.

- [ ] **Step 7: Réécrire `src/lib/components/ui/Card.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { variant = 'raised', children }: {
		variant?: 'raised' | 'inset';
		children?: Snippet;
	} = $props();
</script>

<div class="card {variant}">{@render children?.()}</div>

<style>
	.card {
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	.card.raised {
		background: var(--surface-overlay);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-2);
	}
	.card.inset {
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid var(--border-subtle);
	}
</style>
```

- [ ] **Step 8: Lancer et vérifier le succès de la Card**

Run: `npm test -- run src/lib/components/ui/Card.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add src/lib/components/ui/Button.svelte src/lib/components/ui/Button.test.ts src/lib/components/ui/Card.svelte src/lib/components/ui/Card.test.ts
git commit -m "feat(ui): Button (tailles + motion) et Card (variantes) sur tokens sémantiques"
```

---

### Task 5: Types partagés + composant StatTile

**Files:**
- Create: `src/lib/types/conditions.ts`
- Create: `src/lib/components/ui/StatTile.svelte`
- Create: `src/lib/components/ui/StatTile.test.ts`

**Interfaces:**
- Consumes: tokens (Task 1).
- Produces :
  - Types : `TidePoint`, `ScoreFactor`, `StatData`, `MomentData` (utilisés par Tasks 6–8).
  - `StatTile` props : `value: string | number`, `unit?: string`, `label: string`, `icon?: Snippet`. Rend valeur (tabulaire) + unité + label.

- [ ] **Step 1: Créer les types partagés `src/lib/types/conditions.ts`**

```ts
export interface TidePoint {
	/** Heure locale "HH:MM". */
	t: string;
	/** Hauteur d'eau en mètres. */
	height: number;
	/** Étale marquée (pleine/basse mer). */
	type?: 'high' | 'low';
}

export interface ScoreFactor {
	label: string;
	/** Contribution normalisée 0..1. */
	weight: number;
}

export interface StatData {
	label: string;
	value: string;
	unit?: string;
}

export interface MomentData {
	spot: string;
	date: string;
	score: number;
	scoreWhy: string;
	factors: ScoreFactor[];
	tide: {
		points: TidePoint[];
		/** Position de « maintenant » sur la courbe, 0..1. */
		nowFraction: number;
		coefficient: number;
		nextEtale: string;
	};
	stats: StatData[];
	tip: { title: string; body: string };
	windows: { label: string; time: string }[];
}
```

- [ ] **Step 2: Écrire le test de StatTile (échoue)**

Create `src/lib/components/ui/StatTile.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatTile from './StatTile.svelte';

describe('StatTile', () => {
	it('rend la valeur, l\'unité et le label', () => {
		render(StatTile, { props: { value: '15', unit: 'nds', label: 'Vent' } });
		expect(screen.getByText('15')).toBeInTheDocument();
		expect(screen.getByText('nds')).toBeInTheDocument();
		expect(screen.getByText('Vent')).toBeInTheDocument();
	});

	it('fonctionne sans unité', () => {
		render(StatTile, { props: { value: 'Belle', label: 'Mer' } });
		expect(screen.getByText('Belle')).toBeInTheDocument();
		expect(screen.getByText('Mer')).toBeInTheDocument();
	});
});
```

- [ ] **Step 3: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/StatTile.test.ts`
Expected: FAIL — `StatTile.svelte` introuvable.

- [ ] **Step 4: Implémenter `src/lib/components/ui/StatTile.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { value, unit = '', label, icon }: {
		value: string | number;
		unit?: string;
		label: string;
		icon?: Snippet;
	} = $props();
</script>

<div class="stat">
	{#if icon}<span class="stat-icon">{@render icon()}</span>{/if}
	<span class="stat-value tabular-nums">
		<span class="stat-number">{value}</span>{#if unit}<span class="stat-unit">{unit}</span>{/if}
	</span>
	<span class="stat-label">{label}</span>
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		min-width: 0;
	}
	.stat-icon {
		width: 20px;
		height: 20px;
		color: var(--accent);
		margin-bottom: var(--space-1);
	}
	.stat-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
	.stat-value {
		font-size: var(--text-xl);
		font-weight: 600;
		line-height: 1;
		color: var(--text-primary);
	}
	.stat-unit {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		margin-left: 2px;
	}
	.stat-label {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
	}
</style>
```

- [ ] **Step 5: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/StatTile.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types/conditions.ts src/lib/components/ui/StatTile.svelte src/lib/components/ui/StatTile.test.ts
git commit -m "feat(ui): types conditions partagés + composant StatTile"
```

---

### Task 6: Composant TideCurve (courbe de marée SVG animée)

**Files:**
- Create: `src/lib/components/ui/TideCurve.svelte`
- Create: `src/lib/components/ui/TideCurve.test.ts`

**Interfaces:**
- Consumes: `TidePoint` (Task 5), tokens (Task 1).
- Produces : `TideCurve` props : `points: TidePoint[]`, `nowFraction?: number` (0..1, défaut 0.5), `coefficient: number`. Rend une courbe SVG, les étales (heure + hauteur), un repère « maintenant » (`data-now`), et la valeur du coefficient.

- [ ] **Step 1: Écrire le test de TideCurve (échoue)**

Create `src/lib/components/ui/TideCurve.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TideCurve from './TideCurve.svelte';
import type { TidePoint } from '$lib/types/conditions';

const points: TidePoint[] = [
	{ t: '04:12', height: 1.1, type: 'low' },
	{ t: '07:30', height: 2.8 },
	{ t: '10:36', height: 5.2, type: 'high' },
	{ t: '13:40', height: 2.9 },
	{ t: '16:48', height: 1.0, type: 'low' }
];

describe('TideCurve', () => {
	it('affiche les heures des étales', () => {
		render(TideCurve, { props: { points, nowFraction: 0.4, coefficient: 95 } });
		expect(screen.getByText('04:12')).toBeInTheDocument();
		expect(screen.getByText('10:36')).toBeInTheDocument();
		expect(screen.getByText('16:48')).toBeInTheDocument();
	});

	it('affiche la valeur du coefficient', () => {
		render(TideCurve, { props: { points, nowFraction: 0.4, coefficient: 95 } });
		expect(screen.getByText('95')).toBeInTheDocument();
	});

	it('rend un repère « maintenant »', () => {
		const { container } = render(TideCurve, { props: { points, nowFraction: 0.4, coefficient: 95 } });
		expect(container.querySelector('[data-now]')).not.toBeNull();
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/TideCurve.test.ts`
Expected: FAIL — `TideCurve.svelte` introuvable.

- [ ] **Step 3: Implémenter `src/lib/components/ui/TideCurve.svelte`**

```svelte
<script lang="ts">
	import type { TidePoint } from '$lib/types/conditions';

	let { points, nowFraction = 0.5, coefficient }: {
		points: TidePoint[];
		nowFraction?: number;
		coefficient: number;
	} = $props();

	const W = 320;
	const H = 130;
	const PAD_X = 14;
	const PAD_TOP = 18;
	const PAD_BOTTOM = 26;

	const heights = points.map((p) => p.height);
	const min = Math.min(...heights);
	const max = Math.max(...heights);
	const span = max - min || 1;

	const xAt = (i: number) =>
		PAD_X + (points.length > 1 ? (i / (points.length - 1)) * (W - PAD_X * 2) : 0);
	const yAt = (h: number) =>
		PAD_TOP + (1 - (h - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

	const linePath = points
		.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(p.height).toFixed(1)}`)
		.join(' ');
	const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(1)} ${H} L${xAt(0).toFixed(1)} ${H} Z`;

	const clampedNow = Math.max(0, Math.min(1, nowFraction));
	const nowPos = clampedNow * (points.length - 1);
	const i0 = Math.floor(nowPos);
	const i1 = Math.min(i0 + 1, points.length - 1);
	const frac = nowPos - i0;
	const nowHeight = points[i0].height + (points[i1].height - points[i0].height) * frac;
	const nowX = xAt(i0) + (xAt(i1) - xAt(i0)) * frac;
	const nowY = yAt(nowHeight);

	const etales = points
		.map((p, i) => ({ ...p, i }))
		.filter((p) => p.type);
</script>

<figure class="tide">
	<figcaption class="tide-coef">
		<span class="tide-coef-label">Coefficient</span>
		<span class="tide-coef-value tabular-nums">{coefficient}</span>
	</figcaption>

	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="Courbe de marée du jour">
		<defs>
			<linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22" />
				<stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
			</linearGradient>
		</defs>

		<path d={areaPath} fill="url(#tide-fill)" stroke="none" />
		<path
			class="tide-line"
			d={linePath}
			fill="none"
			stroke="var(--accent)"
			stroke-width="2"
			stroke-linecap="round"
			pathLength="1"
		/>

		{#each etales as e (e.i)}
			<circle cx={xAt(e.i)} cy={yAt(e.height)} r="3" fill="var(--accent-soft)" />
		{/each}

		<line
			data-now
			x1={nowX}
			y1={PAD_TOP - 6}
			x2={nowX}
			y2={H - PAD_BOTTOM}
			stroke="var(--text-faint)"
			stroke-width="1"
			stroke-dasharray="3 3"
		/>
		<circle data-now-dot cx={nowX} cy={nowY} r="4" fill="var(--text-primary)" />
	</svg>

	<ul class="tide-etales">
		{#each etales as e (e.i)}
			<li class="tide-etale">
				<span class="tide-etale-kind">{e.type === 'high' ? 'PM' : 'BM'}</span>
				<span class="tide-etale-time tabular-nums">{e.t}</span>
				<span class="tide-etale-h tabular-nums">{e.height.toFixed(1)} m</span>
			</li>
		{/each}
	</ul>
</figure>

<style>
	.tide {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.tide-coef {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}
	.tide-coef-label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-faint);
	}
	.tide-coef-value {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--accent);
	}
	svg {
		width: 100%;
		height: 130px;
		display: block;
	}
	.tide-line {
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
		animation: draw var(--motion-dur-slow) var(--motion-ease-out) both;
	}
	@keyframes draw {
		from { stroke-dashoffset: 1; }
		to { stroke-dashoffset: 0; }
	}
	.tide-etales {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}
	.tide-etale {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.tide-etale-kind {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		color: var(--accent-soft);
	}
	.tide-etale-h { color: var(--text-faint); }
</style>
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/TideCurve.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/TideCurve.svelte src/lib/components/ui/TideCurve.test.ts
git commit -m "feat(ui): TideCurve — courbe de marée SVG animée avec étales et repère maintenant"
```

---

### Task 7: Composant ScoreGauge (jauge de score explicable)

**Files:**
- Create: `src/lib/components/ui/ScoreGauge.svelte`
- Create: `src/lib/components/ui/ScoreGauge.test.ts`

**Interfaces:**
- Consumes: `ScoreFactor` (Task 5), tokens (Task 1).
- Produces : `ScoreGauge` props : `score: number` (clampé 0..100, arrondi), `factors: ScoreFactor[]`, `label?: string`. Rend l'arc SVG, le grand nombre, le libellé qualitatif (Faible <25, Moyen 25–49, Favorable 50–74, Très favorable ≥75) et la liste des facteurs.

- [ ] **Step 1: Écrire le test de ScoreGauge (échoue)**

Create `src/lib/components/ui/ScoreGauge.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ScoreGauge from './ScoreGauge.svelte';

describe('ScoreGauge', () => {
	it('clampe et arrondit le score entre 0 et 100', () => {
		render(ScoreGauge, { props: { score: 130, factors: [] } });
		expect(screen.getByText('100')).toBeInTheDocument();
	});

	it('clampe les scores négatifs à 0', () => {
		render(ScoreGauge, { props: { score: -10, factors: [] } });
		expect(screen.getByText('0')).toBeInTheDocument();
	});

	it('affiche le libellé qualitatif selon le seuil', () => {
		render(ScoreGauge, { props: { score: 80, factors: [] } });
		expect(screen.getByText('Très favorable')).toBeInTheDocument();
	});

	it('rend chaque facteur contributeur', () => {
		render(ScoreGauge, {
			props: { score: 60, factors: [{ label: 'Marée', weight: 0.8 }, { label: 'Lune', weight: 0.4 }] }
		});
		expect(screen.getByText('Marée')).toBeInTheDocument();
		expect(screen.getByText('Lune')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/ScoreGauge.test.ts`
Expected: FAIL — `ScoreGauge.svelte` introuvable.

- [ ] **Step 3: Implémenter `src/lib/components/ui/ScoreGauge.svelte`**

```svelte
<script lang="ts">
	import type { ScoreFactor } from '$lib/types/conditions';

	let { score, factors, label }: {
		score: number;
		factors: ScoreFactor[];
		label?: string;
	} = $props();

	const clamped = Math.max(0, Math.min(100, Math.round(score)));

	function qualitative(s: number): string {
		if (s >= 75) return 'Très favorable';
		if (s >= 50) return 'Favorable';
		if (s >= 25) return 'Moyen';
		return 'Faible';
	}
	const tierLabel = label ?? qualitative(clamped);
	const tierColor =
		clamped >= 75 ? 'var(--score-high)' : clamped >= 25 ? 'var(--score-mid)' : 'var(--score-low)';

	// Géométrie de l'arc (270°, ouverture en bas)
	const CX = 80;
	const CY = 80;
	const R = 62;
	const START = -135;
	const SWEEP = 270;

	function polar(deg: number): [number, number] {
		const rad = ((deg - 90) * Math.PI) / 180;
		return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
	}
	function arc(fromDeg: number, toDeg: number): string {
		const [sx, sy] = polar(fromDeg);
		const [ex, ey] = polar(toDeg);
		const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
		return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${R} ${R} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
	}
	const trackPath = arc(START, START + SWEEP);
	const fill = clamped / 100;

	const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
</script>

<div class="gauge">
	<div class="gauge-dial">
		<svg viewBox="0 0 160 160" role="img" aria-label={`Score de pêche ${clamped} sur 100 — ${tierLabel}`}>
			<path d={trackPath} fill="none" stroke="var(--border-strong)" stroke-width="10" stroke-linecap="round" />
			<path
				class="gauge-fg"
				d={trackPath}
				fill="none"
				stroke={tierColor}
				stroke-width="10"
				stroke-linecap="round"
				pathLength="1"
				style="--fill:{fill}"
			/>
		</svg>
		<div class="gauge-center">
			<span class="gauge-score tabular-nums">{clamped}</span>
			<span class="gauge-tier" style="color:{tierColor}">{tierLabel}</span>
		</div>
	</div>

	{#if factors.length}
		<ul class="factors">
			{#each factors as f (f.label)}
				<li class="factor">
					<span class="factor-label">{f.label}</span>
					<span class="factor-bar">
						<span class="factor-fill" style="width:{Math.round(clamp01(f.weight) * 100)}%"></span>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.gauge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
	}
	.gauge-dial {
		position: relative;
		width: 200px;
		max-width: 60vw;
		aspect-ratio: 1;
	}
	.gauge-dial svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.gauge-fg {
		stroke-dasharray: 1;
		stroke-dashoffset: calc(1 - var(--fill));
		animation: gauge-draw var(--motion-dur-slow) var(--motion-ease-out) both;
	}
	@keyframes gauge-draw {
		from { stroke-dashoffset: 1; }
		to { stroke-dashoffset: calc(1 - var(--fill)); }
	}
	.gauge-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
	}
	.gauge-score {
		font-family: var(--font-display);
		font-size: var(--text-score);
		font-weight: 600;
		line-height: 1;
		color: var(--text-primary);
	}
	.gauge-tier {
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
	}
	.factors {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.factor {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		align-items: center;
		gap: var(--space-4);
	}
	.factor-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.factor-bar {
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--border-subtle);
		overflow: hidden;
	}
	.factor-fill {
		display: block;
		height: 100%;
		border-radius: var(--radius-full);
		background: var(--accent);
		transform-origin: left;
		animation: factor-grow var(--motion-dur-base) var(--motion-ease-out) both;
	}
	@keyframes factor-grow {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}
</style>
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/ScoreGauge.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/ScoreGauge.svelte src/lib/components/ui/ScoreGauge.test.ts
git commit -m "feat(ui): ScoreGauge — jauge de score explicable avec facteurs contributeurs"
```

---

### Task 8: Données factices + écran vitrine « Le moment »

**Files:**
- Create: `src/lib/data/mock-moment.ts`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `MomentData` (Task 5), `ScoreGauge` (Task 7), `TideCurve` (Task 6), `StatTile` (Task 5), `Card` (Task 4).
- Produces : la route `/` affiche l'écran « Le moment » composé sur données factices.

- [ ] **Step 1: Créer le module de données factices `src/lib/data/mock-moment.ts`**

```ts
import type { MomentData } from '$lib/types/conditions';

/**
 * ⚠️ DONNÉES FACTICES DE DÉMONSTRATION.
 * Servent uniquement à éprouver le design de l'écran « Le moment ».
 * À remplacer par le moteur de conditions réel (marées + météo + lune + score) au Plan 3.
 * Aucun appel réseau ici.
 */
export const mockMoment: MomentData = {
	spot: "Île d'Yeu · Port-Joinville",
	date: 'Mercredi 18 juin',
	score: 78,
	scoreWhy:
		'Gros coefficient (95), étale de pleine mer au lever du jour et vent de NO modéré : conditions très favorables au bar.',
	factors: [
		{ label: 'Coefficient', weight: 0.95 },
		{ label: 'Phase de marée', weight: 0.85 },
		{ label: 'Aube / crépuscule', weight: 0.8 },
		{ label: 'Vent & mer', weight: 0.6 },
		{ label: 'Lune', weight: 0.5 },
		{ label: 'Saison', weight: 0.85 }
	],
	tide: {
		points: [
			{ t: '04:12', height: 1.1, type: 'low' },
			{ t: '07:24', height: 2.8 },
			{ t: '10:36', height: 5.2, type: 'high' },
			{ t: '13:40', height: 2.9 },
			{ t: '16:48', height: 1.0, type: 'low' },
			{ t: '20:02', height: 3.0 },
			{ t: '22:54', height: 5.0, type: 'high' }
		],
		nowFraction: 0.34,
		coefficient: 95,
		nextEtale: 'Pleine mer à 10:36'
	},
	stats: [
		{ label: 'Vent', value: '15', unit: 'nds NO' },
		{ label: 'Mer', value: 'Belle', unit: '' },
		{ label: 'Lune', value: '34', unit: '%' },
		{ label: 'Eau', value: '18', unit: '°C' }
	],
	tip: {
		title: 'Conseil du jour',
		body: "À l'étale de pleine mer, privilégie un leurre de surface (stickbait) au lever du jour le long des roches de la Pointe du But : par mer belle, le bar chasse en surface."
	},
	windows: [
		{ label: 'Lever du soleil', time: '06:12' },
		{ label: 'Étale pleine mer', time: '10:36' },
		{ label: 'Étale basse mer', time: '16:48' },
		{ label: 'Coucher du soleil', time: '22:01' }
	]
};
```

- [ ] **Step 2: Réécrire `src/routes/+page.svelte`**

```svelte
<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import ScoreGauge from '$lib/components/ui/ScoreGauge.svelte';
	import TideCurve from '$lib/components/ui/TideCurve.svelte';
	import StatTile from '$lib/components/ui/StatTile.svelte';
	import { mockMoment as m } from '$lib/data/mock-moment';
</script>

<header class="moment-header">
	<p class="moment-spot">{m.spot}</p>
	<h1 class="moment-date">{m.date}</h1>
</header>

<section class="moment-hero" aria-labelledby="score-title">
	<h2 id="score-title" class="visually-hidden">Score de pêche</h2>
	<ScoreGauge score={m.score} factors={m.factors} />
	<p class="moment-why">{m.scoreWhy}</p>
</section>

<Card>
	<div class="block-head">
		<h2>Marée</h2>
		<span class="block-aside">{m.tide.nextEtale}</span>
	</div>
	<TideCurve points={m.tide.points} nowFraction={m.tide.nowFraction} coefficient={m.tide.coefficient} />
</Card>

<section class="stats" aria-label="Conditions">
	{#each m.stats as s (s.label)}
		<Card variant="inset">
			<StatTile value={s.value} unit={s.unit} label={s.label} />
		</Card>
	{/each}
</section>

<Card>
	<div class="block-head">
		<h2>{m.tip.title}</h2>
	</div>
	<p class="tip-body">{m.tip.body}</p>
</Card>

<Card>
	<div class="block-head">
		<h2>Fenêtres conseillées</h2>
	</div>
	<ul class="windows">
		{#each m.windows as w (w.label)}
			<li class="window">
				<span class="window-label">{w.label}</span>
				<span class="window-time tabular-nums">{w.time}</span>
			</li>
		{/each}
	</ul>
</Card>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.moment-spot {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.moment-date {
		font-size: var(--text-2xl);
		color: var(--text-primary);
	}
	/* Marge basse renforcée sous le héro (le gap du shell gère le reste) */
	.moment-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		margin: var(--space-4) 0 var(--space-6);
	}
	.moment-why {
		text-align: center;
		font-size: var(--text-base);
		line-height: var(--leading-snug);
		color: var(--text-secondary);
		max-width: 32ch;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}
	.block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}
	.block-head h2 {
		font-size: var(--text-xl);
	}
	.block-aside {
		font-size: var(--text-sm);
		color: var(--accent-soft);
		white-space: nowrap;
	}
	.tip-body {
		font-size: var(--text-base);
		line-height: var(--leading-normal);
		color: var(--text-secondary);
	}
	.windows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.window {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	.window:last-child {
		border-bottom: none;
	}
	.window-label {
		color: var(--text-secondary);
	}
	.window-time {
		font-weight: 600;
		color: var(--text-primary);
	}
</style>
```

- [ ] **Step 3: Ajouter l'espacement vertical des sections dans le shell**

Modifier `src/routes/+layout.svelte` pour espacer les blocs de la page. Remplacer le bloc `<style>` par :
```svelte
<style>
	.app-shell { min-height: 100dvh; }
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-4);
		padding-top: max(var(--space-6), env(safe-area-inset-top));
		padding-bottom: calc(72px + env(safe-area-inset-bottom));
		max-width: 640px;
		margin: 0 auto;
	}
</style>
```
> Le `gap` du `main` gère l'espacement vertical entre les blocs ; seul le héro garde une marge propre (Step 2). Ajuster finement au preview (Step 5) si besoin.

- [ ] **Step 4: Vérifier build + suite + check**

Run: `npm test -- run && npm run build && npm run check`
Expected: tests PASS, build OK, check 0 erreur.

- [ ] **Step 5: Vérification visuelle (manuel)**

Run: `npm run preview`
Ouvrir l'URL en vue mobile (DevTools responsive, iPhone). Vérifier : fond de profondeur, jauge de score animée + facteurs, courbe de marée animée, tuiles de conditions, conseil, fenêtres ; TabBar avec icônes ; pas de flash bleu au tap ; safe areas. Ajuster les espacements si nécessaire (voir note Step 3).

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/mock-moment.ts src/routes/+page.svelte src/routes/+layout.svelte
git commit -m "feat(moment): écran « Le moment » vitrine sur données factices (score, marée, conditions)"
```

---

### Task 9: Placeholders soignés (composant partagé) + vérification finale

**Files:**
- Create: `src/lib/components/ui/PagePlaceholder.svelte`, `src/lib/components/ui/PagePlaceholder.test.ts`
- Modify: `src/routes/savoir/+page.svelte`, `src/routes/carnet/+page.svelte`, `src/routes/duel/+page.svelte`, `src/routes/profil/+page.svelte`

**Interfaces:**
- Consumes: `Card` (Task 4).
- Produces : `PagePlaceholder` props : `kicker: string`, `title: string`, `body: string`. Rend un en-tête éditorial (kicker + titre) + une `Card` contenant le texte « à venir ». Les 4 écrans secondaires l'utilisent (DRY — pas de style dupliqué).

- [ ] **Step 1: Écrire le test de PagePlaceholder (échoue)**

Create `src/lib/components/ui/PagePlaceholder.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PagePlaceholder from './PagePlaceholder.svelte';

describe('PagePlaceholder', () => {
	it('rend le kicker, le titre et le corps', () => {
		render(PagePlaceholder, {
			props: { kicker: 'Bibliothèque', title: 'Savoir', body: 'Bientôt disponible.' }
		});
		expect(screen.getByText('Bibliothèque')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Savoir' })).toBeInTheDocument();
		expect(screen.getByText('Bientôt disponible.')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/components/ui/PagePlaceholder.test.ts`
Expected: FAIL — `PagePlaceholder.svelte` introuvable.

- [ ] **Step 3: Implémenter `src/lib/components/ui/PagePlaceholder.svelte`**

```svelte
<script lang="ts">
	import Card from './Card.svelte';

	let { kicker, title, body }: {
		kicker: string;
		title: string;
		body: string;
	} = $props();
</script>

<header class="page-header">
	<p class="page-kicker">{kicker}</p>
	<h1>{title}</h1>
</header>

<Card>
	<p class="coming">{body}</p>
</Card>

<style>
	.page-header {
		margin-bottom: var(--space-2);
	}
	.page-kicker {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.page-header h1 {
		font-size: var(--text-2xl);
	}
	.coming {
		color: var(--text-secondary);
		line-height: var(--leading-normal);
	}
</style>
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/components/ui/PagePlaceholder.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Réécrire les 4 écrans secondaires via le composant**

`src/routes/savoir/+page.svelte` :
```svelte
<script lang="ts">
	import PagePlaceholder from '$lib/components/ui/PagePlaceholder.svelte';
</script>

<PagePlaceholder
	kicker="Bibliothèque"
	title="Savoir"
	body="Techniques, montages illustrés, stratégies et réglementation — bientôt disponibles, en fiches interactives et quiz."
/>
```

`src/routes/carnet/+page.svelte` :
```svelte
<script lang="ts">
	import PagePlaceholder from '$lib/components/ui/PagePlaceholder.svelte';
</script>

<PagePlaceholder
	kicker="Prises & records"
	title="Carnet"
	body="La saisie de vos prises, la capture automatique des conditions et vos records arrivent bientôt."
/>
```

`src/routes/duel/+page.svelte` :
```svelte
<script lang="ts">
	import PagePlaceholder from '$lib/components/ui/PagePlaceholder.svelte';
</script>

<PagePlaceholder
	kicker="Classement amical"
	title="Duel"
	body="Le classement, les badges et les défis hebdomadaires entre pêcheurs arrivent bientôt."
/>
```

`src/routes/profil/+page.svelte` :
```svelte
<script lang="ts">
	import PagePlaceholder from '$lib/components/ui/PagePlaceholder.svelte';
</script>

<PagePlaceholder
	kicker="Compte"
	title="Profil"
	body="Votre compte, vos records, vos badges et les réglages arriveront avec l'authentification (Plan 2)."
/>
```

- [ ] **Step 6: Vérification finale complète**

Run: `npm test -- run && npm run build && npm run check`
Expected: tous les tests PASS (tokens 5, Button 3, Card 2, TabBar 3, StatTile 2, TideCurve 3, ScoreGauge 4, PagePlaceholder 1, db 1, smoke 1 = 25), build OK, check 0 erreur.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/ui/PagePlaceholder.svelte src/lib/components/ui/PagePlaceholder.test.ts src/routes/savoir/+page.svelte src/routes/carnet/+page.svelte src/routes/duel/+page.svelte src/routes/profil/+page.svelte
git commit -m "feat(ui): PagePlaceholder partagé + écrans Savoir/Carnet/Duel/Profil cohérents"
```

---

## Self-Review

**1. Spec coverage :**
- Direction « Abysse & laiton » (spec §3) → Task 1 (gradient-depth, contraste, sobriété) + tous les composants ✅
- Architecture tokens 2 couches (spec §4) → Task 1 ✅
- Polish web-app mobile (spec §5) → Task 1 (tap-highlight, text-size-adjust, overscroll, selection, scrollbar, svh/dvh, safe-areas) ✅
- Composants signature (spec §6) : ScoreGauge → Task 7 ; TideCurve → Task 6 ; StatTile → Task 5 ; icônes + TabBar → Task 3 ; Button/Card → Task 4 ✅
- Écran vitrine « Le moment » + mock isolé (spec §7) → Task 8 ✅
- Placeholders soignés (spec §7) → Task 9 ✅
- Qualité/dette : name, editorconfig, color-mix supprimé (Task 3 utilise `--surface-raised` solide), fix svelte-check (spec §8) → Tasks 2 & 3 ✅
- Tests (spec §9) → tests dans chaque task ; récap final Task 9 Step 5 ✅
- Hors périmètre Plans 2–7 (spec §10) → aucune API/auth/persistance ; données factices isolées dans `mock-moment.ts` ✅

**2. Placeholder scan :** Chaque step de code contient le code complet. Les pages « bientôt disponibles » sont des placeholders **produit assumés** (contenu livré aux plans dédiés), pas des trous de plan.

**3. Type consistency :** `TidePoint`/`ScoreFactor`/`StatData`/`MomentData` définis en Task 5, consommés à l'identique en Tasks 6–8. `cssVar` inchangé ; CSS vars nommées `--<groupe>-<clé>` cohérentes avec sa sortie (vérifié pour `text.2xl`, `motion.easeOut`, `radius.md`). Props `Button`/`Card`/`StatTile`/`TideCurve`/`ScoreGauge`/`TabBar` cohérentes entre tests et implémentations. Svelte 5 (`$props`, `Snippet`, `{@render}`, `{@const Icon = …}`) uniforme.

**Note d'exécution :** la suppression de `color-mix()` (dette handoff §6) est réalisée en Task 3 (la TabBar passe à `--surface-raised`, couleur solide). Le repli `color-mix` n'est donc plus nécessaire.
