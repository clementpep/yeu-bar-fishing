import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { hashPassword } from './password';
import { authenticate, changePassword } from './login';

async function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE users (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL, avatar TEXT, spot_default_id TEXT, created_at INTEGER NOT NULL
	)`);
	const hash = await hashPassword('Bar2Yeu!');
	db.run(sql`INSERT INTO users (id, name, email, password_hash, created_at)
		VALUES ('u1', 'Papa', 'papa@example.com', ${hash}, 0)`);
	return db;
}

describe('authenticate', () => {
	it('renvoie l’utilisateur pour des identifiants valides', async () => {
		const db = await freshDb();
		const user = await authenticate(db, 'papa@example.com', 'Bar2Yeu!');
		expect(user?.id).toBe('u1');
		expect(user?.name).toBe('Papa');
	});

	it('renvoie null pour un mauvais mot de passe', async () => {
		const db = await freshDb();
		expect(await authenticate(db, 'papa@example.com', 'mauvais')).toBeNull();
	});

	it('renvoie null pour un email inconnu', async () => {
		const db = await freshDb();
		expect(await authenticate(db, 'inconnu@example.com', 'Bar2Yeu!')).toBeNull();
	});

	it('insensible à la casse de l’email', async () => {
		const db = await freshDb();
		const user = await authenticate(db, 'PAPA@Example.com', 'Bar2Yeu!');
		expect(user?.id).toBe('u1');
	});
});

describe('changePassword', () => {
	it('change le mot de passe avec le mot de passe actuel correct', async () => {
		const db = await freshDb();
		const res = await changePassword(db, 'u1', 'Bar2Yeu!', 'NouveauMdp1');
		expect(res.ok).toBe(true);
		expect(await authenticate(db, 'papa@example.com', 'NouveauMdp1')).not.toBeNull();
		expect(await authenticate(db, 'papa@example.com', 'Bar2Yeu!')).toBeNull();
	});

	it('refuse si le mot de passe actuel est faux', async () => {
		const db = await freshDb();
		const res = await changePassword(db, 'u1', 'faux', 'NouveauMdp1');
		expect(res.ok).toBe(false);
	});

	it('refuse un nouveau mot de passe trop court', async () => {
		const db = await freshDb();
		const res = await changePassword(db, 'u1', 'Bar2Yeu!', 'court');
		expect(res.ok).toBe(false);
	});
});
