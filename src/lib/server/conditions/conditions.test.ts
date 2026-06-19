import { describe, it, expect } from 'vitest';
import { buildAdviceWindows, buildTip } from './conditions';
import type { DayTides, SunMoon, FishingScore } from '$lib/conditions/types';

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
	moonrise: null,
	moonset: null,
	moonPhase: 0.5,
	moonIllumination: 1,
	moonLabel: 'Pleine lune'
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
