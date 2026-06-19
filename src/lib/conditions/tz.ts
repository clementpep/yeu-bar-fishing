// Utilitaires de fuseau : l'app s'affiche à l'heure de l'île d'Yeu (Europe/Paris),
// indépendamment du fuseau du serveur (le conteneur Dokploy tourne en UTC).
export const TZ = 'Europe/Paris';

/** Instant UTC correspondant à minuit (heure de Paris) du jour de `now`. */
export function parisMidnight(now: Date): Date {
	const paris = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
	const offset = now.getTime() - paris.getTime();
	paris.setHours(0, 0, 0, 0);
	return new Date(paris.getTime() + offset);
}

/** Mois (0–11) à l'heure de Paris. */
export function parisMonth(now: Date): number {
	return Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'numeric' }).format(now)) - 1;
}

/** "HH:MM" à l'heure de Paris. */
export function fmtTime(d: Date): string {
	return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
}

/** "Jeudi 19 juin" (heure de Paris, première lettre capitalisée). */
export function fmtDate(d: Date): string {
	const s = new Intl.DateTimeFormat('fr-FR', {
		timeZone: TZ,
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	}).format(d);
	return s.charAt(0).toUpperCase() + s.slice(1);
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
/** Point cardinal FR depuis un cap en degrés (0 = N). */
export function cardinal(deg: number): string {
	return COMPASS[Math.round(deg / 45) % 8];
}
