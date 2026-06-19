import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { catches } from '$lib/server/db/schema';
import type { Catch, CatchConditions, Technique } from '$lib/catch/types';

type DB = ReturnType<typeof createDb>;

export const MAILLE_BAR_CM = 42;

// Relation taille-poids du bar (Dicentrarchus labrax) : W(g) ≈ 0.0085·L(cm)^3.05. Estimation.
export function estimateWeightG(lengthCm: number): number {
	return Math.round(0.0085 * Math.pow(lengthCm, 3.05));
}

export function isUndersized(lengthCm: number): boolean {
	return lengthCm < MAILLE_BAR_CM;
}

export interface NewCatch {
	userId: string;
	lengthCm: number;
	technique: Technique | null;
	lureBait: string | null;
	released: boolean;
	conditions: CatchConditions | null;
	caughtAt?: Date;
}

function rowToCatch(row: typeof catches.$inferSelect): Catch {
	return {
		id: row.id,
		userId: row.userId,
		caughtAt: row.caughtAt,
		lengthCm: row.lengthCm,
		weightEstG: row.weightEstG,
		technique: (row.technique as Technique) ?? null,
		lureBait: row.lureBait,
		released: row.released,
		conditions: row.conditionsJson ? (JSON.parse(row.conditionsJson) as CatchConditions) : null
	};
}

export function createCatch(db: DB, input: NewCatch): Catch {
	const now = new Date();
	const row = {
		id: randomUUID(),
		userId: input.userId,
		spotId: 'ile-dyeu',
		caughtAt: input.caughtAt ?? now,
		lengthCm: input.lengthCm,
		weightEstG: estimateWeightG(input.lengthCm),
		technique: input.technique,
		lureBait: input.lureBait,
		released: input.released,
		conditionsJson: input.conditions ? JSON.stringify(input.conditions) : null,
		createdAt: now
	};
	db.insert(catches).values(row).run();
	return rowToCatch(row as typeof catches.$inferSelect);
}

export function listCatches(db: DB, userId: string): Catch[] {
	return db
		.select()
		.from(catches)
		.where(eq(catches.userId, userId))
		.orderBy(desc(catches.caughtAt))
		.all()
		.map(rowToCatch);
}

export function computeRecords(db: DB, userId: string) {
	const all = listCatches(db, userId);
	const count = all.length;
	const biggestCm = all.reduce((m, c) => Math.max(m, c.lengthCm), 0);
	const biggest = all.find((c) => c.lengthCm === biggestCm) ?? null;
	const totalReleased = all.filter((c) => c.released).length;
	return { count, biggestCm, biggestKept: biggest ? !biggest.released : false, totalReleased };
}
