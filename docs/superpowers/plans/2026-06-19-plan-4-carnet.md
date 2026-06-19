# Plan 4 — Carnet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Permettre à chaque pêcheur de **saisir une prise** (taille, technique, leurre/appât, gardé/relâché), avec **capture automatique des conditions** du moment, **poids estimé** depuis la taille, **validation maille 42 cm** (signalée, non bloquante), et de consulter son **historique + records + stats**. **Sans photo en v1** (cadrage 2026-06-19).

**Architecture:** Une table Drizzle `catches` (server-only). Un module `src/lib/server/catch/catch.ts` encapsule la logique pure (estimation de poids, maille) et les opérations DB (créer, lister, records). L'écran `(app)/carnet` (protégé par la garde du route-group) charge les prises + records de l'utilisateur courant et expose une action `add` qui capture les conditions via `getDayConditions`. Les prises sont **personnelles** (le classement entre pêcheurs = Plan 6).

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TS strict, Drizzle + better-sqlite3, Vitest. Réutilise `Card`, `Button`, `TextField`, `StatTile`, et `getDayConditions` (Plan 3).

## Global Constraints

- **Langue** : français. **Server-only** pour DB. **TS strict**. **Mobile-first** (tap ≥ 44px, clavier `inputmode="decimal"` pour la taille).
- **Maille 42 cm** (façade Atlantique/Manche) : une prise `< 42 cm` est **signalée « à relâcher »**, **sans blocage** de saisie (spec §6).
- **Spot = constante** `ILE_DYEU` (pas de table spot). **Pas de photo** en v1.
- **Design = tokens** (single source of truth). Réutiliser les composants existants.
- **Zéro régression** : suite verte, `npm run check` 0/0, `npm run build` OK.

## File Structure

```
src/
├── lib/
│   ├── catch/types.ts                       (CREATE : types partagés Catch/CatchConditions)
│   └── server/
│       ├── db/schema.ts                     (MODIFY : table catches)
│       └── catch/
│           ├── catch.ts                     (CREATE : estimateWeightG, isUndersized, createCatch, listCatches, computeRecords)
│           └── catch.test.ts                (CREATE)
├── routes/(app)/carnet/
│   ├── +page.server.ts                      (CREATE : load prises+records, action add)
│   └── +page.svelte                         (MODIFY : formulaire + liste + records)
drizzle/                                     (migration catches)
```

---

### Task 1: Schéma `catches` + module `catch` (helpers purs + DB)

**Files:**
- Create: `src/lib/catch/types.ts`
- Modify: `src/lib/server/db/schema.ts`
- Create: `src/lib/server/catch/catch.ts`, `src/lib/server/catch/catch.test.ts`
- Generate: migration

**Interfaces:**
- Produces :
  - `MAILLE_BAR_CM = 42`.
  - `estimateWeightG(lengthCm: number): number` — W = 0.0085·L^3.05 (g), arrondi.
  - `isUndersized(lengthCm: number): boolean` — `< 42`.
  - `TECHNIQUES` (liste) ; type `Technique`.
  - `CatchConditions` (snapshot compact) ; `Catch` (ligne).
  - `createCatch(db, input): Catch`, `listCatches(db, userId): Catch[]`, `computeRecords(db, userId): { count; biggestCm; biggestKept; totalReleased }`.

- [ ] **Step 1: Types `src/lib/catch/types.ts`**

```ts
export const TECHNIQUES = ['Leurre', 'Surfcasting', 'Appât naturel', 'Traîne', 'Pêche à soutenir'] as const;
export type Technique = (typeof TECHNIQUES)[number];

export interface CatchConditions {
	coefficient: number;
	tideTrend: 'rising' | 'falling' | 'slack';
	score: number;
	windKmh: number | null;
	windDirDeg: number | null;
	weatherCode: number | null;
	moonLabel: string;
}

export interface Catch {
	id: string;
	userId: string;
	caughtAt: Date;
	lengthCm: number;
	weightEstG: number;
	technique: Technique | null;
	lureBait: string | null;
	released: boolean;
	conditions: CatchConditions | null;
}
```

- [ ] **Step 2: Étendre `src/lib/server/db/schema.ts`**

```ts
export const catches = sqliteTable('catches', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	spotId: text('spot_id').notNull().default('ile-dyeu'),
	caughtAt: integer('caught_at', { mode: 'timestamp' }).notNull(),
	lengthCm: real('length_cm').notNull(),
	weightEstG: integer('weight_est_g').notNull(),
	technique: text('technique'),
	lureBait: text('lure_bait'),
	released: integer('released', { mode: 'boolean' }).notNull().default(false),
	conditionsJson: text('conditions_json'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type CatchRow = typeof catches.$inferSelect;
```
> Ajouter `real` à l'import `drizzle-orm/sqlite-core`.

