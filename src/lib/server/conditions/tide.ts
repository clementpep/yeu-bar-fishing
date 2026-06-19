import type { DayTides, TideExtreme, TidePoint, TideTrend } from '$lib/conditions/types';

export interface Constituent {
	name: string;
	amplitude: number;
	phase: number; // degrés, convention relative à EPOCH ci-dessous
}
export interface ConstituentsFile {
	meta: Record<string, unknown>;
	datum: number;
	constituents: Constituent[];
}

// Vitesses angulaires standard (degrés/heure) des constituantes.
// Doit matcher SPEEDS de scripts/fit-tide-constituents.mjs (mêmes noms).
const SPEEDS: Record<string, number> = {
	SA: 0.0410686,
	SSA: 0.0821373,
	MM: 0.5443747,
	MF: 1.0980331,
	Q1: 13.3986609,
	O1: 13.9430356,
	P1: 14.9589314,
	K1: 15.0410686,
	'2N2': 27.8953548,
	MU2: 27.9682084,
	N2: 28.4397295,
	NU2: 28.5125831,
	M2: 28.9841042,
	L2: 29.5284789,
	T2: 29.9589333,
	S2: 30.0,
	K2: 30.0821373,
	MN4: 57.4238337,
	M4: 57.9682084,
	MS4: 58.9841042,
	M6: 86.9523127
};

// Référence temporelle pour la convention de phase (UTC).
const EPOCH = Date.UTC(2000, 0, 1, 0, 0, 0);
const SLACK_WINDOW_MIN = 45;

export function createTideEngine(file: ConstituentsFile) {
	const predictAt = makePredictor(file);

	function predictHeights(start: Date, end: Date, stepMin: number): TidePoint[] {
		const out: TidePoint[] = [];
		for (let t = start.getTime(); t <= end.getTime(); t += stepMin * 60_000) {
			const time = new Date(t);
			out.push({ time, height: predictAt(time) });
		}
		return out;
	}

	function findExtremes(start: Date, end: Date): TideExtreme[] {
		// Détection par changement de pente sur un échantillonnage fin (5 min).
		const fine = predictHeights(start, end, 5);
		const ex: TideExtreme[] = [];
		for (let i = 1; i < fine.length - 1; i++) {
			const a = fine[i - 1].height;
			const b = fine[i].height;
			const c = fine[i + 1].height;
			if (b > a && b >= c) ex.push({ time: fine[i].time, height: b, type: 'high' });
			else if (b < a && b <= c) ex.push({ time: fine[i].time, height: b, type: 'low' });
		}
		return ex;
	}

	function tideStateAt(t: Date, extremes: TideExtreme[]): TideTrend {
		const near = extremes.some(
			(e) => Math.abs(e.time.getTime() - t.getTime()) <= SLACK_WINDOW_MIN * 60_000
		);
		if (near) return 'slack';
		const before = predictAt(new Date(t.getTime() - 5 * 60_000));
		const after = predictAt(new Date(t.getTime() + 5 * 60_000));
		return after >= before ? 'rising' : 'falling';
	}

	function coefficientForDay(day: Date): number {
		const start = new Date(day);
		start.setHours(0, 0, 0, 0);
		const end = new Date(start.getTime() + 24 * 3600_000);
		const ex = findExtremes(start, end);
		const highs = ex.filter((e) => e.type === 'high').map((e) => e.height);
		const lows = ex.filter((e) => e.type === 'low').map((e) => e.height);
		if (!highs.length || !lows.length) return 70;
		const range = Math.max(...highs) - Math.min(...lows);
		return normalizeCoefficient(range);
	}

	function dayTides(day: Date): DayTides {
		const start = new Date(day);
		start.setHours(0, 0, 0, 0);
		const end = new Date(start.getTime() + 24 * 3600_000);
		return {
			curve: predictHeights(start, end, 10),
			extremes: findExtremes(start, end),
			coefficient: coefficientForDay(day)
		};
	}

	return { predictHeights, findExtremes, tideStateAt, coefficientForDay, dayTides };
}

// --- helpers internes ---

// Somme harmonique (sans corrections nodales en v1 ; ajoutées en Task 4 pour la précision
// long terme validée contre SHOM). h(t) = datum + Σ A·cos(speed·t − phase), t en heures depuis EPOCH.
function makePredictor(file: ConstituentsFile): (t: Date) => number {
	const terms = file.constituents.map((c) => ({
		amplitude: c.amplitude,
		speed: SPEEDS[c.name] ?? 0,
		phase: c.phase
	}));
	return (t: Date) => {
		const hours = (t.getTime() - EPOCH) / 3600_000;
		let h = file.datum;
		for (const term of terms) {
			const angle = ((term.speed * hours - term.phase) * Math.PI) / 180;
			h += term.amplitude * Math.cos(angle);
		}
		return h;
	};
}

// Coefficient français : map linéaire marnage→coef calibrée vs coef SHOM Port-Joinville
// (régression sur 19-22/06/2026 : coef ≈ 19.9·marnage + 1), bornée 20–120.
function normalizeCoefficient(range: number): number {
	return Math.max(20, Math.min(120, Math.round(19.9 * range + 1)));
}
