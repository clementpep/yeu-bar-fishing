import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readPhoto } from '$lib/server/catch/photos';

// Sert une photo de prise. Accès réservé aux utilisateurs connectés (garde (app)).
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Non autorisé');
	const photo = await readPhoto(params.name);
	if (!photo) throw error(404, 'Photo introuvable');
	return new Response(new Uint8Array(photo.body), {
		headers: {
			'Content-Type': photo.contentType,
			'Cache-Control': 'private, max-age=31536000, immutable'
		}
	});
};