- [ ] **Step 3: Générer la migration**

Run: `npm run db:generate` → nouveau SQL créant `catches`.

- [ ] **Step 4: Test (échoue) `src/lib/server/catch/catch.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { estimateWeightG, isUndersized, createCatch, listCatches, computeRecords } from './catch';

function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE catches (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL, spot_id TEXT NOT NULL DEFAULT 'ile-dyeu',
		caught_at INTEGER NOT NULL, length_cm REAL NOT NULL, weight_est_g INTEGER NOT NULL,
		technique TEXT, lure_bait TEXT, released INTEGER NOT NULL DEFAULT 0,
		conditions_json TEXT, created_at INTEGER NOT NULL
	)`);
	return db;
}

describe('helpers', () => {
	it('estime un poids croissant avec la taille', () => {
		expect(estimateWeightG(42)).toBeGreaterThan(500);
		expect(estimateWeightG(70)).toBeGreaterThan(estimateWeightG(42));
	});
	it('maille 42 cm', () => {
		expect(isUndersized(41.9)).toBe(true);
		expect(isUndersized(42)).toBe(false);
	});
});

describe('catch DB', () => {
	it('crée et liste les prises d’un utilisateur', () => {
		const db = freshDb();
		createCatch(db, { userId: 'u1', lengthCm: 55, technique: 'Leurre', lureBait: 'Stickbait', released: false, conditions: null });
		createCatch(db, { userId: 'u1', lengthCm: 38, technique: 'Surfcasting', lureBait: null, released: true, conditions: null });
		createCatch(db, { userId: 'u2', lengthCm: 60, technique: null, lureBait: null, released: false, conditions: null });
		const mine = listCatches(db, 'u1');
		expect(mine).toHaveLength(2);
		expect(mine[0].weightEstG).toBeGreaterThan(0);
	});
	it('calcule les records personnels', () => {
		const db = freshDb();
		createCatch(db, { userId: 'u1', lengthCm: 55, technique: 'Leurre', lureBait: null, released: false, conditions: null });
		createCatch(db, { userId: 'u1', lengthCm: 38, technique: null, lureBait: null, released: true, conditions: null });
		const r = computeRecords(db, 'u1');
		expect(r.count).toBe(2);
		expect(r.biggestCm).toBe(55);
		expect(r.totalReleased).toBe(1);
	});
});
```

- [ ] **Step 5: Lancer (échoue)** : `npm test -- run src/lib/server/catch/catch.test.ts` → FAIL module introuvable.

- [ ] **Step 6: Implémenter `src/lib/server/catch/catch.ts`**

```ts
import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { catches } from '$lib/server/db/schema';
import type { Catch, CatchConditions, Technique } from '$lib/catch/types';

type DB = ReturnType<typeof createDb>;

export const MAILLE_BAR_CM = 42;

// Relation taille-poids du bar (Dicentrarchus labrax) : W(g) ≈ 0.0085·L(cm)^3.05. Estimation.
export function estimateWeightG(lengthCm: number): number {
	return Math.round(0.0085 * Math.pow(lengthCm, 3.05));
}

export function isUndersized(lengthCm: number): boolean {
	return lengthCm < MAILLE_BAR_CM;
}

export interface NewCatch {
	userId: string;
	lengthCm: number;
	technique: Technique | null;
	lureBait: string | null;
	released: boolean;
	conditions: CatchConditions | null;
	caughtAt?: Date;
}

function rowToCatch(row: typeof catches.$inferSelect): Catch {
	return {
		id: row.id,
		userId: row.userId,
		caughtAt: row.caughtAt,
		lengthCm: row.lengthCm,
		weightEstG: row.weightEstG,
		technique: (row.technique as Technique) ?? null,
		lureBait: row.lureBait,
		released: row.released,
		conditions: row.conditionsJson ? (JSON.parse(row.conditionsJson) as CatchConditions) : null
	};
}

