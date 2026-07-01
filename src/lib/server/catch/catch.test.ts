import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { estimateWeightG, isUndersized, createCatch, listCatches, computeRecords } from './catch';

function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE users (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT NOT NULL,
		avatar TEXT, spot_default_id TEXT, created_at INTEGER NOT NULL DEFAULT 0
	)`);
	db.run(sql`CREATE TABLE catches (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL, spot_id TEXT NOT NULL DEFAULT 'ile-dyeu',
		caught_at INTEGER NOT NULL, length_cm REAL NOT NULL, weight_est_g INTEGER NOT NULL,
		technique TEXT, lure_bait TEXT, released INTEGER NOT NULL DEFAULT 0,
		conditions_json TEXT, place TEXT, tide_trend TEXT, coefficient INTEGER, temp_c REAL,
		weather_note TEXT, from_boat INTEGER NOT NULL DEFAULT 0, companions_text TEXT,
		lat REAL, lng REAL, accuracy_m REAL, photo TEXT, notes TEXT, created_at INTEGER NOT NULL
	)`);
	db.run(sql`CREATE TABLE catch_companions (
		catch_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (catch_id, user_id)
	)`);
	return db;
}

function seedUser(db: ReturnType<typeof createDb>, id: string, name: string) {
	db.run(sql`INSERT INTO users (id, name, email, password_hash) VALUES (${id}, ${name}, ${id + '@x'}, 'x')`);
}

describe('helpers', () => {
	it('estime un poids croissant avec la taille', () => {
		expect(estimateWeightG(42)).toBeGreaterThan(500);
		expect(estimateWeightG(70)).toBeGreaterThan(estimateWeightG(42));
	});
	it('maille 42 cm', () => {
		expect(isUndersized(41.9)).toBe(true);
		expect(isUndersized(42)).toBe(false);
	});
});

describe('catch DB', () => {
	it('crée et liste les prises d’un utilisateur', () => {
		const db = freshDb();
		createCatch(db, { userId: 'u1', lengthCm: 55, technique: 'Leurre', lureBait: 'Stickbait', released: false, conditions: null });
		createCatch(db, { userId: 'u1', lengthCm: 38, technique: 'Surfcasting', lureBait: null, released: true, conditions: null });
		createCatch(db, { userId: 'u2', lengthCm: 60, technique: null, lureBait: null, released: false, conditions: null });
		const mine = listCatches(db, 'u1');
		expect(mine).toHaveLength(2);
		expect(mine[0].weightEstG).toBeGreaterThan(0);
	});
	it('calcule les records personnels', () => {
		const db = freshDb();
		createCatch(db, { userId: 'u1', lengthCm: 55, technique: 'Leurre', lureBait: null, released: false, conditions: null });
		createCatch(db, { userId: 'u1', lengthCm: 38, technique: null, lureBait: null, released: true, conditions: null });
		const r = computeRecords(db, 'u1');
		expect(r.count).toBe(2);
		expect(r.biggestCm).toBe(55);
		expect(r.totalReleased).toBe(1);
	});
	it('enregistre les notes de pêche et la géoloc', () => {
		const db = freshDb();
		seedUser(db, 'u1', 'Moi');
		createCatch(db, {
			userId: 'u1',
			lengthCm: 60,
			technique: 'Leurre',
			lureBait: 'Stickbait',
			released: false,
			conditions: null,
			place: 'Pointe des Corbeaux',
			tideTrend: 'rising',
			coefficient: 85,
			tempC: 17.5,
			weatherNote: 'Ensoleillé',
			fromBoat: true,
			companionsText: 'Papy',
			lat: 46.69,
			lng: -2.31,
			photo: 'abc.jpg',
			notes: 'Belle bagarre'
		});
		const c = listCatches(db, 'u1')[0];
		expect(c.place).toBe('Pointe des Corbeaux');
		expect(c.tideTrend).toBe('rising');
		expect(c.coefficient).toBe(85);
		expect(c.tempC).toBe(17.5);
		expect(c.fromBoat).toBe(true);
		expect(c.lat).toBe(46.69);
		expect(c.photo).toBe('abc.jpg');
		expect(c.notes).toBe('Belle bagarre');
	});
	it('tague des potes inscrits (join)', () => {
		const db = freshDb();
		seedUser(db, 'u1', 'Moi');
		seedUser(db, 'u2', 'Alice');
		seedUser(db, 'u3', 'Bob');
		createCatch(db, {
			userId: 'u1',
			lengthCm: 50,
			technique: null,
			lureBait: null,
			released: false,
			conditions: null,
			companionIds: ['u2', 'u3', 'u1'] // 'u1' (soi-même) ignoré
		});
		const c = listCatches(db, 'u1')[0];
		const names = c.companions.map((p) => p.name).sort();
		expect(names).toEqual(['Alice', 'Bob']);
	});
});
