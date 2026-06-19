# Plan 3 — Moteur Conditions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doter l'app du moteur de conditions de l'île d'Yeu (marées + coefficient, lune/soleil, météo/mer, score de pêche explicable) et câbler l'écran « Le moment » avec ces données réelles, le tout offline-friendly et sans clé d'API.

**Architecture:** Cinq modules à responsabilité unique. Marées et lune sont **déterministes** (calcul local, offline) ; la météo est la seule dépendance réseau (Open-Meteo, sans clé), mise en cache pour l'offline. Le prédicteur de marée consomme un **JSON de constituantes** (interface stable) dérivé par analyse harmonique d'une série marégraphique **REFMAR Port-Joinville** (Licence Ouverte 2.0). Le score est une **fonction pure et explicable** (contributions signées). L'orchestrateur `conditions` assemble le tout en un objet `DayConditions` consommé par l'UI.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript strict, Drizzle + better-sqlite3, **suncalc** (lune/soleil, MIT), **@neaps/tide-predictor** (prédiction harmonique, MIT), `fetch` natif (Open-Meteo), Vitest. Outil de prep one-time pour l'analyse harmonique (`utide`/`pytides`, hors runtime).

## Global Constraints

- **Langue de l'UI** : français.
- **APIs gratuites uniquement, sans clé** : Open-Meteo (météo/mer) ; aucune API marées au runtime (calcul local).
- **Offline** : marées + lune calculées localement à tout instant ; météo servie depuis le cache si réseau absent, avec indication de fraîcheur.
- **Pas de cron** en v1 ; **spot = constante** `ILE_DYEU` (pas de table `spot`).
- **Données marées** : constituantes dérivées de **REFMAR/SONEL** (Licence Ouverte 2.0, rediffusable) ; **ne jamais committer de constantes SHOM** (non rediffusables). Métadonnées (source/station/période/licence) dans le JSON.
- **Score explicable** : toujours `value` (0–100) **+** `factors[]` (contributions signées affichables) ; pondérations par défaut documentées, jamais boîte noire.
- **Design = single source of truth** : tout style dérive des tokens ; composants signature (courbe de marée, jauge de score) via la skill `frontend-design`. Aucune valeur en dur.
- **Server-only** : tout accès DB/réseau sous `src/lib/server/**`. Types purs partageables sous `src/lib/conditions/**`.
- **TypeScript strict** ; **Node ≥ 20** ; **npm**.
- **Zéro régression** : suite existante verte ; `npm run check` 0 erreur / 0 warning ; `npm run build` OK.

---

## File Structure

```
src/
├── lib/
│   ├── conditions/
│   │   └── types.ts                         (CREATE : types purs partagés UI/serveur)
│   └── server/conditions/
│       ├── spot.ts                          (CREATE : constante ILE_DYEU)
│       ├── moon.ts                          (CREATE : wrapper suncalc) + moon.test.ts
│       ├── tide.ts                          (CREATE : prédicteur harmonique) + tide.test.ts
│       ├── weather.ts                       (CREATE : client Open-Meteo + cache) + weather.test.ts
│       ├── score.ts                         (CREATE : score pur explicable) + score.test.ts
│       ├── conditions.ts                    (CREATE : orchestrateur) + conditions.test.ts
│       └── data/
│           └── port-joinville.constituents.json   (CREATE : Task 4, via spike REFMAR)
├── lib/server/db/schema.ts                  (MODIFY : table conditions_cache)
├── routes/(app)/+page.svelte                (MODIFY : câblage « Le moment »)
└── routes/(app)/+page.server.ts             (CREATE : load DayConditions)
scripts/
└── fit-tide-constituents.mjs (ou .py)       (CREATE : Task 4, prep one-time analyse harmonique)
drizzle/                                      (migration conditions_cache)
package.json                                  (MODIFY : deps suncalc, @neaps/tide-predictor)
```

> **Note route-group `(app)`** : l'écran « Le moment » est `src/routes/(app)/+page.svelte` (déplacé au Plan 2). Son `+page.server.ts` est protégé par la garde `(app)/+layout.server.ts`.

---

### Task 1: Constante spot + types partagés

**Files:**
- Create: `src/lib/server/conditions/spot.ts`
- Create: `src/lib/conditions/types.ts`

**Interfaces:**
- Consumes: rien.
- Produces :
  - `ILE_DYEU: { id: 'ile-dyeu'; name: string; lat: number; lng: number }`.
  - Types purs : `TideExtreme`, `TidePoint`, `TideTrend`, `DayTides`, `SunMoon`, `WeatherNow`, `ScoreFactor`, `ScoreRating`, `FishingScore`, `AdviceWindow`, `DayConditions`.

- [ ] **Step 1: Créer `src/lib/server/conditions/spot.ts`**

```ts
// Spot unique en v1 (cf. spec Plan 3 §2 — table `spot` différée au Plan 4).
export const ILE_DYEU = {
	id: 'ile-dyeu',
	name: "Île d'Yeu · Port-Joinville",
	lat: 46.7276,
	lng: -2.3489
} as const;
```

- [ ] **Step 2: Créer `src/lib/conditions/types.ts`**

```ts
export interface TideExtreme {
	time: Date;
	height: number;
	type: 'high' | 'low';
}
export interface TidePoint {
	time: Date;
	height: number;
}
export type TideTrend = 'rising' | 'falling' | 'slack';
export interface DayTides {
	extremes: TideExtreme[];
	curve: TidePoint[];
	coefficient: number;
}

export interface SunMoon {
	sunrise: Date;
	sunset: Date;
	dawn: Date;
	dusk: Date;
	moonrise: Date | null;
	moonset: Date | null;
	moonPhase: number; // 0–1
	moonIllumination: number; // 0–1
	moonLabel: string;
}

export interface WeatherNow {
	windSpeedKmh: number;
	windDirDeg: number;
	waveHeightM: number | null;
	wavePeriodS: number | null;
	weatherCode: number;
	tempC: number;
	fetchedAt: Date;
}

export interface ScoreFactor {
	key: string;
	label: string;
	contribution: number; // signé, en points
}
export type ScoreRating = 'faible' | 'moyen' | 'bon' | 'excellent';
export interface FishingScore {
	value: number; // 0–100
	rating: ScoreRating;
	factors: ScoreFactor[];
}

export interface AdviceWindow {
	from: Date;
	to: Date;
	reason: string;
}
export interface DayConditions {
	spot: { id: string; name: string };
	day: Date;
	tides: DayTides;
	sunMoon: SunMoon;
	weather: WeatherNow | null;
	weatherStale: boolean;
	score: FishingScore;
	windows: AdviceWindow[];
	tip: string;
}
```

