import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { listCatches } from '$lib/server/catch/catch';

// Points de toutes les prises géolocalisées de l'utilisateur, pour la carte.
export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id; // garanti non-null par la garde (app)
	const points = listCatches(db, userId)
		.filter((c) => c.lat != null && c.lng != null)
		.map((c) => ({
			id: c.id,
			lat: c.lat as number,
			lng: c.lng as number,
			lengthCm: c.lengthCm,
			caughtAt: c.caughtAt,
			place: c.place,
			photo: c.photo
		}));
	return { points };
};
