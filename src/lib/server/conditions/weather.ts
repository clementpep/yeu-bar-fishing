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

interface OpenMeteoForecast {
	current: {
		temperature_2m: number;
		weather_code: number;
		wind_speed_10m: number;
		wind_direction_10m: number;
	};
}
interface OpenMeteoMarine {
	current: { wave_height: number; wave_period: number };
}

export function parseOpenMeteo(
	forecast: OpenMeteoForecast,
	marine: OpenMeteoMarine | null
): Omit<WeatherNow, 'fetchedAt'> {
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

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json() as Promise<T>;
}

export async function getWeather(
	db: DB,
	opts: { force?: boolean } = {}
): Promise<{ weather: WeatherNow; stale: boolean }> {
	void opts;
	try {
		const [forecast, marine] = await Promise.all([
			fetchJson<OpenMeteoForecast>(FORECAST_URL),
			fetchJson<OpenMeteoMarine>(MARINE_URL).catch(() => null) // Marine optionnelle
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
