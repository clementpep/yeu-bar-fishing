import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export function createDb(path = 'data.sqlite') {
	const sqlite = new Database(path);
	sqlite.pragma('journal_mode = WAL');
	return drizzle(sqlite, { schema });
}

export const db = createDb(process.env.DATABASE_PATH ?? 'data.sqlite');

export * from './schema';
