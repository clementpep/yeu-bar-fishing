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

// Vitesses angulaires standard (degrés/heure) des constituantes courantes.
const SPEEDS: Record<string, number> = {
	M2: 28.984104,
	S2: 30.0,
	N2: 28.43973,
	K2: 30.082137,
	K1: 15.041069,
	O1: 13.943035,
	P1: 14.958931,
	Q1: 13.398661,
	M4: 57.968208,
	MS4: 58.984104
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
		return normalizeCoefficient(range, file);
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

// Normalisation du coefficient français (VE≈95–120, ME≈20–45), calibrée en Task 4 vs SHOM.
function normalizeCoefficient(range: number, file: ConstituentsFile): number {
	const m2 = file.constituents.find((x) => x.name === 'M2')?.amplitude ?? 1.8;
	const c = 20 + (range / (2 * m2)) * 50;
	return Math.max(20, Math.min(120, Math.round(c)));
}
