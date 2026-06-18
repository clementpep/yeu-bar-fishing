import { hash, verify } from '@node-rs/argon2';

// Paramètres OWASP-raisonnables pour argon2id.
const OPTIONS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
	return hash(password, OPTIONS);
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
	try {
		return await verify(stored, password, OPTIONS);
	} catch {
		return false;
	}
}
