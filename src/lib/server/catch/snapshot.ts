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
