export const TECHNIQUES = [
	'Leurre',
	'Surfcasting',
	'Appât naturel',
	'Traîne',
	'Pêche à soutenir'
] as const;
export type Technique = (typeof TECHNIQUES)[number];

export interface CatchConditions {
	coefficient: number;
	tideTrend: 'rising' | 'falling' | 'slack';
	score: number;
	windKmh: number | null;
	windDirDeg: number | null;
	weatherCode: number | null;
	moonLabel: string;
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
}
