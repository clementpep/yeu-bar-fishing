import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { changePassword } from '$lib/server/auth/login';
import { SESSION_COOKIE, invalidateSession, invalidateUserSessions } from '$lib/server/auth/session';

// `user` (non-null) provient de la garde (app)/+layout.server.ts ; pas de load redondant ici.

export const actions: Actions = {
	changePassword: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const current = String(data.get('current') ?? '');
		const next = String(data.get('next') ?? '');

		const res = await changePassword(db, locals.user.id, current, next);
		if (!res.ok) {
			return fail(400, { pwError: res.error });
		}
		// Sécurité : invalide toutes les sessions → re-login requis
		invalidateUserSessions(db, locals.user.id);
		throw redirect(303, '/login');
	},

	logout: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) invalidateSession(db, token);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		throw redirect(303, '/login');
	}
};