- [ ] **Step 3: Vérifier check**

Run: `npm run check`
Expected: 0 erreur / 0 warning (fichiers de types seuls, pas encore consommés).

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/conditions/spot.ts src/lib/conditions/types.ts
git commit -m "feat(conditions): constante spot Île d'Yeu + types partagés du moteur"
```

---

### Task 2: Module `moon` (suncalc)

**Files:**
- Modify: `package.json` (dépendance `suncalc`)
- Create: `src/lib/server/conditions/moon.ts`, `src/lib/server/conditions/moon.test.ts`

**Interfaces:**
- Consumes: `ILE_DYEU` (Task 1) ; type `SunMoon` (Task 1).
- Produces :
  - `moonLabel(phase: number): string` (libellé FR depuis la phase 0–1).
  - `sunMoonFor(day: Date, lat?, lng?): SunMoon`.

- [ ] **Step 1: Installer la dépendance**

Run:
```bash
npm install suncalc
npm install -D @types/suncalc
```

- [ ] **Step 2: Écrire le test (échoue)**

Create `src/lib/server/conditions/moon.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { moonLabel, sunMoonFor } from './moon';

describe('moonLabel', () => {
	it('nomme la nouvelle lune et la pleine lune', () => {
		expect(moonLabel(0)).toBe('Nouvelle lune');
		expect(moonLabel(0.5)).toBe('Pleine lune');
		expect(moonLabel(1)).toBe('Nouvelle lune');
	});
	it('nomme les quartiers', () => {
		expect(moonLabel(0.25)).toBe('Premier quartier');
		expect(moonLabel(0.75)).toBe('Dernier quartier');
	});
});

describe('sunMoonFor', () => {
	it('renvoie des horaires cohérents pour un jour donné', () => {
		const sm = sunMoonFor(new Date('2026-06-21T12:00:00Z'));
		expect(sm.sunrise.getTime()).toBeLessThan(sm.sunset.getTime());
		expect(sm.moonPhase).toBeGreaterThanOrEqual(0);
		expect(sm.moonPhase).toBeLessThanOrEqual(1);
		expect(sm.moonIllumination).toBeGreaterThanOrEqual(0);
		expect(sm.moonIllumination).toBeLessThanOrEqual(1);
		expect(typeof sm.moonLabel).toBe('string');
	});
});
```

- [ ] **Step 3: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/server/conditions/moon.test.ts`
Expected: FAIL — module `./moon` introuvable.

- [ ] **Step 4: Implémenter `src/lib/server/conditions/moon.ts`**

```ts
import SunCalc from 'suncalc';
import { ILE_DYEU } from './spot';
import type { SunMoon } from '$lib/conditions/types';

// Phase suncalc : 0 = nouvelle, 0.25 = premier quartier, 0.5 = pleine, 0.75 = dernier quartier.
export function moonLabel(phase: number): string {
	const p = ((phase % 1) + 1) % 1; // normalise dans [0,1)
	if (p < 0.02 || p > 0.98) return 'Nouvelle lune';
	if (Math.abs(p - 0.25) < 0.02) return 'Premier quartier';
	if (Math.abs(p - 0.5) < 0.02) return 'Pleine lune';
	if (Math.abs(p - 0.75) < 0.02) return 'Dernier quartier';
	if (p < 0.25) return 'Premier croissant';
	if (p < 0.5) return 'Gibbeuse croissante';
	if (p < 0.75) return 'Gibbeuse décroissante';
	return 'Dernier croissant';
}

export function sunMoonFor(day: Date, lat = ILE_DYEU.lat, lng = ILE_DYEU.lng): SunMoon {
	const times = SunCalc.getTimes(day, lat, lng);
	const moonTimes = SunCalc.getMoonTimes(day, lat, lng);
	const illum = SunCalc.getMoonIllumination(day);
	return {
		sunrise: times.sunrise,
		sunset: times.sunset,
		dawn: times.dawn,
		dusk: times.dusk,
		moonrise: moonTimes.rise ?? null,
		moonset: moonTimes.set ?? null,
		moonPhase: illum.phase,
		moonIllumination: illum.fraction,
		moonLabel: moonLabel(illum.phase)
	};
}
```

- [ ] **Step 5: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/server/conditions/moon.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Suite complète + check**

Run: `npm test -- run && npm run check`
Expected: verts, check 0/0.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/server/conditions/moon.ts src/lib/server/conditions/moon.test.ts
git commit -m "feat(conditions): module lune/soleil via suncalc (offline)"
```

---

### Task 3: Module `tide` — prédicteur harmonique (interface stable)

**Files:**
- Modify: `package.json` (dépendance `@neaps/tide-predictor`)
- Create: `src/lib/server/conditions/tide.ts`, `src/lib/server/conditions/tide.test.ts`

**Interfaces:**
- Consumes: type `DayTides`, `TideExtreme`, `TidePoint`, `TideTrend` (Task 1) ; un JSON de constituantes (forme définie ci-dessous).
- Produces :
  - `Constituent = { name: string; amplitude: number; phase: number }` et `ConstituentsFile = { meta: Record<string, unknown>; datum: number; constituents: Constituent[] }`.
  - `createTideEngine(file: ConstituentsFile)` → `{ predictHeights(start, end, stepMin): TidePoint[]; findExtremes(start, end): TideExtreme[]; tideStateAt(t, extremes): TideTrend; coefficientForDay(day): number; dayTides(day): DayTides }`.

> **Décision de découplage** : les tests de cette task valident l'interface de **notre module** (propriétés structurelles + un cas analytique mono-constituante M2), **pas** l'exactitude minute réelle — celle-ci est validée en Task 4 contre SHOM. L'implémentation interne s'appuie sur `@neaps/tide-predictor` ; **vérifier la signature exacte de la lib dans son README npm** à l'implémentation et l'isoler derrière l'interface ci-dessus (repli : somme harmonique maison si la lib pose problème).

- [ ] **Step 1: Installer la dépendance**

Run:
```bash
npm install @neaps/tide-predictor
```

- [ ] **Step 2: Écrire le test (échoue)**

Create `src/lib/server/conditions/tide.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createTideEngine, type ConstituentsFile } from './tide';

