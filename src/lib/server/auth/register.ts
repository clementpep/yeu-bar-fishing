import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword } from './password';
import { MIN_PASSWORD_LENGTH, type AuthUser } from './login';

type DB = ReturnType<typeof createDb>;

// Validation e-mail volontairement simple (un seul @, un point dans le domaine).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(
	db: DB,
	input: { name: string; email: string; password: string }
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();

	if (!name) {
		return { ok: false, error: 'Le nom est obligatoire.' };
	}
	if (!EMAIL_RE.test(email)) {
		return { ok: false, error: 'Adresse e-mail invalide.' };
	}
	if (input.password.length < MIN_PASSWORD_LENGTH) {
		return { ok: false, error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` };
	}

	const existing = db.select().from(users).where(eq(users.email, email)).get();
	if (existing) {
		return { ok: false, error: 'Cet e-mail est déjà utilisé.' };
	}

	const id = randomUUID();
	const passwordHash = await hashPassword(input.password);
	db.insert(users).values({ id, name, email, passwordHash, createdAt: new Date() }).run();

	return { ok: true, user: { id, name, email, spotDefaultId: null } };
}
