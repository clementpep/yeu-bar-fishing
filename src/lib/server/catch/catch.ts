import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { catches, catchCompanions, users } from '$lib/server/db/schema';
import {
	MAILLE_BAR_CM,
	type Catch,
	type CatchConditions,
	type Companion,
	type Technique,
	type TideTrend
} from '$lib/catch/types';

type DB = ReturnType<typeof createDb>;

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
	// Notes de pêche (toutes optionnelles)
	place?: string | null;
	tideTrend?: TideTrend | null;
	coefficient?: number | null;
	tempC?: number | null;
	weatherNote?: string | null;
	companionsText?: string | null;
	companionIds?: string[];
	lat?: number | null;
	lng?: number | null;
	accuracyM?: number | null;
	photo?: string | null;
	notes?: string | null;
}

type CatchDbRow = typeof catches.$inferSelect;

function rowToCatch(row: CatchDbRow, companions: Companion[] = []): Catch {
	return {
		id: row.id,
		userId: row.userId,
		caughtAt: row.caughtAt,
		lengthCm: row.lengthCm,
		weightEstG: row.weightEstG,
		technique: (row.technique as Technique) ?? null,
		lureBait: row.lureBait,
		released: row.released,
		conditions: row.conditionsJson ? (JSON.parse(row.conditionsJson) as CatchConditions) : null,
		place: row.place,
		tideTrend: (row.tideTrend as TideTrend) ?? null,
		coefficient: row.coefficient,
		tempC: row.tempC,
		weatherNote: row.weatherNote,
		companionsText: row.companionsText,
		companions,
		lat: row.lat,
		lng: row.lng,
		accuracyM: row.accuracyM,
		photo: row.photo,
		notes: row.notes
	};
}

export function createCatch(db: DB, input: NewCatch): Catch {
	const now = new Date();
	const id = randomUUID();
	const row = {
		id,
		userId: input.userId,
		spotId: 'ile-dyeu',
		caughtAt: input.caughtAt ?? now,
		lengthCm: input.lengthCm,
		weightEstG: estimateWeightG(input.lengthCm),
		technique: input.technique,
		lureBait: input.lureBait,
		released: input.released,
		conditionsJson: input.conditions ? JSON.stringify(input.conditions) : null,
		place: input.place ?? null,
		tideTrend: input.tideTrend ?? null,
		coefficient: input.coefficient ?? null,
		tempC: input.tempC ?? null,
		weatherNote: input.weatherNote ?? null,
		companionsText: input.companionsText ?? null,
		lat: input.lat ?? null,
		lng: input.lng ?? null,
		accuracyM: input.accuracyM ?? null,
		photo: input.photo ?? null,
		notes: input.notes ?? null,
		createdAt: now
	};
	db.insert(catches).values(row).run();

	const ids = [...new Set(input.companionIds ?? [])].filter((cid) => cid && cid !== input.userId);
	if (ids.length) {
		db.insert(catchCompanions)
			.values(ids.map((userId) => ({ catchId: id, userId })))
			.run();
	}

	const companions = ids.length ? loadCompanions(db, [id]).get(id) ?? [] : [];
	return rowToCatch(row as CatchDbRow, companions);
}

/** Charge les potes tagués pour un ensemble de prises, groupés par catchId. */
function loadCompanions(db: DB, catchIds: string[]): Map<string, Companion[]> {
	const map = new Map<string, Companion[]>();
	if (catchIds.length === 0) return map;
	const rows = db
		.select({
			catchId: catchCompanions.catchId,
			id: users.id,
			name: users.name
		})
		.from(catchCompanions)
		.innerJoin(users, eq(users.id, catchCompanions.userId))
		.where(inArray(catchCompanions.catchId, catchIds))
		.all();
	for (const r of rows) {
		const list = map.get(r.catchId) ?? [];
		list.push({ id: r.id, name: r.name });
		map.set(r.catchId, list);
	}
	return map;
}

