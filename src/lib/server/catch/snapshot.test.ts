import { describe, it, expect } from 'vitest';
import { snapshotConditions } from './snapshot';
import type { DayConditions } from '$lib/conditions/types';

function fix(): DayConditions {
	const d = new Date('2026-06-19T08:00:00Z');
	return {
		spot: { id: 'ile-dyeu', name: 'Île d’Yeu' },
		day: d,
		tides: { extremes: [], curve: [], coefficient: 83 },
		sunMoon: {
			sunrise: d,
			sunset: d,
			dawn: d,
			dusk: d,
			moonrise: null,
			moonset: null,
			moonPhase: 0.5,
			moonIllumination: 1,
			moonLabel: 'Pleine lune'
		},
		weather: {
			windSpeedKmh: 20,
			windDirDeg: 315,
			waveHeightM: 0.6,
			wavePeriodS: 5,
			weatherCode: 2,
			tempC: 18,
			fetchedAt: d
		},
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
