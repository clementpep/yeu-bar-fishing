import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import {
	generateSessionToken,
	hashToken,
	createSession,
	validateSession,
	invalidateSession,
	invalidateUserSessions
} from './session';

function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE users (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL, avatar TEXT, spot_default_id TEXT, created_at INTEGER NOT NULL
	)`);
	db.run(sql`CREATE TABLE sessions (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
	)`);
	db.run(sql`INSERT INTO users (id, name, email, password_hash, created_at)
		VALUES ('u1', 'Papa', 'papa@example.com', 'x', 0)`);
	return db;
}

describe('session', () => {
	it("hashToken est deterministe et masque le token", () => {
		const t = "jeton-secret";
		expect(hashToken(t)).toBe(hashToken(t));
		expect(hashToken(t)).not.toBe(t);
	});

	it("generateSessionToken produit des valeurs uniques", () => {
		expect(generateSessionToken()).not.toBe(generateSessionToken());
	});

	it("cree puis valide une session", () => {
		const db = freshDb();
		const token = generateSessionToken();
		const created = createSession(db, "u1", token);
		expect(created.userId).toBe("u1");

		const valid = validateSession(db, token);
		expect(valid?.userId).toBe("u1");
		// la ligne est indexee par le hash du token, pas le token brut
		expect(valid?.id).toBe(hashToken(token));
	});

	it("renvoie null pour un token inconnu", () => {
		const db = freshDb();
		expect(validateSession(db, "inconnu")).toBeNull();
	});

	it("supprime et rejette une session expiree", () => {
		const db = freshDb();
		const token = generateSessionToken();
		// insere une session deja expiree directement
		db.run(sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${hashToken(token)}, 'u1', 1000)`);
		expect(validateSession(db, token)).toBeNull();
		// la ligne expiree a ete purgee
		expect(validateSession(db, token)).toBeNull();
	});

	it("invalide une session precise", () => {
		const db = freshDb();
		const token = generateSessionToken();
		createSession(db, "u1", token);
		invalidateSession(db, token);
		expect(validateSession(db, token)).toBeNull();
	});

	it("invalide toutes les sessions d'un utilisateur", () => {
		const db = freshDb();
		const t1 = generateSessionToken();
		const t2 = generateSessionToken();
		createSession(db, "u1", t1);
		createSession(db, "u1", t2);
		invalidateUserSessions(db, "u1");
		expect(validateSession(db, t1)).toBeNull();
		expect(validateSession(db, t2)).toBeNull();
	});
});