// Jeu synthétique : M2 dominante (~12h25) + S2, pour des extrema réguliers et vérifiables.
const FIXTURE: ConstituentsFile = {
	meta: { source: 'fixture' },
	datum: 3,
	constituents: [
		{ name: 'M2', amplitude: 1.8, phase: 0 },
		{ name: 'S2', amplitude: 0.6, phase: 30 }
	]
};

describe('tide engine (fixture synthétique)', () => {
	const engine = createTideEngine(FIXTURE);
	const day = new Date('2026-06-21T00:00:00Z');
	const end = new Date('2026-06-22T00:00:00Z');

	it('échantillonne une courbe régulière', () => {
		const curve = engine.predictHeights(day, end, 30);
		expect(curve.length).toBeGreaterThan(40); // ~48 points / 24h à 30 min
		expect(curve[0].time.getTime()).toBe(day.getTime());
		for (const p of curve) expect(Number.isFinite(p.height)).toBe(true);
	});

	it('trouve des extrema qui alternent haute/basse', () => {
		const ex = engine.findExtremes(day, end);
		expect(ex.length).toBeGreaterThanOrEqual(3); // ~4 marées/jour
		for (let i = 1; i < ex.length; i++) {
			expect(ex[i].type).not.toBe(ex[i - 1].type); // alternance
			expect(ex[i].time.getTime()).toBeGreaterThan(ex[i - 1].time.getTime());
		}
	});

	it('tideStateAt vaut slack près d’un extrême, rising/falling sinon', () => {
		const ex = engine.findExtremes(day, end);
		expect(engine.tideStateAt(ex[0].time, ex)).toBe('slack');
		const between = new Date((ex[0].time.getTime() + ex[1].time.getTime()) / 2);
		expect(['rising', 'falling']).toContain(engine.tideStateAt(between, ex));
	});

	it('coefficient dans la plage française 20–120', () => {
		const c = engine.coefficientForDay(day);
		expect(c).toBeGreaterThanOrEqual(20);
		expect(c).toBeLessThanOrEqual(120);
	});

	it('dayTides assemble courbe + extrema + coef', () => {
		const dt = engine.dayTides(day);
		expect(dt.curve.length).toBeGreaterThan(40);
		expect(dt.extremes.length).toBeGreaterThanOrEqual(3);
		expect(dt.coefficient).toBeGreaterThanOrEqual(20);
	});
});
```

- [ ] **Step 3: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/server/conditions/tide.test.ts`
Expected: FAIL — module `./tide` introuvable.

- [ ] **Step 4: Implémenter `src/lib/server/conditions/tide.ts`**

Implémentation isolant `@neaps/tide-predictor` derrière notre interface. **Vérifier la signature exacte de la lib (README npm)** ; le squelette ci-dessous montre l'interface attendue côté module (adapter l'appel interne `predictAt`/lib au besoin) :

```ts
import type { DayTides, TideExtreme, TidePoint, TideTrend } from '$lib/conditions/types';

export interface Constituent {
	name: string;
	amplitude: number;
	phase: number;
}
export interface ConstituentsFile {
	meta: Record<string, unknown>;
	datum: number;
	constituents: Constituent[];
}

const SLACK_WINDOW_MIN = 45;

export function createTideEngine(file: ConstituentsFile) {
	// `predictAt(t)` : hauteur prédite à l'instant t (au-dessus du datum).
	// À l'implémentation : brancher @neaps/tide-predictor (corrections nodales incluses),
	// ou somme harmonique maison de repli. Isolé ici, le reste du module en dépend seul.
	const predictAt = makePredictor(file);

	function predictHeights(start: Date, end: Date, stepMin: number): TidePoint[] {
		const out: TidePoint[] = [];
		for (let t = start.getTime(); t <= end.getTime(); t += stepMin * 60_000) {
			const time = new Date(t);
			out.push({ time, height: predictAt(time) });
		}
		return out;
	}

	function findExtremes(start: Date, end: Date): TideExtreme[] {
		// Détection par changement de signe de la dérivée sur un échantillonnage fin (5 min),
		// puis raffinage local. Renvoie les extrema ordonnés, alternant high/low.
		const fine = predictHeights(start, end, 5);
		const ex: TideExtreme[] = [];
		for (let i = 1; i < fine.length - 1; i++) {
			const a = fine[i - 1].height, b = fine[i].height, c = fine[i + 1].height;
			if (b > a && b >= c) ex.push({ time: fine[i].time, height: b, type: 'high' });
			else if (b < a && b <= c) ex.push({ time: fine[i].time, height: b, type: 'low' });
		}
		return ex;
	}

	function tideStateAt(t: Date, extremes: TideExtreme[]): TideTrend {
		const near = extremes.some(
			(e) => Math.abs(e.time.getTime() - t.getTime()) <= SLACK_WINDOW_MIN * 60_000
		);
		if (near) return 'slack';
		const before = predictAt(new Date(t.getTime() - 5 * 60_000));
		const after = predictAt(new Date(t.getTime() + 5 * 60_000));
		return after >= before ? 'rising' : 'falling';
	}

	function coefficientForDay(day: Date): number {
		// Coefficient français dérivé du marnage du jour rapporté aux bornes locales.
		// Formule/normalisation calibrées en Task 4 contre les coef SHOM publiés.
		const start = new Date(day); start.setHours(0, 0, 0, 0);
		const end = new Date(start.getTime() + 24 * 3600_000);
		const ex = findExtremes(start, end);
		const highs = ex.filter((e) => e.type === 'high').map((e) => e.height);
		const lows = ex.filter((e) => e.type === 'low').map((e) => e.height);
		if (!highs.length || !lows.length) return 70;
		const range = Math.max(...highs) - Math.min(...lows);
		return normalizeCoefficient(range, file);
	}

	function dayTides(day: Date): DayTides {
		const start = new Date(day); start.setHours(0, 0, 0, 0);
		const end = new Date(start.getTime() + 24 * 3600_000);
		return {
			curve: predictHeights(start, end, 10),
			extremes: findExtremes(start, end),
			coefficient: coefficientForDay(day)
		};
	}

	return { predictHeights, findExtremes, tideStateAt, coefficientForDay, dayTides };
}

// --- helpers internes (à finaliser à l'implémentation) ---

function makePredictor(file: ConstituentsFile): (t: Date) => number {
	// Brancher @neaps/tide-predictor ici (vérifier l'API exacte dans le README npm).
	// Repli documenté : somme harmonique h(t)=datum+Σ A_i·cos(speed_i·t − phase_i)
	// avec speeds standard par nom de constituante (degrés/heure) et corrections nodales.
	// Détail laissé à l'implémentation ; isolé pour ne pas fuiter dans le reste du module.
	throw new Error('makePredictor: brancher la lib de prédiction à l’implémentation');
}

function normalizeCoefficient(range: number, file: ConstituentsFile): number {
	// Normalisation calibrée en Task 4 (VE≈95–120, ME≈20–45). Placeholder linéaire borné
	// remplacé par la formule validée contre SHOM.
	const c = 20 + (range / (2 * (file.constituents.find((x) => x.name === 'M2')?.amplitude ?? 1.8))) * 50;
	return Math.max(20, Math.min(120, Math.round(c)));
}
```

