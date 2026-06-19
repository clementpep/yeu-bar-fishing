import { describe, it, expect } from 'vitest';
import { moonLabel, sunMoonFor } from './moon';

describe('moonLabel', () => {
	it('nomme la nouvelle lune et la pleine lune', () => {
		expect(moonLabel(0)).toBe('Nouvelle lune');
		expect(moonLabel(0.5)).toBe('Pleine lune');
		expect(moonLabel(1)).toBe('Nouvelle lune');
	});
	it('nomme les quartiers', () => {
		expect(moonLabel(0.25)).toBe('Premier quartier');
		expect(moonLabel(0.75)).toBe('Dernier quartier');
	});
});

describe('sunMoonFor', () => {
	it('renvoie des horaires cohérents pour un jour donné', () => {
		const sm = sunMoonFor(new Date('2026-06-21T12:00:00Z'));
		expect(sm.sunrise.getTime()).toBeLessThan(sm.sunset.getTime());
		expect(sm.moonPhase).toBeGreaterThanOrEqual(0);
		expect(sm.moonPhase).toBeLessThanOrEqual(1);
		expect(sm.moonIllumination).toBeGreaterThanOrEqual(0);
		expect(sm.moonIllumination).toBeLessThanOrEqual(1);
		expect(typeof sm.moonLabel).toBe('string');
	});
});
