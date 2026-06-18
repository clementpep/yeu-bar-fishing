export interface TidePoint {
	/** Heure locale "HH:MM". */
	t: string;
	/** Hauteur d'eau en mètres. */
	height: number;
	/** Étale marquée (pleine/basse mer). */
	type?: 'high' | 'low';
}

export interface ScoreFactor {
	label: string;
	/** Contribution normalisée 0..1. */
	weight: number;
}

export interface StatData {
	label: string;
	value: string;
	unit?: string;
}

export interface MomentData {
	spot: string;
	date: string;
	score: number;
	scoreWhy: string;
	factors: ScoreFactor[];
	tide: {
		points: TidePoint[];
		/** Position de « maintenant » sur la courbe, 0..1. */
		nowFraction: number;
		coefficient: number;
		nextEtale: string;
	};
	stats: StatData[];
	tip: { title: string; body: string };
	windows: { label: string; time: string }[];
}