> Les deux helpers (`makePredictor`, `normalizeCoefficient`) sont **finalisés au fil de Task 3/Task 4** : `makePredictor` via la lib ou la somme harmonique de repli ; `normalizeCoefficient` calibré contre SHOM. Les tests de Task 3 (structurels + analytiques) doivent passer une fois `makePredictor` branché sur le fixture.

- [ ] **Step 5: Brancher `makePredictor` (lib ou repli) et faire passer les tests**

Implémenter `makePredictor` (lib `@neaps/tide-predictor` ; si difficulté d'API, somme harmonique maison avec speeds standard par nom). Puis :
Run: `npm test -- run src/lib/server/conditions/tide.test.ts`
Expected: PASS (5 tests) sur le fixture synthétique.

- [ ] **Step 6: Suite complète + check**

Run: `npm test -- run && npm run check`
Expected: verts, check 0/0.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/server/conditions/tide.ts src/lib/server/conditions/tide.test.ts
git commit -m "feat(conditions): prédicteur de marée harmonique (interface stable, testé sur fixture)"
```

---

### Task 4: Spike — constituantes réelles REFMAR + validation SHOM

**Files:**
- Create: `scripts/fit-tide-constituents.mjs` (ou `.py`) — prep one-time
- Create: `src/lib/server/conditions/data/port-joinville.constituents.json`

**Interfaces:**
- Consumes: série marégraphique REFMAR Port-Joinville ; `ConstituentsFile` (Task 3).
- Produces : `port-joinville.constituents.json` au format `ConstituentsFile`, **validé** contre SHOM ; `normalizeCoefficient` calibré.

> **Task exploratoire (spike), pas TDD classique.** Deliverable = un JSON validé. Garde-fou : si la validation échoue (REFMAR puis FES), **arrêter et remonter à l'utilisateur**.

- [ ] **Step 1: Récupérer une série de niveaux Port-Joinville**

Télécharger une série d'observations de niveau marin (REFMAR / `data.shom.fr` / `sonel.org`, station **Port-Joinville / Île d'Yeu**, **Licence Ouverte 2.0**), idéalement ≥ 1 an (min 29 jours). Noter station, période, datum, licence.

- [ ] **Step 2: Analyse harmonique (fit)**

Écrire `scripts/fit-tide-constituents.mjs` (ou `.py` avec `utide`/`pytides`) qui lit la série et estime amplitude/phase des constituantes dominantes (au moins **M2, S2, N2, K2, K1, O1, P1, Q1, M4, MS4**). Sortie : `src/lib/server/conditions/data/port-joinville.constituents.json` au format `ConstituentsFile` (avec `meta` : source REFMAR, station, période, datum, licence, date de calcul).

- [ ] **Step 3: Brancher le JSON réel et calibrer le coefficient**

Charger le JSON réel dans une vérification ad hoc ; ajuster `normalizeCoefficient` (Task 3) pour que VE≈95–120 / ME≈20–45.

- [ ] **Step 4: Valider contre SHOM**

Comparer, sur 5–10 dates, les horaires PM/BM prédits aux **prédictions SHOM gratuites** (`maree.info/123` Port-Joinville, ou portail SHOM) et les **coefficients** calculés aux coef SHOM.
Expected : horaires **~±10 min**, coef **±5**. Consigner les écarts en commentaire dans le JSON `meta` ou un court `data/VALIDATION.md`.
**Si hors cible** : ajouter des constituantes / allonger la série ; sinon **repli FES2014** (compte AVISO) ; sinon **arrêt + remontée utilisateur**.

- [ ] **Step 5: Suite complète + check + build**

Run: `npm test -- run && npm run check && npm run build`
Expected : verts (le prédicteur tourne désormais sur des constituantes réelles), check 0/0, build OK.

- [ ] **Step 6: Commit**

```bash
git add scripts/fit-tide-constituents.* "src/lib/server/conditions/data/port-joinville.constituents.json"
git commit -m "feat(conditions): constituantes Port-Joinville (fit REFMAR, validé vs SHOM)"
```

---

### Task 5: Module `weather` (Open-Meteo) + cache offline

**Files:**
- Modify: `src/lib/server/db/schema.ts` (table `conditions_cache`)
- Create: `src/lib/server/conditions/weather.ts`, `src/lib/server/conditions/weather.test.ts`
- Generate: migration `drizzle/`

**Interfaces:**
- Consumes: `ILE_DYEU` (Task 1) ; type `WeatherNow` (Task 1) ; `db`, schéma Drizzle.
- Produces :
  - table `conditions_cache` : `id` (text pk = spot), `weatherJson` (text), `fetchedAt` (timestamp).
  - `parseOpenMeteo(forecast, marine): Omit<WeatherNow, 'fetchedAt'>` (pur).
  - `getWeather(db, { force? }): Promise<{ weather: WeatherNow; stale: boolean }>` (fetch + cache ; sert le cache si réseau KO).

- [ ] **Step 1: Étendre `src/lib/server/db/schema.ts`**

Ajouter :
```ts
export const conditionsCache = sqliteTable('conditions_cache', {
	id: text('id').primaryKey(), // = spot id
	weatherJson: text('weather_json').notNull(),
	fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull()
});

export type ConditionsCache = typeof conditionsCache.$inferSelect;
```

- [ ] **Step 2: Générer la migration**

Run: `npm run db:generate`
Expected : nouveau SQL dans `drizzle/` créant `conditions_cache`.

- [ ] **Step 3: Écrire le test du parse (échoue)**

Create `src/lib/server/conditions/weather.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpenMeteo } from './weather';

