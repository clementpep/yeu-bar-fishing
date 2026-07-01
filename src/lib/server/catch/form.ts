import { and, inArray, ne } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { TECHNIQUES, TIDE_TRENDS, type Technique, type TideTrend } from '$lib/catch/types';

type DB = ReturnType<typeof createDb>;
const TIDE_VALUES = TIDE_TRENDS.map((t) => t.value) as readonly TideTrend[];

export interface ParsedCatch {
	lengthCm: number;
	technique: Technique | null;
	lureBait: string | null;
	released: boolean;
	place: string | null;
	tideTrend: TideTrend | null;
	coefficient: number | null;
	tempC: number | null;
	weatherNote: string | null;
	companionsText: string | null;
	companionIds: string[];
	lat: number | null;
	lng: number | null;
	accuracyM: number | null;
	notes: string | null;
}

function parseNumber(raw: FormDataEntryValue | null, min: number, max: number): number | null {
	if (raw == null) return null;
	const n = Number(String(raw).replace(',', '.'));
	if (!Number.isFinite(n) || n < min || n > max) return null;
	return n;
}

/**
 * Parse et valide les champs communs d'une prise (création & édition).
 * Ne gère pas la photo (traitée à part selon create/update).
 */
export function parseCatchForm(
	db: DB,
	userId: string,
	data: FormData
): { ok: true; value: ParsedCatch } | { ok: false; error: string } {
	const lengthCm = Number(String(data.get('lengthCm') ?? '').replace(',', '.'));
	if (!Number.isFinite(lengthCm) || lengthCm <= 0 || lengthCm > 150) {
		return { ok: false, error: 'Indique une taille valide (cm).' };
	}

	const techniqueRaw = String(data.get('technique') ?? '');
	const technique = (TECHNIQUES as readonly string[]).includes(techniqueRaw)
		? (techniqueRaw as Technique)
		: null;

	const tideTrendRaw = String(data.get('tideTrend') ?? '');
	const tideTrend = (TIDE_VALUES as readonly string[]).includes(tideTrendRaw)
		? (tideTrendRaw as TideTrend)
		: null;

	// Potes tagués : on ne garde que des ids d'utilisateurs réellement inscrits.
	const requested = data
		.getAll('companions')
		.map((v) => String(v))
		.filter((id) => id && id !== userId);
	let companionIds: string[] = [];
	if (requested.length) {
		companionIds = db
			.select({ id: users.id })
			.from(users)
			.where(and(ne(users.id, userId), inArray(users.id, [...new Set(requested)])))
			.all()
			.map((r) => r.id);
	}

	return {
		ok: true,
		value: {
			lengthCm,
			technique,
			lureBait: String(data.get('lureBait') ?? '').trim() || null,
			released: data.get('released') === 'on',
			place: String(data.get('place') ?? '').trim() || null,
			tideTrend,
			coefficient: parseNumber(data.get('coefficient'), 20, 120),
			tempC: parseNumber(data.get('tempC'), -5, 40),
			weatherNote: String(data.get('weatherNote') ?? '').trim() || null,
			companionsText: String(data.get('companionsText') ?? '').trim() || null,
			companionIds,
			lat: parseNumber(data.get('lat'), -90, 90),
			lng: parseNumber(data.get('lng'), -180, 180),
			accuracyM: parseNumber(data.get('accuracyM'), 0, 100000),
			notes: String(data.get('notes') ?? '').trim() || null
		}
	};
}
