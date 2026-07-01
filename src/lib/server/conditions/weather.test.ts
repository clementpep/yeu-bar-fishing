import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { conditionsCache } from '$lib/server/db/schema';
import { parseOpenMeteo, readCachedWeather } from './weather';

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

describe('readCachedWeather', () => {
	function freshDb() {
		const db = createDb(':memory:');
		db.run(
			sql`CREATE TABLE conditions_cache (id TEXT PRIMARY KEY, weather_json TEXT NOT NULL, fetched_at INTEGER NOT NULL)`
		);
		return db;
	}

	it('renvoie null quand le cache est vide (aucun réseau)', () => {
		expect(readCachedWeather(freshDb())).toBeNull();
	});

	it('lit la météo du cache et la marque comme stale', () => {
		const db = freshDb();
		const weather = {
			tempC: 15,
			windSpeedKmh: 10,
			windDirDeg: 200,
			weatherCode: 1,
			waveHeightM: null,
			wavePeriodS: null,
			fetchedAt: new Date()
		};
		db.insert(conditionsCache)
			.values({ id: 'ile-dyeu', weatherJson: JSON.stringify(weather), fetchedAt: new Date() })
			.run();
		const res = readCachedWeather(db);
		expect(res?.weather.tempC).toBe(15);
		expect(res?.stale).toBe(true);
	});
});