describe('parseOpenMeteo', () => {
	const forecast = {
		current: {
			temperature_2m: 18.2,
			wind_speed_10m: 22,
			wind_direction_10m: 250,
			weather_code: 3
		}
	};
	const marine = { current: { wave_height: 1.1, wave_period: 6.4 } };

	it('mappe le forecast vers le modèle interne', () => {
		const w = parseOpenMeteo(forecast, marine);
		expect(w.tempC).toBe(18.2);
		expect(w.windSpeedKmh).toBe(22);
		expect(w.windDirDeg).toBe(250);
		expect(w.weatherCode).toBe(3);
		expect(w.waveHeightM).toBe(1.1);
		expect(w.wavePeriodS).toBe(6.4);
	});

	it('tolère une API Marine indisponible (vagues nulles)', () => {
		const w = parseOpenMeteo(forecast, null);
		expect(w.waveHeightM).toBeNull();
		expect(w.wavePeriodS).toBeNull();
		expect(w.windSpeedKmh).toBe(22);
	});
});
```

- [ ] **Step 4: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/server/conditions/weather.test.ts`
Expected: FAIL — module `./weather` introuvable.

- [ ] **Step 5: Implémenter `src/lib/server/conditions/weather.ts`**

```ts
import { eq } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { conditionsCache } from '$lib/server/db/schema';
import { ILE_DYEU } from './spot';
import type { WeatherNow } from '$lib/conditions/types';

type DB = ReturnType<typeof createDb>;

const FORECAST_URL =
	`https://api.open-meteo.com/v1/forecast?latitude=${ILE_DYEU.lat}&longitude=${ILE_DYEU.lng}` +
	`&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;
const MARINE_URL =
	`https://marine-api.open-meteo.com/v1/marine?latitude=${ILE_DYEU.lat}&longitude=${ILE_DYEU.lng}` +
	`&current=wave_height,wave_period`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseOpenMeteo(forecast: any, marine: any): Omit<WeatherNow, 'fetchedAt'> {
	const c = forecast.current;
	const m = marine?.current ?? null;
	return {
		tempC: c.temperature_2m,
		windSpeedKmh: c.wind_speed_10m,
		windDirDeg: c.wind_direction_10m,
		weatherCode: c.weather_code,
		waveHeightM: m?.wave_height ?? null,
		wavePeriodS: m?.wave_period ?? null
	};
}

