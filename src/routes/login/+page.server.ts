import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { authenticate } from '$lib/server/auth/login';
import {
	createSession,
	generateSessionToken,
	SESSION_COOKIE,
	SESSION_TTL_MS
} from '$lib/server/auth/session';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Renseigne ton e-mail et ton mot de passe.', email });
		}

		const user = await authenticate(db, email, password);
		if (!user) {
			return fail(400, { error: 'E-mail ou mot de passe incorrect.', email });
		}

		const token = generateSessionToken();
		createSession(db, user.id, token);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: Math.floor(SESSION_TTL_MS / 1000)
		});

		throw redirect(303, '/');
	}
};
