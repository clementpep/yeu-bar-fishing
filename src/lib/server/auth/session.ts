import { randomBytes, createHash } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';

type DB = ReturnType<typeof createDb>;

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

export function generateSessionToken(): string {
	return randomBytes(24).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function createSession(db: DB, userId: string, token: string) {
	const id = hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	db.insert(sessions).values({ id, userId, expiresAt }).run();
	return { id, userId, expiresAt };
}

export function validateSession(db: DB, token: string) {
	const id = hashToken(token);
	const row = db.select().from(sessions).where(eq(sessions.id, id)).get();
	if (!row) return null;
	if (Date.now() >= row.expiresAt.getTime()) {
		db.delete(sessions).where(eq(sessions.id, id)).run();
		return null;
	}
	return row;
}

export function invalidateSession(db: DB, token: string): void {
	db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
}

export function invalidateUserSessions(db: DB, userId: string): void {
	db.delete(sessions).where(eq(sessions.userId, userId)).run();
}

/** Purge optionnelle des sessions expirées (appelée ponctuellement). */
export function purgeExpiredSessions(db: DB): void {
	db.delete(sessions).where(lt(sessions.expiresAt, new Date())).run();
}