async function fetchJson(url: string): Promise<any> {
	const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

export async function getWeather(db: DB, opts: { force?: boolean } = {}): Promise<{ weather: WeatherNow; stale: boolean }> {
	try {
		const [forecast, marine] = await Promise.all([
			fetchJson(FORECAST_URL),
			fetchJson(MARINE_URL).catch(() => null) // Marine optionnelle
		]);
		const weather: WeatherNow = { ...parseOpenMeteo(forecast, marine), fetchedAt: new Date() };
		db.insert(conditionsCache)
			.values({ id: ILE_DYEU.id, weatherJson: JSON.stringify(weather), fetchedAt: weather.fetchedAt })
			.onConflictDoUpdate({
				target: conditionsCache.id,
				set: { weatherJson: JSON.stringify(weather), fetchedAt: weather.fetchedAt }
			})
			.run();
		return { weather, stale: false };
	} catch {
		const row = db.select().from(conditionsCache).where(eq(conditionsCache.id, ILE_DYEU.id)).get();
		if (!row) throw new Error('Météo indisponible et aucun cache.');
		const cached = JSON.parse(row.weatherJson) as WeatherNow;
		cached.fetchedAt = row.fetchedAt;
		return { weather: cached, stale: true };
	}
}
```

> `onConflictDoUpdate` : upsert Drizzle pour better-sqlite3 (clé `id` = spot). `AbortSignal.timeout` requiert Node ≥ 18.

- [ ] **Step 6: Lancer et vérifier le succès du parse**

Run: `npm test -- run src/lib/server/conditions/weather.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Suite complète + check**

Run: `npm test -- run && npm run check`
Expected: verts, check 0/0.

- [ ] **Step 8: Commit**

```bash
git add src/lib/server/db/schema.ts drizzle/ src/lib/server/conditions/weather.ts src/lib/server/conditions/weather.test.ts
git commit -m "feat(conditions): météo Open-Meteo (sans clé) + cache offline (conditions_cache)"
```

---

### Task 6: Module `score` (pur, explicable)

**Files:**
- Create: `src/lib/server/conditions/score.ts`, `src/lib/server/conditions/score.test.ts`

**Interfaces:**
- Consumes: types `TideTrend`, `SunMoon`, `WeatherNow`, `FishingScore`, `ScoreFactor`, `ScoreRating` (Task 1).
- Produces :
  - `ScoreInput = { at: Date; trend: TideTrend; minutesToExtreme: number; coefficient: number; sunMoon: SunMoon; weather: WeatherNow | null; month: number }`.
  - `computeScore(input: ScoreInput): FishingScore` — base + contributions signées, borné 0–100, `rating` par bandes.

- [ ] **Step 1: Écrire le test (échoue)**

Create `src/lib/server/conditions/score.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeScore, type ScoreInput } from './score';
import type { SunMoon, WeatherNow } from '$lib/conditions/types';

function sunMoon(at: Date): SunMoon {
	return {
		sunrise: new Date(at.getTime() - 30 * 60_000), // aube proche -> bonus solaire
		sunset: new Date(at.getTime() + 12 * 3600_000),
		dawn: new Date(at.getTime() - 60 * 60_000),
		dusk: new Date(at.getTime() + 12.5 * 3600_000),
		moonrise: null, moonset: null,
		moonPhase: 0.5, moonIllumination: 1, moonLabel: 'Pleine lune'
	};
}
const calmWeather: WeatherNow = {
	windSpeedKmh: 10, windDirDeg: 200, waveHeightM: 0.5, wavePeriodS: 5,
	weatherCode: 1, tempC: 18, fetchedAt: new Date()
};

describe('computeScore', () => {
	const at = new Date('2026-06-21T06:00:00Z');

	it('renvoie value 0–100, rating et facteurs', () => {
		const input: ScoreInput = {
			at, trend: 'rising', minutesToExtreme: 30, coefficient: 95,
			sunMoon: sunMoon(at), weather: calmWeather, month: 5
		};
		const s = computeScore(input);
		expect(s.value).toBeGreaterThanOrEqual(0);
		expect(s.value).toBeLessThanOrEqual(100);
		expect(['faible', 'moyen', 'bon', 'excellent']).toContain(s.rating);
		expect(s.factors.length).toBeGreaterThan(0);
	});

	it('conditions favorables > conditions défavorables', () => {
		const good: ScoreInput = {
			at, trend: 'rising', minutesToExtreme: 30, coefficient: 100,
			sunMoon: sunMoon(at), weather: calmWeather, month: 6
		};
		const badWeather: WeatherNow = { ...calmWeather, windSpeedKmh: 45, waveHeightM: 2.5 };
		const bad: ScoreInput = {
			at, trend: 'slack', minutesToExtreme: 0, coefficient: 30,
			sunMoon: { ...sunMoon(at), sunrise: new Date(at.getTime() - 6 * 3600_000) },
			weather: badWeather, month: 0
		};
		expect(computeScore(good).value).toBeGreaterThan(computeScore(bad).value);
	});

	it('marque chaque contribution avec un libellé', () => {
		const s = computeScore({
			at, trend: 'rising', minutesToExtreme: 30, coefficient: 80,
			sunMoon: sunMoon(at), weather: calmWeather, month: 6
		});
		for (const f of s.factors) expect(f.label.length).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/server/conditions/score.test.ts`
Expected: FAIL — module `./score` introuvable.

- [ ] **Step 3: Implémenter `src/lib/server/conditions/score.ts`**

```ts
import type { FishingScore, ScoreFactor, ScoreRating, SunMoon, TideTrend, WeatherNow } from '$lib/conditions/types';

export interface ScoreInput {
	at: Date;
	trend: TideTrend;
	minutesToExtreme: number;
	coefficient: number;
	sunMoon: SunMoon;
	weather: WeatherNow | null;
	month: number; // 0–11
}

// Pondérations par défaut « pêche du bar » — documentées, à calibrer (spec Plan 3 §7).
const BASE = 30;
const SOLAR_WINDOW_MIN = 60;
const NEAR_EXTREME_MIN = 60;

function ratingFor(value: number): ScoreRating {
	if (value < 35) return 'faible';
	if (value < 60) return 'moyen';
	if (value < 80) return 'bon';
	return 'excellent';
}

function minutesTo(at: Date, ref: Date): number {
	return Math.abs(at.getTime() - ref.getTime()) / 60_000;
}

export function computeScore(input: ScoreInput): FishingScore {
	const factors: ScoreFactor[] = [];
	const add = (key: string, label: string, contribution: number) => {
		if (contribution !== 0) factors.push({ key, label, contribution });
	};

	// Marée en mouvement
	if (input.trend === 'rising' || input.trend === 'falling') {
		add('tide-moving', 'Eau en mouvement', 20);
	} else {
		add('tide-slack', 'Étale (eau calme)', 0);
	}
	// Proximité d'un extrême
	if (input.minutesToExtreme <= NEAR_EXTREME_MIN) {
		add('tide-extreme', 'Proche d’une étale de marée', 10);
	}
	// Coefficient : 20 → 0 pt, 120 → 20 pts
	const coefPts = Math.round(((Math.max(20, Math.min(120, input.coefficient)) - 20) / 100) * 20);
	add('coefficient', `Coefficient ${input.coefficient}`, coefPts);

	// Fenêtre solaire (aube/crépuscule)
	const nearSun =
		minutesTo(input.at, input.sunMoon.sunrise) <= SOLAR_WINDOW_MIN ||
		minutesTo(input.at, input.sunMoon.sunset) <= SOLAR_WINDOW_MIN;
	if (nearSun) add('solar', 'Fenêtre aube/crépuscule', 25);

	// Vent / mer
	if (input.weather) {
		if (input.weather.windSpeedKmh > 30) add('wind', 'Vent fort', -15);
		else if (input.weather.windSpeedKmh <= 20) add('wind', 'Vent faible', 5);
		if ((input.weather.waveHeightM ?? 0) > 1.5) add('sea', 'Mer formée', -10);
	}

	// Lune (nouvelle/pleine favorables)
	const p = input.sunMoon.moonPhase;
	if (p < 0.05 || p > 0.95 || Math.abs(p - 0.5) < 0.05) {
		add('moon', `Lune favorable (${input.sunMoon.moonLabel})`, 8);
	}

	// Saison (juin–novembre favorables ; 0-indexé 5..10)
	if (input.month >= 5 && input.month <= 10) add('season', 'Pleine saison du bar', 10);
	else add('season', 'Hors saison', -5);

	const raw = BASE + factors.reduce((sum, f) => sum + f.contribution, 0);
	const value = Math.max(0, Math.min(100, Math.round(raw)));
	return { value, rating: ratingFor(value), factors };
}
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/server/conditions/score.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Suite complète + check**

Run: `npm test -- run && npm run check`
Expected: verts, check 0/0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/conditions/score.ts src/lib/server/conditions/score.test.ts
git commit -m "feat(conditions): score de pêche pur et explicable (pondérations par défaut)"
```

---

### Task 7: Orchestrateur `conditions`

**Files:**
- Create: `src/lib/server/conditions/conditions.ts`, `src/lib/server/conditions/conditions.test.ts`

**Interfaces:**
- Consumes: `createTideEngine` (Task 3) + JSON réel (Task 4) ; `sunMoonFor` (Task 2) ; `getWeather` (Task 5) ; `computeScore` (Task 6) ; `ILE_DYEU` (Task 1) ; types (Task 1) ; `db`.
- Produces :
  - `buildAdviceWindows(tides, sunMoon): AdviceWindow[]` (pur).
  - `buildTip(trend, sunMoon, score): string` (pur).
  - `getDayConditions(db, day?): Promise<DayConditions>` (assemble tout).

- [ ] **Step 1: Écrire le test des helpers purs (échoue)**

Create `src/lib/server/conditions/conditions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildAdviceWindows, buildTip } from './conditions';
import type { DayTides, SunMoon, FishingScore } from '$lib/conditions/types';

const day = new Date('2026-06-21T00:00:00Z');
const tides: DayTides = {
	extremes: [
		{ time: new Date('2026-06-21T03:00:00Z'), height: 4.2, type: 'high' },
		{ time: new Date('2026-06-21T09:00:00Z'), height: 0.9, type: 'low' }
	],
	curve: [],
	coefficient: 95
};
const sunMoon: SunMoon = {
	sunrise: new Date('2026-06-21T04:00:00Z'),
	sunset: new Date('2026-06-21T19:30:00Z'),
	dawn: new Date('2026-06-21T03:20:00Z'),
	dusk: new Date('2026-06-21T20:10:00Z'),
	moonrise: null, moonset: null, moonPhase: 0.5, moonIllumination: 1, moonLabel: 'Pleine lune'
};

describe('buildAdviceWindows', () => {
	it('produit des fenêtres (aube/crépuscule + étales)', () => {
		const w = buildAdviceWindows(tides, sunMoon);
		expect(w.length).toBeGreaterThan(0);
		for (const win of w) {
			expect(win.from.getTime()).toBeLessThan(win.to.getTime());
			expect(win.reason.length).toBeGreaterThan(0);
		}
	});
});

describe('buildTip', () => {
	it('renvoie un conseil non vide', () => {
		const score: FishingScore = { value: 75, rating: 'bon', factors: [] };
		expect(buildTip('rising', sunMoon, score).length).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/server/conditions/conditions.test.ts`
Expected: FAIL — module `./conditions` introuvable.

- [ ] **Step 3: Implémenter `src/lib/server/conditions/conditions.ts`**

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { createDb } from '$lib/server/db';
import type { AdviceWindow, DayConditions, DayTides, FishingScore, SunMoon, TideTrend } from '$lib/conditions/types';
import { ILE_DYEU } from './spot';
import { sunMoonFor } from './moon';
import { createTideEngine, type ConstituentsFile } from './tide';
import { getWeather } from './weather';
import { computeScore } from './score';

type DB = ReturnType<typeof createDb>;

const constituents = JSON.parse(
	readFileSync(fileURLToPath(new URL('./data/port-joinville.constituents.json', import.meta.url)), 'utf-8')
) as ConstituentsFile;
const engine = createTideEngine(constituents);

const WINDOW_MIN = 60;

export function buildAdviceWindows(tides: DayTides, sunMoon: SunMoon): AdviceWindow[] {
	const w: AdviceWindow[] = [];
	const span = (center: Date, reason: string) =>
		w.push({ from: new Date(center.getTime() - WINDOW_MIN * 60_000), to: new Date(center.getTime() + WINDOW_MIN * 60_000), reason });
	span(sunMoon.sunrise, 'Aube');
	span(sunMoon.sunset, 'Crépuscule');
	for (const e of tides.extremes) span(e.time, e.type === 'high' ? 'Étale de pleine mer' : 'Étale de basse mer');
	return w.sort((a, b) => a.from.getTime() - b.from.getTime());
}

export function buildTip(trend: TideTrend, sunMoon: SunMoon, score: FishingScore): string {
	if (score.rating === 'excellent' || score.rating === 'bon') {
		if (trend === 'rising') return 'Bonnes conditions : privilégie les leurres sur le flot montant, près des cassures.';
		if (trend === 'falling') return 'Bonnes conditions : suis le jusant, les bars chassent sur le courant descendant.';
		return 'Bonnes conditions : autour de l’étale, ralentis l’animation et insiste sur les postes marqués.';
	}
	if (score.rating === 'moyen') return 'Conditions moyennes : cible les fenêtres d’aube/crépuscule et les changements de marée.';
	return 'Conditions difficiles : sortie courte conseillée sur les meilleurs créneaux (étales, aube/crépuscule).';
}

export async function getDayConditions(db: DB, day: Date = new Date()): Promise<DayConditions> {
	const tides = engine.dayTides(day);
	const sunMoon = sunMoonFor(day);
	let weather = null;
	let weatherStale = false;
	try {
		const res = await getWeather(db);
		weather = res.weather;
		weatherStale = res.stale;
	} catch {
		weather = null;
	}

	const now = day;
	const trend = engine.tideStateAt(now, tides.extremes);
	const minutesToExtreme = Math.min(
		...tides.extremes.map((e) => Math.abs(e.time.getTime() - now.getTime()) / 60_000)
	);
	const score = computeScore({
		at: now,
		trend,
		minutesToExtreme: Number.isFinite(minutesToExtreme) ? minutesToExtreme : 999,
		coefficient: tides.coefficient,
		sunMoon,
		weather,
		month: now.getMonth()
	});

	return {
		spot: { id: ILE_DYEU.id, name: ILE_DYEU.name },
		day,
		tides,
		sunMoon,
		weather,
		weatherStale,
		score,
		windows: buildAdviceWindows(tides, sunMoon),
		tip: buildTip(trend, sunMoon, score)
	};
}
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/server/conditions/conditions.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Suite complète + check**

Run: `npm test -- run && npm run check`
Expected: verts, check 0/0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/conditions/conditions.ts src/lib/server/conditions/conditions.test.ts
git commit -m "feat(conditions): orchestrateur jour (assemblage + fenêtres conseillées + conseil)"
```

---

### Task 8: Écran « Le moment » + vérification finale + docs

**Files:**
- Create: `src/routes/(app)/+page.server.ts`
- Modify: `src/routes/(app)/+page.svelte`
- Modify: `docs/HANDOFF.md` (état Plan 3)

**Interfaces:**
- Consumes: `getDayConditions` (Task 7) ; `db` ; type `DayConditions`. Composants `Card` ; nouveaux composants signature (courbe, jauge) via `frontend-design`.
- Produces : `/` (Le moment) affiche score+jauge, courbe de marée, coefficient, fenêtres conseillées, synthèse vent/mer/météo (avec fraîcheur), conseil du jour.

- [ ] **Step 1: Créer `src/routes/(app)/+page.server.ts`**

```ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getDayConditions } from '$lib/server/conditions/conditions';

