import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { register } from '$lib/server/auth/register';
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
		const name = String(data.get('name') ?? '');
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		const res = await register(db, { name, email, password });
		if (!res.ok) {
			return fail(400, { error: res.error, name, email });
		}

		const token = generateSessionToken();
		createSession(db, res.user.id, token);
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
