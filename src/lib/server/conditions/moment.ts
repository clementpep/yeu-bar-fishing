import type { DayConditions } from '$lib/conditions/types';
import type { MomentData, TidePoint } from '$lib/types/conditions';
import { fmtDate, fmtTime, cardinal } from '$lib/conditions/tz';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const RATING_WORD: Record<string, string> = {
	excellent: 'très favorables',
	bon: 'favorables',
	moyen: 'moyennes',
	faible: 'difficiles'
};

function seaLabel(h: number | null): string {
	if (h == null) return '—';
	if (h < 0.5) return 'Calme';
	if (h < 1.25) return 'Belle';
	if (h < 2.5) return 'Peu agitée';
	if (h < 4) return 'Agitée';
	return 'Forte';
}

function moonWeight(phase: number): number {
	const dist = Math.min(Math.abs(phase), Math.abs(phase - 0.5), Math.abs(phase - 1));
	return clamp01(1 - (dist / 0.25) * 0.6);
}

/** Transforme l'objet de domaine `DayConditions` en données d'affichage `MomentData`. */
export function toMomentData(c: DayConditions, now: Date): MomentData {
	const has = (k: string) => c.score.factors.some((f) => f.key === k);
	const get = (k: string) => c.score.factors.find((f) => f.key === k)?.contribution ?? 0;
	const w = c.weather;

	// Score « pourquoi » : principaux facteurs positifs + verdict.
	const word = RATING_WORD[c.score.rating] ?? 'moyennes';
	const positives = c.score.factors
		.filter((f) => f.contribution > 0)
		.sort((a, b) => b.contribution - a.contribution)
		.slice(0, 3)
		.map((f) => f.label);
	const scoreWhy = positives.length
		? `${positives.join(', ')} : conditions ${word} au bar.`
		: `Conditions ${word} au bar.`;

	// 6 barres de facteurs (poids 0..1) cohérentes avec le score.
	const factors = [
		{ label: 'Coefficient', weight: clamp01(c.tides.coefficient / 120) },
		{
			label: 'Phase de marée',
			weight: clamp01((has('tide-moving') ? 0.7 : 0.35) + (has('tide-extreme') ? 0.3 : 0))
		},
		{ label: 'Aube / crépuscule', weight: has('solar') ? 0.95 : 0.4 },
		{
			label: 'Vent & mer',
			weight: w ? clamp01(1 - w.windSpeedKmh / 50 - (w.waveHeightM ?? 0) / 4) : 0.5
		},
		{ label: 'Lune', weight: moonWeight(c.sunMoon.moonPhase) },
		{ label: 'Saison', weight: get('season') > 0 ? 0.85 : 0.4 }
	];

	// Courbe : échantillons (ligne lisse) + marquage des étales sur l'échantillon le plus proche.
	const points: TidePoint[] = c.tides.curve.map((p) => ({ t: fmtTime(p.time), height: round(p.height, 2) }));
	for (const e of c.tides.extremes) {
		let bi = 0;
		let bd = Infinity;
		for (let i = 0; i < c.tides.curve.length; i++) {
			const d = Math.abs(c.tides.curve[i].time.getTime() - e.time.getTime());
			if (d < bd) {
				bd = d;
				bi = i;
			}
		}
		points[bi] = { t: fmtTime(e.time), height: round(e.height, 2), type: e.type };
	}

	// Prochaine étale.
	const upcoming = c.tides.extremes.find((e) => e.time.getTime() > now.getTime()) ?? c.tides.extremes.at(-1);
	const nextEtale = upcoming
		? `${upcoming.type === 'high' ? 'Pleine mer' : 'Basse mer'} à ${fmtTime(upcoming.time)}`
		: '';

	const nowFraction = clamp01((now.getTime() - c.day.getTime()) / 86_400_000);

	const stats = [
		{ label: 'Vent', value: w ? `${Math.round(w.windSpeedKmh)}` : '—', unit: w ? `km/h ${cardinal(w.windDirDeg)}` : '' },
		{ label: 'Mer', value: seaLabel(w?.waveHeightM ?? null), unit: '' },
		{ label: 'Lune', value: `${Math.round(c.sunMoon.moonIllumination * 100)}`, unit: '%' },
		{ label: 'Air', value: w ? `${Math.round(w.tempC)}` : '—', unit: w ? '°C' : '' }
	];

	const windows = c.windows.map((win) => ({
		label: win.reason,
		time: fmtTime(new Date((win.from.getTime() + win.to.getTime()) / 2))
	}));

	return {
		spot: c.spot.name,
		date: fmtDate(c.day),
		score: c.score.value,
		scoreWhy,
		factors,
		tide: { points, nowFraction, coefficient: c.tides.coefficient, nextEtale },
		stats,
		tip: { title: 'Conseil du jour', body: c.tip },
		windows
	};
}
