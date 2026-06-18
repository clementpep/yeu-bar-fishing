// Applique les migrations Drizzle au démarrage du conteneur.
// N'utilise QUE des dépendances de production (better-sqlite3 + drizzle-orm),
// pas drizzle-kit (devDep), donc fonctionne dans l'image prod prunée.
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const path = process.env.DATABASE_PATH ?? 'data.sqlite';
const sqlite = new Database(path);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
sqlite.close();
console.log(`[migrate] migrations appliquées sur ${path}`);
