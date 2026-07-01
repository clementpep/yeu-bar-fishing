import { fail, redirect } from '@sveltejs/kit';
import { and, ne, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, users } from '$lib/server/db';
import { createCatch, listCatches, computeRecords } from '$lib/server/catch/catch';
import { getDayConditions } from '$lib/server/conditions/conditions';
import { snapshotConditions } from '$lib/server/catch/snapshot';
import { savePhoto } from '$lib/server/catch/photos';
import { TECHNIQUES, TIDE_TRENDS, type Technique, type TideTrend } from '$lib/catch/types';

const TIDE_VALUES = TIDE_TRENDS.map((t) => t.value) as readonly TideTrend[];

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id; // garanti non-null par la garde (app)

	// Potes taggables : tous les autres inscrits.
	const friends = db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(ne(users.id, userId))
		.all();

	// Pré-remplissage du formulaire depuis les conditions du jour (best-effort).
	let prefill: { coefficient: number | null; tempC: number | null } = {
		coefficient: null,
		tempC: null
	};
	try {
		const c = await getDayConditions(db);
		prefill = {
			coefficient: c.tides.coefficient,
			tempC: c.weather ? Math.round(c.weather.tempC) : null
		};
	} catch {
		// conditions indisponibles : on laisse le formulaire vide
	}

	return {
		catches: listCatches(db, userId),
		records: computeRecords(db, userId),
		friends,
		prefill
	};
};

function parseNumber(raw: FormDataEntryValue | null, min: number, max: number): number | null {
	if (raw == null) return null;
	const n = Number(String(raw).replace(',', '.'));
	if (!Number.isFinite(n) || n < min || n > max) return null;
	return n;
}

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const userId = locals.user.id;
		const data = await request.formData();

		const lengthCm = Number(String(data.get('lengthCm') ?? '').replace(',', '.'));
		if (!Number.isFinite(lengthCm) || lengthCm <= 0 || lengthCm > 150) {
			return fail(400, { error: 'Indique une taille valide (cm).' });
		}

		const techniqueRaw = String(data.get('technique') ?? '');
		const technique = (TECHNIQUES as readonly string[]).includes(techniqueRaw)
			? (techniqueRaw as Technique)
			: null;
		const lureBait = String(data.get('lureBait') ?? '').trim() || null;
		const released = data.get('released') === 'on';

		const place = String(data.get('place') ?? '').trim() || null;
		const tideTrendRaw = String(data.get('tideTrend') ?? '');
		const tideTrend = (TIDE_VALUES as readonly string[]).includes(tideTrendRaw)
			? (tideTrendRaw as TideTrend)
			: null;
		const coefficient = parseNumber(data.get('coefficient'), 20, 120);
		const tempC = parseNumber(data.get('tempC'), -5, 40);
		const weatherNote = String(data.get('weatherNote') ?? '').trim() || null;
		const fromBoat = data.get('fromBoat') === 'on';
		const companionsText = String(data.get('companionsText') ?? '').trim() || null;
		const notes = String(data.get('notes') ?? '').trim() || null;

		const lat = parseNumber(data.get('lat'), -90, 90);
		const lng = parseNumber(data.get('lng'), -180, 180);
		const accuracyM = parseNumber(data.get('accuracyM'), 0, 100000);

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

		let photo: string | null = null;
		try {
			photo = await savePhoto(data.get('photo'));
		} catch {
			photo = null;
		}

		let conditions = null;
		try {
			conditions = snapshotConditions(await getDayConditions(db));
		} catch {
			conditions = null;
		}

		createCatch(db, {
			userId,
			lengthCm,
			technique,
			lureBait,
			released,
			conditions,
			place,
			tideTrend,
			coefficient,
			tempC,
			weatherNote,
			fromBoat,
			companionsText,
			companionIds,
			lat,
			lng,
			accuracyM,
			photo,
			notes
		});
		return { success: true };
	}
};
