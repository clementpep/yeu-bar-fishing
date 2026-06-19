// Analyse harmonique (fit least-squares) d'une série marégraphique → constituantes.
// Prep one-time, hors runtime. Source des données : API IOC Sea Level Monitoring
// (station L'Herbaudière `herb`, Noirmoutier ; proxy pour Port-Joinville, cf. spec Plan 3).
// Les fichiers mensuels bruts sont dans scripts/.tidedata/ (non versionnés).
//
// Usage : node scripts/fit-tide-constituents.mjs
// Sortie : src/lib/server/conditions/data/port-joinville.constituents.json (constituantes
//          NON corrigées du proxy ; la correction Port-Joinville lag/ratio est appliquée
//          ensuite, cf. étape de calibration).

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATA_DIR = fileURLToPath(new URL('./.tidedata/', import.meta.url));
const OUT = fileURLToPath(
	new URL('../src/lib/server/conditions/data/port-joinville.constituents.json', import.meta.url)
);

// Vitesses angulaires (degrés/heure) — doivent matcher SPEEDS de src/lib/server/conditions/tide.ts.
const SPEEDS = {
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

const EPOCH = Date.UTC(2000, 0, 1, 0, 0, 0);

// --- 1. Charger et nettoyer la série ---
function loadSeries() {
	const files = readdirSync(DATA_DIR).filter((f) => f.startsWith('herb_') && f.endsWith('.json'));
	const seen = new Set();
	const pts = [];
	for (const f of files) {
		const rows = JSON.parse(readFileSync(DATA_DIR + f, 'utf8'));
		for (const r of rows) {
			if (r.sensor !== 'rad') continue;
			const h = Number(r.slevel);
			if (!Number.isFinite(h)) continue;
			const t = Date.parse(r.stime.replace(' ', 'T') + 'Z');
			if (!Number.isFinite(t) || seen.has(t)) continue;
			seen.add(t);
			pts.push({ t, h });
		}
	}
	pts.sort((a, b) => a.t - b.t);
	// Rejet d'aberrations grossières : écart > 6σ par rapport à la moyenne.
	const mean = pts.reduce((s, p) => s + p.h, 0) / pts.length;
	const sd = Math.sqrt(pts.reduce((s, p) => s + (p.h - mean) ** 2, 0) / pts.length);
	return pts.filter((p) => Math.abs(p.h - mean) <= 6 * sd);
}

// --- 2. Résolution d'un système linéaire (Gauss, pivot partiel) ---
function solve(A, b) {
	const n = b.length;
	for (let col = 0; col < n; col++) {
		let piv = col;
		for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
		[A[col], A[piv]] = [A[piv], A[col]];
		[b[col], b[piv]] = [b[piv], b[col]];
		const d = A[col][col];
		for (let r = 0; r < n; r++) {
			if (r === col) continue;
			const f = A[r][col] / d;
			for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
			b[r] -= f * b[col];
		}
	}
	return b.map((v, i) => v / A[i][i]);
}

// --- 3. Fit harmonique ---
function fit(pts) {
	const names = Object.keys(SPEEDS);
	// Colonnes : [1] + pour chaque constituante [cos, sin]
	const ncol = 1 + 2 * names.length;
	const omega = names.map((n) => (SPEEDS[n] * Math.PI) / 180); // rad/heure
	const XtX = Array.from({ length: ncol }, () => new Float64Array(ncol));
	const Xty = new Float64Array(ncol);

	for (const p of pts) {
		const th = (p.t - EPOCH) / 3_600_000; // heures depuis EPOCH
		const row = new Float64Array(ncol);
		row[0] = 1;
		for (let i = 0; i < names.length; i++) {
			row[1 + 2 * i] = Math.cos(omega[i] * th);
			row[2 + 2 * i] = Math.sin(omega[i] * th);
		}
		for (let r = 0; r < ncol; r++) {
			if (row[r] === 0) continue;
			Xty[r] += row[r] * p.h;
			for (let c = r; c < ncol; c++) XtX[r][c] += row[r] * row[c];
		}
	}
	for (let r = 0; r < ncol; r++) for (let c = 0; c < r; c++) XtX[r][c] = XtX[c][r];

	const coef = solve(
		XtX.map((r) => Array.from(r)),
		Array.from(Xty)
	);
	const datum = coef[0];
	const constituents = names.map((name, i) => {
		const a = coef[1 + 2 * i];
		const b = coef[2 + 2 * i];
		const amplitude = Math.hypot(a, b);
		let phase = (Math.atan2(b, a) * 180) / Math.PI;
		if (phase < 0) phase += 360;
		return { name, amplitude: round(amplitude, 4), phase: round(phase, 2) };
	});
	return { datum: round(datum, 4), constituents };
}

const round = (x, n) => Math.round(x * 10 ** n) / 10 ** n;

// --- 4. Exécution ---
const pts = loadSeries();
console.log(`points exploités : ${pts.length}`);
console.log(
	`période : ${new Date(pts[0].t).toISOString()} → ${new Date(pts[pts.length - 1].t).toISOString()}`
);
const { datum: rawDatum, constituents: rawConstituents } = fit(pts);

// --- 4b. Calibration Port-Joinville (proxy Noirmoutier → Port-Joinville) ---
// Dérivée par validation vs prédictions SHOM Port-Joinville (maree.info/123, 19-22/06/2026) :
//   - ratio de marnage SHOM/modèle ≈ 0.92
//   - niveau moyen Port-Joinville au-dessus du zéro hydrographique ≈ 3.25 m
//   - avance temporelle ≈ 8 min (le modèle Noirmoutier est ~8 min en retard sur Port-Joinville)
// On bake ces corrections dans les constituantes : le JSON EST le modèle Port-Joinville.
const HEIGHT_RATIO = 0.92;
const PJ_MEAN_LEVEL = 3.25;
const LEAD_MIN = 8; // avancer la courbe de 8 min
const datum = PJ_MEAN_LEVEL;
const constituents = rawConstituents.map((c) => {
	let phase = c.phase - SPEEDS[c.name] * (LEAD_MIN / 60); // g' = g - w·δ
	phase = ((phase % 360) + 360) % 360;
	return { name: c.name, amplitude: round(c.amplitude * HEIGHT_RATIO, 4), phase: round(phase, 2) };
});

const out = {
	meta: {
		source: "IOC Sea Level Station Monitoring Facility (VLIZ) — station `herb` (L'Herbaudière, Noirmoutier)",
		note: "Proxy calibré pour Port-Joinville (Île d'Yeu, ~40 km). Corrections (ratio/niveau/lag) bakées, validées vs SHOM.",
		license: 'Données niveau marin réseau public IOC/VLIZ — usage non commercial (app perso).',
		method: 'Fit harmonique least-squares (20 constituantes, ~1 an), sans corrections nodales (v1).',
		calibration: { heightRatio: HEIGHT_RATIO, pjMeanLevel: PJ_MEAN_LEVEL, leadMinutes: LEAD_MIN },
		validation:
			'vs SHOM Port-Joinville 19-22/06/2026 : horaires PM/BM ~±10 min (jusqu’à ~±20 min en mortes-eaux), hauteurs ±0,1 m.',
		rawDatumNoirmoutier: rawDatum,
		fittedAt: new Date().toISOString()
	},
	datum,
	constituents
};
mkdirSync(fileURLToPath(new URL('../src/lib/server/conditions/data/', import.meta.url)), {
	recursive: true
});
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`datum (niveau moyen) : ${datum} m`);
console.log('principales constituantes (amplitude m) :');
for (const c of [...constituents].sort((a, b) => b.amplitude - a.amplitude).slice(0, 6)) {
	console.log(`  ${c.name.padEnd(4)} A=${c.amplitude.toFixed(3)}  g=${c.phase.toFixed(1)}°`);
}
console.log(`écrit → ${OUT}`);
