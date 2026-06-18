export interface TideExtreme {
	time: Date;
	height: number;
	type: 'high' | 'low';
}
export interface TidePoint {
	time: Date;
	height: number;
}
export type TideTrend = 'rising' | 'falling' | 'slack';
export interface DayTides {
	extremes: TideExtreme[];
	curve: TidePoint[];
	coefficient: number;
}

export interface SunMoon {
	sunrise: Date;
	sunset: Date;
	dawn: Date;
	dusk: Date;
	moonrise: Date | null;
	moonset: Date | null;
	moonPhase: number; // 0–1
	moonIllumination: number; // 0–1
	moonLabel: string;
}

export interface WeatherNow {
	windSpeedKmh: number;
	windDirDeg: number;
	waveHeightM: number | null;
	wavePeriodS: number | null;
	weatherCode: number;
	tempC: number;
	fetchedAt: Date;
}

export interface ScoreFactor {
	key: string;
	label: string;
	contribution: number; // signé, en points
}
export type ScoreRating = 'faible' | 'moyen' | 'bon' | 'excellent';
export interface FishingScore {
	value: number; // 0–100
	rating: ScoreRating;
	factors: ScoreFactor[];
}

export interface AdviceWindow {
	from: Date;
	to: Date;
	reason: string;
}
export interface DayConditions {
	spot: { id: string; name: string };
	day: Date;
	tides: DayTides;
	sunMoon: SunMoon;
	weather: WeatherNow | null;
	weatherStale: boolean;
	score: FishingScore;
	windows: AdviceWindow[];
	tip: string;
}
