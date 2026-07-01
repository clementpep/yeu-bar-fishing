// Maintenance des comptes utilisateurs (prod-safe : uniquement better-sqlite3).
//
// Usage (depuis le conteneur, DATABASE_PATH pointant sur la base) :
//   node scripts/manage-users.mjs list
//   node scripts/manage-users.mjs delete <email> [--force]
//
// `delete` supprime le compte et ses références (sessions, tags « avec qui »).
// Si le compte possède des prises, la suppression est refusée sauf `--force`
// (qui supprime alors aussi ses prises et les tags associés).
import Database from 'better-sqlite3';

const DB_PATH = process.env.DATABASE_PATH ?? 'data.sqlite';
const [cmd, arg, flag] = process.argv.slice(2);

const db = new Database(DB_PATH);

function list() {
	const rows = db
		.prepare(
			`SELECT u.id, u.name, u.email, u.created_at AS createdAt,
			        (SELECT COUNT(*) FROM catches c WHERE c.user_id = u.id) AS catches
			 FROM users u ORDER BY u.created_at ASC`
		)
		.all();
	if (!rows.length) {
		console.log('(aucun utilisateur)');
		return;
	}
	for (const r of rows) {
		const d = new Date(Number(r.createdAt)).toISOString().slice(0, 10);
		console.log(`${r.id}  ${d}  ${r.catches} prise(s)  ${r.name} <${r.email}>`);
	}
}

function del(email, force) {
	if (!email) {
		console.error('Email requis : node scripts/manage-users.mjs delete <email> [--force]');
		process.exit(1);
	}
	const target = email.trim().toLowerCase();
	const user = db.prepare('SELECT id, name, email FROM users WHERE lower(email) = ?').get(target);
	if (!user) {
		console.error(`Aucun utilisateur avec l'email « ${target} ».`);
		process.exit(1);
	}
	const catchCount = db
		.prepare('SELECT COUNT(*) AS n FROM catches WHERE user_id = ?')
		.get(user.id).n;
	if (catchCount > 0 && force !== '--force') {
		console.error(
			`Refus : ${user.name} <${user.email}> possède ${catchCount} prise(s). ` +
				`Relance avec --force pour supprimer le compte ET ses prises.`
		);
		process.exit(1);
	}

	const tx = db.transaction(() => {
		// Tags où ce compte est cité comme pote.
		db.prepare('DELETE FROM catch_companions WHERE user_id = ?').run(user.id);
		// Sessions.
		db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
		// Ses prises et leurs tags (si --force).
		const ids = db.prepare('SELECT id FROM catches WHERE user_id = ?').all(user.id).map((r) => r.id);
		for (const id of ids) {
			db.prepare('DELETE FROM catch_companions WHERE catch_id = ?').run(id);
		}
		db.prepare('DELETE FROM catches WHERE user_id = ?').run(user.id);
		db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
	});
	tx();
	console.log(`Supprimé : ${user.name} <${user.email}> (${catchCount} prise(s) retirée(s)).`);
}

if (cmd === 'list') list();
else if (cmd === 'delete') del(arg, flag);
else {
	console.log('Commandes : list | delete <email> [--force]');
	process.exit(1);
}
db.close();