/** Récupère une prise appartenant à l'utilisateur, ou null. */
export function getCatch(db: DB, userId: string, id: string): Catch | null {
	const row = db
		.select()
		.from(catches)
		.where(and(eq(catches.id, id), eq(catches.userId, userId)))
		.get();
	if (!row) return null;
	return rowToCatch(row, loadCompanions(db, [id]).get(id) ?? []);
}

/** Champs modifiables d'une prise. `photo` : undefined = inchangée, null = retirée. */
export interface CatchUpdate {
	lengthCm: number;
	technique: Technique | null;
	lureBait: string | null;
	released: boolean;
	place: string | null;
	tideTrend: TideTrend | null;
	coefficient: number | null;
	tempC: number | null;
	weatherNote: string | null;
	companionsText: string | null;
	companionIds: string[];
	lat: number | null;
	lng: number | null;
	accuracyM: number | null;
	notes: string | null;
	photo?: string | null;
}

/** Met à jour une prise (si elle appartient à l'utilisateur). Retourne false si absente. */
export function updateCatch(db: DB, userId: string, id: string, input: CatchUpdate): boolean {
	const existing = db
		.select({ id: catches.id })
		.from(catches)
		.where(and(eq(catches.id, id), eq(catches.userId, userId)))
		.get();
	if (!existing) return false;

	const set: Partial<CatchDbRow> = {
		lengthCm: input.lengthCm,
		weightEstG: estimateWeightG(input.lengthCm),
		technique: input.technique,
		lureBait: input.lureBait,
		released: input.released,
		place: input.place,
		tideTrend: input.tideTrend,
		coefficient: input.coefficient,
		tempC: input.tempC,
		weatherNote: input.weatherNote,
		companionsText: input.companionsText,
		lat: input.lat,
		lng: input.lng,
		accuracyM: input.accuracyM,
		notes: input.notes
	};
	// photo : ne toucher la colonne que si explicitement fournie (remplacement ou retrait).
	if (input.photo !== undefined) set.photo = input.photo;

	db.update(catches).set(set).where(eq(catches.id, id)).run();

	// Remplace l'ensemble des potes tagués.
	db.delete(catchCompanions).where(eq(catchCompanions.catchId, id)).run();
	const ids = [...new Set(input.companionIds ?? [])].filter((cid) => cid && cid !== userId);
	if (ids.length) {
		db.insert(catchCompanions)
			.values(ids.map((uid) => ({ catchId: id, userId: uid })))
			.run();
	}
	return true;
}

/**
 * Supprime une prise (si elle appartient à l'utilisateur) et ses potes tagués.
 * Retourne le nom de fichier de la photo à effacer du disque, ou null.
 */
export function deleteCatch(db: DB, userId: string, id: string): { photo: string | null } | null {
	const row = db
		.select({ photo: catches.photo })
		.from(catches)
		.where(and(eq(catches.id, id), eq(catches.userId, userId)))
		.get();
	if (!row) return null;
	db.delete(catchCompanions).where(eq(catchCompanions.catchId, id)).run();
	db.delete(catches).where(eq(catches.id, id)).run();
	return { photo: row.photo };
}

export function listCatches(db: DB, userId: string): Catch[] {
	const rows = db
		.select()
		.from(catches)
		.where(eq(catches.userId, userId))
		.orderBy(desc(catches.caughtAt))
		.all();
	const companions = loadCompanions(
		db,
		rows.map((r) => r.id)
	);
	return rows.map((r) => rowToCatch(r, companions.get(r.id) ?? []));
}

export function computeRecords(db: DB, userId: string) {
	const all = listCatches(db, userId);
	const count = all.length;
	const biggestCm = all.reduce((m, c) => Math.max(m, c.lengthCm), 0);
	const biggest = all.find((c) => c.lengthCm === biggestCm) ?? null;
	const totalReleased = all.filter((c) => c.released).length;
	return { count, biggestCm, biggestKept: biggest ? !biggest.released : false, totalReleased };
}
