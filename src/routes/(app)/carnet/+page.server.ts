import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { createCatch, listCatches, computeRecords } from '$lib/server/catch/catch';
import { getDayConditions } from '$lib/server/conditions/conditions';
import { snapshotConditions } from '$lib/server/catch/snapshot';
import { TECHNIQUES, type Technique } from '$lib/catch/types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id; // garanti non-null par la garde (app)
	return { catches: listCatches(db, userId), records: computeRecords(db, userId) };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const lengthCm = Number(data.get('lengthCm'));
		if (!Number.isFinite(lengthCm) || lengthCm <= 0 || lengthCm > 150) {
			return fail(400, { error: 'Indique une taille valide (cm).' });
		}
		const techniqueRaw = String(data.get('technique') ?? '');
		const technique = (TECHNIQUES as readonly string[]).includes(techniqueRaw)
			? (techniqueRaw as Technique)
			: null;
		const lureBait = String(data.get('lureBait') ?? '').trim() || null;
		const released = data.get('released') === 'on';

		let conditions = null;
		try {
			conditions = snapshotConditions(await getDayConditions(db));
		} catch {
			conditions = null;
		}
		createCatch(db, { userId: locals.user.id, lengthCm, technique, lureBait, released, conditions });
		return { success: true };
	}
};
