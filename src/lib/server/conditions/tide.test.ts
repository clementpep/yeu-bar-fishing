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
