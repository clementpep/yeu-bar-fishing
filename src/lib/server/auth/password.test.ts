import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
	it('produit un hash différent du mot de passe en clair', async () => {
		const hash = await hashPassword('Bar2Yeu!');
		expect(hash).not.toBe('Bar2Yeu!');
		expect(hash.length).toBeGreaterThan(20);
	});

	it('vérifie un mot de passe correct', async () => {
		const hash = await hashPassword('Bar2Yeu!');
		expect(await verifyPassword(hash, 'Bar2Yeu!')).toBe(true);
	});

	it('rejette un mot de passe incorrect', async () => {
		const hash = await hashPassword('Bar2Yeu!');
		expect(await verifyPassword(hash, 'mauvais')).toBe(false);
	});

	it('renvoie false (sans throw) pour un hash invalide', async () => {
		expect(await verifyPassword('pas-un-hash', 'x')).toBe(false);
	});
});
