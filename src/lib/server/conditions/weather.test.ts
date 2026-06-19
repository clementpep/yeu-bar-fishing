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
