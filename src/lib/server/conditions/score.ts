import type {
	FishingScore,
	ScoreFactor,
	ScoreRating,
	SunMoon,
	TideTrend,
	WeatherNow
} from '$lib/conditions/types';

export interface ScoreInput {
	at: Date;
	trend: TideTrend;
	minutesToExtreme: number;
	coefficient: number;
	sunMoon: SunMoon;
	weather: WeatherNow | null;
	month: number; // 0–11
}

// Pondérations par défaut « pêche du bar » — documentées, à calibrer (spec Plan 3 §7).
const BASE = 30;
const SOLAR_WINDOW_MIN = 60;
const NEAR_EXTREME_MIN = 60;

function ratingFor(value: number): ScoreRating {
	if (value < 35) return 'faible';
	if (value < 60) return 'moyen';
	if (value < 80) return 'bon';
	return 'excellent';
}

function minutesTo(at: Date, ref: Date): number {
	return Math.abs(at.getTime() - ref.getTime()) / 60_000;
}

export function computeScore(input: ScoreInput): FishingScore {
	const factors: ScoreFactor[] = [];
	const add = (key: string, label: string, contribution: number) => {
		if (contribution !== 0) factors.push({ key, label, contribution });
	};

	// Marée en mouvement
	if (input.trend === 'rising' || input.trend === 'falling') {
		add('tide-moving', 'Eau en mouvement', 20);
	}
	// Proximité d'un extrême (étale)
	if (input.minutesToExtreme <= NEAR_EXTREME_MIN) {
		add('tide-extreme', 'Proche d’une étale de marée', 10);
	}
	// Coefficient : 20 → 0 pt, 120 → 20 pts
	const coefPts = Math.round(((Math.max(20, Math.min(120, input.coefficient)) - 20) / 100) * 20);
	add('coefficient', `Coefficient ${input.coefficient}`, coefPts);

	// Fenêtre solaire (aube/crépuscule)
	const nearSun =
		minutesTo(input.at, input.sunMoon.sunrise) <= SOLAR_WINDOW_MIN ||
		minutesTo(input.at, input.sunMoon.sunset) <= SOLAR_WINDOW_MIN;
	if (nearSun) add('solar', 'Fenêtre aube/crépuscule', 25);

	// Vent / mer
	if (input.weather) {
		if (input.weather.windSpeedKmh > 30) add('wind', 'Vent fort', -15);
		else if (input.weather.windSpeedKmh <= 20) add('wind', 'Vent faible', 5);
		if ((input.weather.waveHeightM ?? 0) > 1.5) add('sea', 'Mer formée', -10);
	}

	// Lune (nouvelle/pleine favorables)
	const p = input.sunMoon.moonPhase;
	if (p < 0.05 || p > 0.95 || Math.abs(p - 0.5) < 0.05) {
		add('moon', `Lune favorable (${input.sunMoon.moonLabel})`, 8);
	}

	// Saison (juin–novembre favorables ; 0-indexé 5..10)
	if (input.month >= 5 && input.month <= 10) add('season', 'Pleine saison du bar', 10);
	else add('season', 'Hors saison', -5);

	const raw = BASE + factors.reduce((sum, f) => sum + f.contribution, 0);
	const value = Math.max(0, Math.min(100, Math.round(raw)));
	return { value, rating: ratingFor(value), factors };
}
