// Valide le modèle harmonique (proxy Noirmoutier) contre les prédictions SHOM Port-Joinville
// et estime la correction proxy (lag temporel + ratio d'amplitude).
// Usage : node scripts/validate-tide.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const JSON_PATH = fileURLToPath(
	new URL('../src/lib/server/conditions/data/port-joinville.constituents.json', import.meta.url)
);
const file = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

const SPEEDS = {
	SA: 0.0410686, SSA: 0.0821373, MM: 0.5443747, MF: 1.0980331, Q1: 13.3986609,
	O1: 13.9430356, P1: 14.9589314, K1: 15.0410686, '2N2': 27.8953548, MU2: 27.9682084,
	N2: 28.4397295, NU2: 28.5125831, M2: 28.9841042, L2: 29.5284789, T2: 29.9589333,
	S2: 30.0, K2: 30.0821373, MN4: 57.4238337, M4: 57.9682084, MS4: 58.9841042, M6: 86.9523127
};
const EPOCH = Date.UTC(2000, 0, 1, 0, 0, 0);
const lag = (file.meta.lagMinutes ?? 0) * 60_000;
const ratio = file.meta.heightRatio ?? 1;

function predict(t) {
	const th = (t - lag - EPOCH) / 3_600_000;
	let h = 0;
	for (const c of file.constituents) {
		const w = (SPEEDS[c.name] * Math.PI) / 180;
		h += c.amplitude * Math.cos(w * th - (c.phase * Math.PI) / 180);
	}
	return file.datum + h * ratio;
}

// Extrema sur un jour local (UTC+2), échantillonnage 1 min.
function extremesLocalDay(yyyy, mm, dd) {
	const startUTC = Date.UTC(yyyy, mm - 1, dd, 0, 0, 0) - 2 * 3600_000; // 00:00 local = UTC-2
	const ex = [];
	let prev = predict(startUTC - 60_000);
	let cur = predict(startUTC);
	for (let i = 1; i <= 24 * 60; i++) {
		const t = startUTC + i * 60_000;
		const next = predict(t);
		if (cur > prev && cur >= next) ex.push({ t: t - 60_000, h: cur, type: 'PM' });
		else if (cur < prev && cur <= next) ex.push({ t: t - 60_000, h: cur, type: 'BM' });
		prev = cur; cur = next;
	}
	return ex;
}

function localHHMM(t) {
	const d = new Date(t + 2 * 3600_000);
	return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
function toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }

// Référence SHOM Port-Joinville (heure locale UTC+2, maree.info/123)
const SHOM = [
	{ d: [2026, 6, 19], ev: [['BM', '02:28', 0.80], ['PM', '08:44', 4.64], ['BM', '14:44', 1.12], ['PM', '20:57', 4.83]] },
	{ d: [2026, 6, 20], ev: [['BM', '03:20', 1.03], ['PM', '09:37', 4.42], ['BM', '15:38', 1.33], ['PM', '21:48', 4.59]] },
	{ d: [2026, 6, 21], ev: [['BM', '04:12', 1.30], ['PM', '10:33', 4.22], ['BM', '16:33', 1.55], ['PM', '22:43', 4.36]] },
	{ d: [2026, 6, 22], ev: [['BM', '05:08', 1.55], ['PM', '11:39', 4.07], ['BM', '17:31', 1.73], ['PM', '23:49', 4.17]] }
];

const dt = [];
const rangeRatios = [];
console.log(`lag=${file.meta.lagMinutes} min, ratio=${ratio}\n`);
for (const day of SHOM) {
	const pred = extremesLocalDay(...day.d);
	console.log(`${day.d.join('-')}`);
	for (const [type, hhmm, h] of day.ev) {
		const ref = toMin(hhmm);
		// extrême prédit le plus proche en temps, même type
		let best = null, bestd = 1e9;
		for (const p of pred) {
			if (p.type !== type) continue;
			const pm = toMin(localHHMM(p.t));
			if (Math.abs(pm - ref) < bestd) { bestd = Math.abs(pm - ref); best = p; }
		}
		if (best) {
			const pm = localHHMM(best.t);
			const delta = toMin(pm) - ref;
			dt.push(delta);
			console.log(`  ${type} SHOM ${hhmm} (${h}m) | prévu ${pm} (${best.h.toFixed(2)}m) | Δt=${delta>=0?'+':''}${delta} min`);
		}
	}
	// ratio de marnage du jour
	const phs = pred.filter((p) => p.type === 'PM').map((p) => p.h);
	const bms = pred.filter((p) => p.type === 'BM').map((p) => p.h);
	const predRange = Math.max(...phs) - Math.min(...bms);
	const refPh = Math.max(...day.ev.filter((e) => e[0] === 'PM').map((e) => e[2]));
	const refBm = Math.min(...day.ev.filter((e) => e[0] === 'BM').map((e) => e[2]));
	rangeRatios.push((refPh - refBm) / predRange);
}
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`\nΔt moyen = ${mean(dt).toFixed(1)} min (|max| ${Math.max(...dt.map(Math.abs))})`);
console.log(`ratio de marnage SHOM/prévu moyen = ${mean(rangeRatios).toFixed(3)}`);
