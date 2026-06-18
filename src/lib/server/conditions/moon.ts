import * as SunCalc from 'suncalc';
import { ILE_DYEU } from './spot';
import type { SunMoon } from '$lib/conditions/types';

// Phase suncalc : 0 = nouvelle, 0.25 = premier quartier, 0.5 = pleine, 0.75 = dernier quartier.
export function moonLabel(phase: number): string {
	const p = ((phase % 1) + 1) % 1; // normalise dans [0,1)
	if (p < 0.02 || p > 0.98) return 'Nouvelle lune';
	if (Math.abs(p - 0.25) < 0.02) return 'Premier quartier';
	if (Math.abs(p - 0.5) < 0.02) return 'Pleine lune';
	if (Math.abs(p - 0.75) < 0.02) return 'Dernier quartier';
	if (p < 0.25) return 'Premier croissant';
	if (p < 0.5) return 'Gibbeuse croissante';
	if (p < 0.75) return 'Gibbeuse décroissante';
	return 'Dernier croissant';
}

// suncalc type ses horaires `Date | null` (cas polaires) ; à 46°N ils existent toujours.
function req(d: Date | null, name: string): Date {
	if (!d) throw new Error(`suncalc: ${name} indisponible à cette latitude`);
	return d;
}

export function sunMoonFor(day: Date, lat = ILE_DYEU.lat, lng = ILE_DYEU.lng): SunMoon {
	const times = SunCalc.getTimes(day, lat, lng);
	const moonTimes = SunCalc.getMoonTimes(day, lat, lng);
	const illum = SunCalc.getMoonIllumination(day);
	return {
		sunrise: req(times.sunrise, 'sunrise'),
		sunset: req(times.sunset, 'sunset'),
		dawn: req(times.dawn, 'dawn'),
		dusk: req(times.dusk, 'dusk'),
		moonrise: moonTimes.rise ?? null,
		moonset: moonTimes.set ?? null,
		moonPhase: illum.phase,
		moonIllumination: illum.fraction,
		moonLabel: moonLabel(illum.phase)
	};
}
