import type { createDb } from '$lib/server/db';
import type {
	AdviceWindow,
	DayConditions,
	DayTides,
	FishingScore,
	SunMoon,
	TideTrend
} from '$lib/conditions/types';
import { ILE_DYEU } from './spot';
import { sunMoonFor } from './moon';
import { createTideEngine, type ConstituentsFile } from './tide';
import { getWeather } from './weather';
import { computeScore } from './score';
import { parisMidnight, parisMonth } from '$lib/conditions/tz';
import constituentsData from './data/port-joinville.constituents.json';

type DB = ReturnType<typeof createDb>;

const engine = createTideEngine(constituentsData as ConstituentsFile);

const WINDOW_MIN = 60;

export function buildAdviceWindows(tides: DayTides, sunMoon: SunMoon): AdviceWindow[] {
	const w: AdviceWindow[] = [];
	const span = (center: Date, reason: string) =>
		w.push({
			from: new Date(center.getTime() - WINDOW_MIN * 60_000),
			to: new Date(center.getTime() + WINDOW_MIN * 60_000),
			reason
		});
	span(sunMoon.sunrise, 'Aube');
	span(sunMoon.sunset, 'Crépuscule');
	for (const e of tides.extremes) {
		span(e.time, e.type === 'high' ? 'Étale de pleine mer' : 'Étale de basse mer');
	}
	return w.sort((a, b) => a.from.getTime() - b.from.getTime());
}

export function buildTip(trend: TideTrend, sunMoon: SunMoon, score: FishingScore): string {
	void sunMoon;
	if (score.rating === 'excellent' || score.rating === 'bon') {
		if (trend === 'rising')
			return 'Bonnes conditions : privilégie les leurres sur le flot montant, près des cassures.';
		if (trend === 'falling')
			return 'Bonnes conditions : suis le jusant, les bars chassent sur le courant descendant.';
		return 'Bonnes conditions : autour de l’étale, ralentis l’animation et insiste sur les postes marqués.';
	}
	if (score.rating === 'moyen')
		return 'Conditions moyennes : cible les fenêtres d’aube/crépuscule et les changements de marée.';
	return 'Conditions difficiles : sortie courte conseillée sur les meilleurs créneaux (étales, aube/crépuscule).';
}

export async function getDayConditions(db: DB, now: Date = new Date()): Promise<DayConditions> {
	const dayStart = parisMidnight(now);
	const tides = engine.dayTides(dayStart);
	const sunMoon = sunMoonFor(now);

	let weather = null;
	let weatherStale = false;
	try {
		const res = await getWeather(db);
		weather = res.weather;
		weatherStale = res.stale;
	} catch {
		weather = null;
	}

	const trend = engine.tideStateAt(now, tides.extremes);
	const minutesToExtreme = tides.extremes.length
		? Math.min(...tides.extremes.map((e) => Math.abs(e.time.getTime() - now.getTime()) / 60_000))
		: 999;
	const score = computeScore({
		at: now,
		trend,
		minutesToExtreme,
		coefficient: tides.coefficient,
		sunMoon,
		weather,
		month: parisMonth(now)
	});

	return {
		spot: { id: ILE_DYEU.id, name: ILE_DYEU.name },
		day: dayStart,
		tides,
		sunMoon,
		weather,
		weatherStale,
		score,
		windows: buildAdviceWindows(tides, sunMoon),
		tip: buildTip(trend, sunMoon, score)
	};
}
