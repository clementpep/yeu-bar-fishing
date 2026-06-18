import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from './index';
import { users } from './schema';

describe('db', () => {
	it('insère et relit un utilisateur en base mémoire', () => {
		const db = createDb(':memory:');
		// crée la table à la volée pour le test (le schéma de prod vient des migrations)
		db.run(sql`CREATE TABLE users (
			id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL, avatar TEXT, spot_default_id TEXT,
			created_at INTEGER NOT NULL
		)`);

		db.insert(users).values({
			id: 'u1',
			name: 'Papa',
			email: 'papa@example.com',
			passwordHash: 'x',
			createdAt: new Date()
		}).run();

		const rows = db.select().from(users).all();
		expect(rows).toHaveLength(1);
		expect(rows[0].email).toBe('papa@example.com');
	});
});
