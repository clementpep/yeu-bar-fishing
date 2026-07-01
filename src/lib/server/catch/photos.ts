import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Répertoire de stockage des photos de prises. En prod (Docker), on le place à côté de
// la base SQLite pour profiter du même volume persistant ; en dev, dossier `uploads/`.
export function uploadsDir(): string {
	if (process.env.UPLOADS_PATH) return process.env.UPLOADS_PATH;
	const dbPath = process.env.DATABASE_PATH;
	return dbPath ? join(dirname(dbPath), 'uploads') : 'uploads';
}

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo

// Nom de fichier généré par nous : uuid + extension connue. Sert aussi de garde
// anti-traversée côté endpoint de lecture.
export const PHOTO_NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

/**
 * Enregistre une photo uploadée sur le disque. Retourne le nom de fichier stocké,
 * ou null si le champ est vide / invalide (la photo est optionnelle).
 */
export async function savePhoto(file: FormDataEntryValue | null): Promise<string | null> {
	if (!(file instanceof File) || file.size === 0) return null;
	const ext = EXT_BY_MIME[file.type];
	if (!ext) return null;
	if (file.size > MAX_BYTES) return null;

	const name = `${randomUUID()}.${ext}`;
	const dir = uploadsDir();
	await mkdir(dir, { recursive: true });
	const buf = Buffer.from(await file.arrayBuffer());
	await writeFile(join(dir, name), buf);
	return name;
}

const CONTENT_TYPE: Record<string, string> = {
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp'
};

/** Lit une photo par son nom de fichier. Retourne null si le nom est invalide/introuvable. */
export async function readPhoto(name: string): Promise<{ body: Buffer; contentType: string } | null> {
	if (!PHOTO_NAME_RE.test(name)) return null;
	const ext = name.split('.').pop()!;
	try {
		const body = await readFile(join(uploadsDir(), name));
		return { body, contentType: CONTENT_TYPE[ext] };
	} catch {
		return null;
	}
}
