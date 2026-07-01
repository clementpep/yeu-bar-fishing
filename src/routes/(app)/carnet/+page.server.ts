import { fail, redirect } from '@sveltejs/kit';
import { ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, users } from '$lib/server/db';
import { createCatch, listCatches, computeRecords } from '$lib/server/catch/catch';
import { getDayConditions } from '$lib/server/conditions/conditions';
import { snapshotConditions } from '$lib/server/catch/snapshot';
import { savePhoto } from '$lib/server/catch/photos';
import { parseCatchForm } from '$lib/server/catch/form';

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
		// cache-only : le pré-remplissage ne doit jamais bloquer l'affichage du carnet.
		const c = await getDayConditions(db, new Date(), { weatherCacheOnly: true });
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

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const userId = locals.user.id;
		const data = await request.formData();

		const parsed = parseCatchForm(db, userId, data);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		let photo: string | null = null;
		try {
			photo = await savePhoto(data.get('photo'));
		} catch {
			photo = null;
		}

		let conditions = null;
		try {
			// cache-only : l'enregistrement d'une prise ne doit jamais dépendre du réseau.
			conditions = snapshotConditions(
				await getDayConditions(db, new Date(), { weatherCacheOnly: true })
			);
		} catch {
			conditions = null;
		}

		createCatch(db, { userId, conditions, photo, ...parsed.value });
		return { success: true };
	}
};
