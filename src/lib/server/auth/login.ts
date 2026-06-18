import { eq } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword, verifyPassword } from './password';

type DB = ReturnType<typeof createDb>;

export const MIN_PASSWORD_LENGTH = 8;

export type AuthUser = { id: string; name: string; email: string; spotDefaultId: string | null };

export async function authenticate(db: DB, email: string, password: string): Promise<AuthUser | null> {
	const normalized = email.trim().toLowerCase();
	const row = db.select().from(users).where(eq(users.email, normalized)).get();
	if (!row) return null;
	const ok = await verifyPassword(row.passwordHash, password);
	if (!ok) return null;
	return { id: row.id, name: row.name, email: row.email, spotDefaultId: row.spotDefaultId };
}

export async function changePassword(
	db: DB,
	userId: string,
	currentPassword: string,
	newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	if (newPassword.length < MIN_PASSWORD_LENGTH) {
		return { ok: false, error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` };
	}
	const row = db.select().from(users).where(eq(users.id, userId)).get();
	if (!row) return { ok: false, error: 'Utilisateur introuvable.' };
	const ok = await verifyPassword(row.passwordHash, currentPassword);
	if (!ok) return { ok: false, error: 'Mot de passe actuel incorrect.' };
	const passwordHash = await hashPassword(newPassword);
	db.update(users).set({ passwordHash }).where(eq(users.id, userId)).run();
	return { ok: true };
}
