// Crée/met à jour les 2 comptes de l'app à partir de variables d'environnement.
// Usage : définir les variables puis `npm run db:seed` (la base doit déjà être migrée).
// Variables : DATABASE_PATH (défaut data.sqlite),
//   SEED_USER1_EMAIL, SEED_USER1_NAME, SEED_USER1_PASSWORD,
//   SEED_USER2_EMAIL, SEED_USER2_NAME, SEED_USER2_PASSWORD.
import Database from 'better-sqlite3';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';

const ARGON = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };
const DB_PATH = process.env.DATABASE_PATH ?? 'data.sqlite';

function readUser(n) {
	const email = process.env[`SEED_USER${n}_EMAIL`];
	const name = process.env[`SEED_USER${n}_NAME`];
	const password = process.env[`SEED_USER${n}_PASSWORD`];
	if (!email || !name || !password) {
		throw new Error(`Variables manquantes pour l'utilisateur ${n} (SEED_USER${n}_EMAIL/NAME/PASSWORD).`);
	}
	if (password.length < 8) {
		throw new Error(`Mot de passe utilisateur ${n} trop court (min 8 caractères).`);
	}
	return { email: email.trim().toLowerCase(), name: name.trim(), password };
}

async function upsert(db, user) {
	const passwordHash = await hash(user.password, ARGON);
	const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
	if (existing) {
		db.prepare('UPDATE users SET name = ?, password_hash = ? WHERE email = ?')
			.run(user.name, passwordHash, user.email);
		console.log(`maj : ${user.email}`);
	} else {
		db.prepare(
			'INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
		).run(randomUUID(), user.name, user.email, passwordHash, Date.now());
		console.log(`créé : ${user.email}`);
	}
}

const db = new Database(DB_PATH);
const users = [readUser(1), readUser(2)];
for (const u of users) await upsert(db, u);
db.close();
console.log('Seed terminé.');
