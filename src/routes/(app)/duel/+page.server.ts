import { sql, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, users, catches } from '$lib/server/db';

// Classement amical : tous les inscrits, classés par plus gros bar puis nombre de
// prises. Simple agrégation SQL + tri JS (volume de données faible). `user` garanti
// non-null par la garde (app)/+layout.server.ts.
export const load: PageServerLoad = async ({ locals }) => {
	const rows = db
		.select({
			id: users.id,
			name: users.name,
			biggestCm: sql<number | null>`max(${catches.lengthCm})`,
			count: sql<number>`count(${catches.id})`
		})
		.from(users)
		.leftJoin(catches, eq(catches.userId, users.id))
		.groupBy(users.id)
		.all();

	const leaderboard = rows
		.sort(
			(a, b) =>
				(b.biggestCm ?? 0) - (a.biggestCm ?? 0) ||
				b.count - a.count ||
				a.name.localeCompare(b.name)
		)
		.map((r, i) => ({
			rank: i + 1,
			name: r.name,
			biggestCm: r.biggestCm,
			count: r.count,
			isMe: r.id === locals.user!.id
		}));

	return { leaderboard };
};
