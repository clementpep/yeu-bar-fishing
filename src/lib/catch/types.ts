/** Maille minimale du bar (façade Atlantique/Manche), en cm. */
export const MAILLE_BAR_CM = 42;

export const TECHNIQUES = [
	'Leurre',
	'Surfcasting',
	'Appât naturel',
	'Traîne',
	'Pêche à soutenir'
] as const;
export type Technique = (typeof TECHNIQUES)[number];

export type TideTrend = 'rising' | 'falling' | 'slack';

export const TIDE_TRENDS: { value: TideTrend; label: string }[] = [
	{ value: 'rising', label: 'Montante' },
	{ value: 'falling', label: 'Descendante' },
	{ value: 'slack', label: 'Étale' }
];

export interface CatchConditions {
	coefficient: number;
	tideTrend: TideTrend;
	score: number;
	windKmh: number | null;
	windDirDeg: number | null;
	weatherCode: number | null;
	moonLabel: string;
}

/** Pote tagué sur une prise (utilisateur inscrit). */
export interface Companion {
	id: string;
	name: string;
}

export interface Catch {
	id: string;
	userId: string;
	caughtAt: Date;
	lengthCm: number;
	weightEstG: number;
	technique: Technique | null;
	lureBait: string | null;
	released: boolean;
	conditions: CatchConditions | null;
	// Notes de pêche
	place: string | null;
	tideTrend: TideTrend | null;
	coefficient: number | null;
	tempC: number | null;
	weatherNote: string | null;
	fromBoat: boolean;
	companionsText: string | null;
	companions: Companion[];
	// Géolocalisation
	lat: number | null;
	lng: number | null;
	accuracyM: number | null;
	// Photo (option)
	photo: string | null;
	notes: string | null;
}
