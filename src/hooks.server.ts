import type { Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { SESSION_COOKIE, validateSession, invalidateSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.user = null;

	if (token) {
		const session = validateSession(db, token);
		if (session) {
			const u = db.select().from(users).where(eq(users.id, session.userId)).get();
			if (u) {
				event.locals.user = {
					id: u.id,
					name: u.name,
					email: u.email,
					spotDefaultId: u.spotDefaultId
				};
			} else {
				invalidateSession(db, token);
				event.cookies.delete(SESSION_COOKIE, { path: '/' });
			}
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	return resolve(event);
};
