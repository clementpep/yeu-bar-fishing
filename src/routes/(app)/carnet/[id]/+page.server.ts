import { error, fail, redirect } from '@sveltejs/kit';
import { ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, users } from '$lib/server/db';
import { getCatch, updateCatch, deleteCatch } from '$lib/server/catch/catch';
import { savePhoto, deletePhoto } from '$lib/server/catch/photos';
import { parseCatchForm } from '$lib/server/catch/form';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id; // garanti non-null par la garde (app)
	const c = getCatch(db, userId, params.id);
	if (!c) throw error(404, 'Prise introuvable');

	const friends = db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(ne(users.id, userId))
		.all();

	return { catch: c, friends };
};

export const actions: Actions = {
	update: async ({ params, request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const userId = locals.user.id;
		const existing = getCatch(db, userId, params.id);
		if (!existing) throw error(404, 'Prise introuvable');

		const data = await request.formData();
		const parsed = parseCatchForm(db, userId, data);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		// Photo : nouveau fichier > retrait explicite > inchangée. On efface l'ancienne
		// du disque quand elle est remplacée ou retirée.
		let photo: string | null | undefined = undefined;
		let oldToDelete: string | null = null;
		let newPhoto: string | null = null;
		try {
			newPhoto = await savePhoto(data.get('photo'));
		} catch {
			newPhoto = null;
		}
		if (newPhoto) {
			photo = newPhoto;
			oldToDelete = existing.photo;
		} else if (data.get('removePhoto') === 'on') {
			photo = null;
			oldToDelete = existing.photo;
		}

		updateCatch(db, userId, params.id, { ...parsed.value, photo });
		if (oldToDelete) await deletePhoto(oldToDelete);

		throw redirect(303, '/carnet');
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const res = deleteCatch(db, locals.user.id, params.id);
		if (res?.photo) await deletePhoto(res.photo);
		throw redirect(303, '/carnet');
	}
};
