import { describe, it, expect } from 'vitest';
import { appName } from './smoke';

describe('smoke', () => {
	it('expose le nom de l\'app', () => {
		expect(appName()).toBe("Bar d'Yeu");
	});
});
