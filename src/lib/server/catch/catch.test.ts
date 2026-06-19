import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { estimateWeightG, isUndersized, createCatch, listCatches, computeRecords } from './catch';

function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE catches (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL, spot_id TEXT NOT NULL DEFAULT 'ile-dyeu',
		caught_at INTEGER NOT NULL, length_cm REAL NOT NULL, weight_est_g INTEGER NOT NULL,
		technique TEXT, lure_bait TEXT, released INTEGER NOT NULL DEFAULT 0,
		conditions_json TEXT, created_at INTEGER NOT NULL
	)`);
	return db;
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
});