export const load: PageServerLoad = async () => {
	const conditions = await getDayConditions(db);
	// Sérialisation : les Date passent en string via le transport SvelteKit (devalue gère les Date).
	return { conditions };
};
```

- [ ] **Step 2: Câbler `src/routes/(app)/+page.svelte`**

Remplacer le contenu placeholder par l'affichage de `data.conditions` : score + **jauge** (composant signature), **courbe de marée** (composant signature), coefficient, **fenêtres conseillées**, synthèse vent/mer/météo (avec « données du <heure> » si `weatherStale`), **conseil du jour**. Tout style dérive des tokens.

> **Composants signature** (jauge de score, courbe de marée animée) : concevoir via la skill **`frontend-design`** (mockups + tokens), puis intégrer. Respecter `prefers-reduced-motion` et la lisibilité plein soleil (spec produit §7).

- [ ] **Step 3: Vérifier build + check + suite + rendu**

Run: `npm test -- run && npm run build && npm run check`
Expected : suite verte, build OK, check 0/0.
Vérification manuelle (serveur buildé + DB migrée + constituantes présentes) : `/` affiche le score, la courbe de marée, le coefficient, les fenêtres et le conseil ; couper le réseau → marées/lune toujours OK, météo en cache datée (« données du … »).

- [ ] **Step 4: Mettre à jour `docs/HANDOFF.md`**

Marquer **Plan 3 livré** (moteur conditions + écran « Le moment ») dans §2/§3 ; rappeler le point ouvert résiduel éventuel (calibration coef/score) et la prochaine étape (Plan 4 Carnet).

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(app)/+page.server.ts" "src/routes/(app)/+page.svelte" docs/HANDOFF.md
git commit -m "feat(le-moment): écran d'accueil câblé sur le moteur de conditions"
```