export function createCatch(db: DB, input: NewCatch): Catch {
	const now = new Date();
	const row = {
		id: randomUUID(),
		userId: input.userId,
		spotId: 'ile-dyeu',
		caughtAt: input.caughtAt ?? now,
		lengthCm: input.lengthCm,
		weightEstG: estimateWeightG(input.lengthCm),
		technique: input.technique,
		lureBait: input.lureBait,
		released: input.released,
		conditionsJson: input.conditions ? JSON.stringify(input.conditions) : null,
		createdAt: now
	};
	db.insert(catches).values(row).run();
	return rowToCatch(row as typeof catches.$inferSelect);
}

export function listCatches(db: DB, userId: string): Catch[] {
	return db
		.select()
		.from(catches)
		.where(eq(catches.userId, userId))
		.orderBy(desc(catches.caughtAt))
		.all()
		.map(rowToCatch);
}

export function computeRecords(db: DB, userId: string) {
	const all = listCatches(db, userId);
	const count = all.length;
	const biggestCm = all.reduce((m, c) => Math.max(m, c.lengthCm), 0);
	const biggest = all.find((c) => c.lengthCm === biggestCm) ?? null;
	const totalReleased = all.filter((c) => c.released).length;
	return { count, biggestCm, biggestKept: biggest ? !biggest.released : false, totalReleased };
}
```

- [ ] **Step 7: Lancer (passe)** : `npm test -- run src/lib/server/catch/catch.test.ts` → PASS.

- [ ] **Step 8: Suite + check** : `npm test -- run && npm run check` → verts, 0/0.

- [ ] **Step 9: Commit**

```bash
git add src/lib/catch/types.ts src/lib/server/db/schema.ts drizzle/ src/lib/server/catch/catch.ts src/lib/server/catch/catch.test.ts
git commit -m "feat(carnet): table catches + module (poids estimé, maille 42cm, records)"
```

---

### Task 2: Capture des conditions à la prise

**Files:**
- Create: `src/lib/server/catch/snapshot.ts`, `src/lib/server/catch/snapshot.test.ts`

**Interfaces:**
- Consumes: `DayConditions` (Plan 3).
- Produces : `snapshotConditions(c: DayConditions): CatchConditions` (pur).

- [ ] **Step 1: Test (échoue) `snapshot.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { snapshotConditions } from './snapshot';
import type { DayConditions } from '$lib/conditions/types';

function fix(): DayConditions {
	const d = new Date('2026-06-19T08:00:00Z');
	return {
		spot: { id: 'ile-dyeu', name: 'Île d’Yeu' },
		day: d,
		tides: { extremes: [], curve: [], coefficient: 83 },
		sunMoon: { sunrise: d, sunset: d, dawn: d, dusk: d, moonrise: null, moonset: null, moonPhase: 0.5, moonIllumination: 1, moonLabel: 'Pleine lune' },
		weather: { windSpeedKmh: 20, windDirDeg: 315, waveHeightM: 0.6, wavePeriodS: 5, weatherCode: 2, tempC: 18, fetchedAt: d },
		weatherStale: false,
		score: { value: 77, rating: 'bon', factors: [] },
		windows: [],
		tip: ''
	};
}

describe('snapshotConditions', () => {
	it('extrait un instantané compact', () => {
		const s = snapshotConditions(fix());
		expect(s.coefficient).toBe(83);
		expect(s.score).toBe(77);
		expect(s.windKmh).toBe(20);
		expect(s.moonLabel).toBe('Pleine lune');
	});
	it('tolère une météo absente', () => {
		const c = fix();
		c.weather = null;
		const s = snapshotConditions(c);
		expect(s.windKmh).toBeNull();
		expect(s.weatherCode).toBeNull();
	});
});
```

- [ ] **Step 2: Lancer (échoue)** : `npm test -- run src/lib/server/catch/snapshot.test.ts`.

- [ ] **Step 3: Implémenter `src/lib/server/catch/snapshot.ts`**

```ts
import type { DayConditions, TideTrend } from '$lib/conditions/types';
import type { CatchConditions } from '$lib/catch/types';

export function snapshotConditions(c: DayConditions): CatchConditions {
	// Tendance « maintenant » approchée par le facteur de score, sinon 'slack'.
	const trend: TideTrend = c.score.factors.some((f) => f.key === 'tide-moving') ? 'rising' : 'slack';
	return {
		coefficient: c.tides.coefficient,
		tideTrend: trend,
		score: c.score.value,
		windKmh: c.weather ? c.weather.windSpeedKmh : null,
		windDirDeg: c.weather ? c.weather.windDirDeg : null,
		weatherCode: c.weather ? c.weather.weatherCode : null,
		moonLabel: c.sunMoon.moonLabel
	};
}
```
> Note : le snapshot reste volontairement compact (pas toute la courbe). La tendance fine n'est pas exposée par `DayConditions` ; on la déduit du facteur de score (suffisant pour le carnet).

- [ ] **Step 4: Lancer (passe)** + suite + check.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/catch/snapshot.ts src/lib/server/catch/snapshot.test.ts
git commit -m "feat(carnet): instantané compact des conditions à la prise"
```

