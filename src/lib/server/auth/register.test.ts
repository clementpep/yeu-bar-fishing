import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { authenticate } from './login';
import { register } from './register';

function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE users (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL, avatar TEXT, spot_default_id TEXT, created_at INTEGER NOT NULL
	)`);
	return db;
}

describe('register', () => {
	it('crée un compte et renvoie l’utilisateur', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.user.name).toBe('Ami');
			expect(res.user.email).toBe('ami@example.com');
			expect(res.user.id).toBeTruthy();
		}
	});

	it('le compte créé peut s’authentifier', async () => {
		const db = freshDb();
		await register(db, { name: 'Ami', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		expect(await authenticate(db, 'ami@example.com', 'Bar2Yeu!!')).not.toBeNull();
	});

	it('normalise l’e-mail (trim + minuscules)', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: '  AMI@Example.com  ', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(true);
		if (res.ok) expect(res.user.email).toBe('ami@example.com');
		expect(await authenticate(db, 'ami@example.com', 'Bar2Yeu!!')).not.toBeNull();
	});

	it('refuse un e-mail déjà utilisé', async () => {
		const db = freshDb();
		await register(db, { name: 'Ami', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		const res = await register(db, { name: 'Autre', email: 'ami@example.com', password: 'Autre123!' });
		expect(res.ok).toBe(false);
		if (!res.ok) expect(res.error).toMatch(/déjà/i);
	});

	it('refuse un mot de passe trop court', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: 'ami@example.com', password: 'court' });
		expect(res.ok).toBe(false);
	});

	it('refuse un nom vide', async () => {
		const db = freshDb();
		const res = await register(db, { name: '   ', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(false);
	});

	it('refuse un e-mail invalide', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: 'pas-un-email', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(false);
	});
});
