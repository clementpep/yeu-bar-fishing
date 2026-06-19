import { describe, it, expect } from 'vitest';
import { computeScore, type ScoreInput } from './score';
import type { SunMoon, WeatherNow } from '$lib/conditions/types';

function sunMoon(at: Date): SunMoon {
	return {
		sunrise: new Date(at.getTime() - 30 * 60_000), // aube proche -> bonus solaire
		sunset: new Date(at.getTime() + 12 * 3600_000),
		dawn: new Date(at.getTime() - 60 * 60_000),
		dusk: new Date(at.getTime() + 12.5 * 3600_000),
		moonrise: null,
		moonset: null,
		moonPhase: 0.5,
		moonIllumination: 1,
		moonLabel: 'Pleine lune'
	};
}
const calmWeather: WeatherNow = {
	windSpeedKmh: 10,
	windDirDeg: 200,
	waveHeightM: 0.5,
	wavePeriodS: 5,
	weatherCode: 1,
	tempC: 18,
	fetchedAt: new Date()
};

describe('computeScore', () => {
	const at = new Date('2026-06-21T06:00:00Z');

	it('renvoie value 0–100, rating et facteurs', () => {
		const input: ScoreInput = {
			at,
			trend: 'rising',
			minutesToExtreme: 30,
			coefficient: 95,
			sunMoon: sunMoon(at),
			weather: calmWeather,
			month: 5
		};
		const s = computeScore(input);
		expect(s.value).toBeGreaterThanOrEqual(0);
		expect(s.value).toBeLessThanOrEqual(100);
		expect(['faible', 'moyen', 'bon', 'excellent']).toContain(s.rating);
		expect(s.factors.length).toBeGreaterThan(0);
	});

	it('conditions favorables > conditions défavorables', () => {
		const good: ScoreInput = {
			at,
			trend: 'rising',
			minutesToExtreme: 30,
			coefficient: 100,
			sunMoon: sunMoon(at),
			weather: calmWeather,
			month: 6
		};
		const badWeather: WeatherNow = { ...calmWeather, windSpeedKmh: 45, waveHeightM: 2.5 };
		const bad: ScoreInput = {
			at,
			trend: 'slack',
			minutesToExtreme: 0,
			coefficient: 30,
			sunMoon: { ...sunMoon(at), sunrise: new Date(at.getTime() - 6 * 3600_000) },
			weather: badWeather,
			month: 0
		};
		expect(computeScore(good).value).toBeGreaterThan(computeScore(bad).value);
	});

	it('marque chaque contribution avec un libellé', () => {
		const s = computeScore({
			at,
			trend: 'rising',
			minutesToExtreme: 30,
			coefficient: 80,
			sunMoon: sunMoon(at),
			weather: calmWeather,
			month: 6
		});
		for (const f of s.factors) expect(f.label.length).toBeGreaterThan(0);
	});
});