---

### Task 3: Écran Carnet (formulaire + liste + records)

**Files:**
- Create: `src/routes/(app)/carnet/+page.server.ts`
- Modify: `src/routes/(app)/carnet/+page.svelte`

**Interfaces:**
- Consumes: `listCatches`, `computeRecords`, `createCatch`, `isUndersized`, `MAILLE_BAR_CM`, `TECHNIQUES` ; `getDayConditions` + `snapshotConditions` ; `db` ; `user` (via layout). `Card`, `Button`, `TextField`, `StatTile`.
- Produces : `/carnet` affiche records + liste des prises ; action `add` crée une prise en capturant les conditions ; mention « à relâcher » si `< 42 cm`.

- [ ] **Step 1: `+page.server.ts`**

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { createCatch, listCatches, computeRecords } from '$lib/server/catch/catch';
import { getDayConditions } from '$lib/server/conditions/conditions';
import { snapshotConditions } from '$lib/server/catch/snapshot';
import { TECHNIQUES, type Technique } from '$lib/catch/types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id; // garanti par la garde (app)
	return { catches: listCatches(db, userId), records: computeRecords(db, userId) };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const lengthCm = Number(data.get('lengthCm'));
		if (!Number.isFinite(lengthCm) || lengthCm <= 0 || lengthCm > 150) {
			return fail(400, { error: 'Indique une taille valide (cm).' });
		}
		const techniqueRaw = String(data.get('technique') ?? '');
		const technique = (TECHNIQUES as readonly string[]).includes(techniqueRaw)
			? (techniqueRaw as Technique)
			: null;
		const lureBait = String(data.get('lureBait') ?? '').trim() || null;
		const released = data.get('released') === 'on';

		let conditions = null;
		try {
			conditions = snapshotConditions(await getDayConditions(db));
		} catch {
			conditions = null;
		}
		createCatch(db, { userId: locals.user.id, lengthCm, technique, lureBait, released, conditions });
		return { success: true };
	}
};
```

- [ ] **Step 2: `+page.svelte`** — formulaire (taille `inputmode="decimal"`, select technique, leurre/appât, toggle relâché), avertissement maille en direct, records (StatTile), liste des prises (taille, poids estimé, technique, date, badge « relâché »/« à relâcher »). Tout en tokens. Réutiliser `Card`/`Button`/`TextField`/`StatTile`. Code complet à écrire à l'implémentation en suivant le style de `(app)/+page.svelte` et `profil/+page.svelte` (form `use:enhance`, `enhance` reset à succès).

- [ ] **Step 3: Vérifier build + check + suite + flux e2e** (serveur buildé, DB seedée) : ajouter une prise ≥ 42 → apparaît dans la liste avec poids estimé + conditions ; ajouter < 42 → badge « à relâcher » ; records mis à jour.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/(app)/carnet/+page.server.ts" "src/routes/(app)/carnet/+page.svelte"
git commit -m "feat(carnet): écran saisie de prise + capture conditions + records"
```

---

### Task 4: Vérification finale + HANDOFF + merge

- [ ] **Step 1** : `npm test -- run && npm run build && npm run check` → tout vert, 0/0.
- [ ] **Step 2** : e2e serveur buildé : login → /carnet → ajout prise (≥42 et <42) → liste + records + conditions OK.
- [ ] **Step 3** : MAJ `docs/HANDOFF.md` (Plan 4 livré, prochaine étape Plan 5).
- [ ] **Step 4** : commit, **merge sur `main`**, push (déploiement Dokploy).

## Self-Review

- Saisie prise + poids estimé + technique/leurre/relâché → Tasks 1, 3 ✅
- Capture auto des conditions → Tasks 2, 3 ✅
- Maille 42 cm signalée non bloquante → Tasks 1, 3 ✅
- Historique + records personnels → Tasks 1, 3 ✅
- Sans photo, spot constant → respecté (cadrage) ✅
- Types partagés cohérents (`Catch`, `CatchConditions`, `Technique`) entre module, snapshot, route ✅
- Hors périmètre : classement entre pêcheurs (Plan 6), photo (plan ultérieur).