---

## Self-Review

**1. Spec coverage (spec Plan 3) :**
- Marées harmoniques locales + coefficient → Tasks 3, 4 ✅
- Constituantes REFMAR (Licence Ouverte) + validation SHOM → Task 4 ✅
- Lune/soleil (suncalc) → Task 2 ✅
- Météo Open-Meteo sans clé + cache offline → Task 5 ✅
- Score pur explicable (poids par défaut) → Task 6 ✅
- Orchestrateur + fenêtres + conseil → Task 7 ✅
- Écran « Le moment » câblé (composants signature via frontend-design) → Task 8 ✅
- Pas de cron / spot constante → Tasks 1, 5 (aucune table spot, aucun cron) ✅
- Offline (marées/lune locales, météo cache) → Tasks 5, 7, 8 ✅

**2. Placeholder scan :** les seuls éléments « à finaliser » sont intrinsèques au spike (valeurs de constituantes produites par le fit Task 4) et aux deux helpers `makePredictor`/`normalizeCoefficient` (branchement lib + calibration), explicitement cadrés avec critères de succès et garde-fou. Aucun TODO masqué dans les modules testés (moon, weather, score, conditions, types).

**3. Type consistency :** types centralisés dans `src/lib/conditions/types.ts` (Task 1) et importés partout. `ConstituentsFile`/`Constituent` définis en Task 3, consommés en Tasks 4 et 7. `ScoreInput` (Task 6) alimenté par l'orchestrateur (Task 7) avec les champs exacts. `getWeather` renvoie `{ weather, stale }` consommé en Task 7. `DayConditions` (Task 1) produit en Task 7, consommé en Task 8. `ILE_DYEU` (Task 1) utilisé en Tasks 2, 5, 7.

**4. Risques :** acquisition des constituantes (Task 4) = risque principal, avec validation SHOM + repli FES + garde-fou d'arrêt. API exacte de `@neaps/tide-predictor` à vérifier (README) — isolée derrière `makePredictor`, repli somme harmonique maison. Calibration coef/score documentée comme « à affiner ». Open-Meteo Marine optionnelle (dégradation gracieuse).

**Vérification finale attendue** : suite complète verte (existants + moon 4 + tide 5 + weather 2 + score 3 + conditions 2), `npm run check` 0/0, `npm run build` OK ; validation marée vs SHOM consignée (Task 4) ; rendu « Le moment » + offline vérifiés manuellement.
