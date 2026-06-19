import { describe, it, expect } from 'vitest';
import { toMomentData } from './moment';
import type { DayConditions } from '$lib/conditions/types';

function fixture(): DayConditions {
	const day = new Date('2026-06-19T22:00:00Z'); // ~minuit Paris du 20 juin
	const mk = (h: number, height: number) => ({ time: new Date(day.getTime() + h * 3600_000), height });
	return {
		spot: { id: 'ile-dyeu', name: "Île d'Yeu · Port-Joinville" },
		day,
		tides: {
			curve: [mk(0, 1.2), mk(3, 3), mk(6, 4.6), mk(9, 2.5), mk(12, 1.0)],
			extremes: [
				{ time: new Date(day.getTime() + 6 * 3600_000), height: 4.6, type: 'high' },
				{ time: new Date(day.getTime() + 12 * 3600_000), height: 1.0, type: 'low' }
			],
			coefficient: 95
		},
		sunMoon: {
			sunrise: new Date(day.getTime() + 4 * 3600_000),
			sunset: new Date(day.getTime() + 19 * 3600_000),
			dawn: new Date(day.getTime() + 3.5 * 3600_000),
			dusk: new Date(day.getTime() + 19.5 * 3600_000),
			moonrise: null,
			moonset: null,
			moonPhase: 0.5,
			moonIllumination: 0.98,
			moonLabel: 'Pleine lune'
		},
		weather: {
			windSpeedKmh: 18,
			windDirDeg: 315,
			waveHeightM: 0.6,
			wavePeriodS: 5,
			weatherCode: 2,
			tempC: 19,
			fetchedAt: day
		},
		weatherStale: false,
		score: {
			value: 78,
			rating: 'bon',
			factors: [
				{ key: 'coefficient', label: 'Coefficient 95', contribution: 15 },
				{ key: 'tide-moving', label: 'Eau en mouvement', contribution: 20 },
				{ key: 'solar', label: 'Fenêtre aube/crépuscule', contribution: 25 },
				{ key: 'season', label: 'Pleine saison du bar', contribution: 10 }
			]
		},
		windows: [
			{ from: new Date(day.getTime() + 3 * 3600_000), to: new Date(day.getTime() + 5 * 3600_000), reason: 'Aube' }
		],
		tip: 'Suis le jusant le long des roches.'
	};
}

describe('toMomentData', () => {
	const now = new Date('2026-06-20T05:00:00Z');
	const m = toMomentData(fixture(), now);

	it('mappe les champs de tête', () => {
		expect(m.spot).toBe("Île d'Yeu · Port-Joinville");
		expect(m.score).toBe(78);
		expect(m.date).toMatch(/juin$/);
		expect(m.tide.coefficient).toBe(95);
	});

	it('produit 6 barres de facteurs (poids 0..1)', () => {
		expect(m.factors).toHaveLength(6);
		for (const f of m.factors) {
			expect(f.weight).toBeGreaterThanOrEqual(0);
			expect(f.weight).toBeLessThanOrEqual(1);
		}
	});

	it('marque les étales sur la courbe et donne la prochaine étale', () => {
		expect(m.tide.points.some((p) => p.type === 'high')).toBe(true);
		expect(m.tide.points.some((p) => p.type === 'low')).toBe(true);
		expect(m.tide.nextEtale).toMatch(/(Pleine|Basse) mer à \d{2}:\d{2}/);
	});

	it('construit 4 stats et au moins une fenêtre', () => {
		expect(m.stats).toHaveLength(4);
		expect(m.windows.length).toBeGreaterThan(0);
		expect(m.scoreWhy.length).toBeGreaterThan(0);
	});
});
