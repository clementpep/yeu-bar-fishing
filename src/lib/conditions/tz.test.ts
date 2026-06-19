import { describe, it, expect } from 'vitest';
import { parisMidnight, parisMonth, fmtTime, fmtDate, cardinal, TZ } from './tz';

describe('tz', () => {
	it('parisMidnight retombe sur 00:00 heure de Paris', () => {
		const mid = parisMidnight(new Date('2026-06-19T09:33:00Z'));
		const hhmm = new Intl.DateTimeFormat('fr-FR', {
			timeZone: TZ,
			hour: '2-digit',
			minute: '2-digit'
		}).format(mid);
		expect(hhmm).toBe('00:00');
	});

	it('parisMonth est 0-indexé', () => {
		expect(parisMonth(new Date('2026-06-19T09:33:00Z'))).toBe(5); // juin
	});

	it('fmtTime formate en HH:MM (24h)', () => {
		// 08:36 UTC en juin = 10:36 à Paris (UTC+2)
		expect(fmtTime(new Date('2026-06-18T08:36:00Z'))).toBe('10:36');
	});

	it('fmtDate capitalise le jour', () => {
		expect(fmtDate(new Date('2026-06-18T12:00:00Z'))).toMatch(/^[A-ZÀ-Ý].* juin$/);
	});

	it('cardinal renvoie les points FR', () => {
		expect(cardinal(0)).toBe('N');
		expect(cardinal(315)).toBe('NO');
		expect(cardinal(225)).toBe('SO');
	});
});
