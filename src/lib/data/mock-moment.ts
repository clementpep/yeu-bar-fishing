import type { MomentData } from '$lib/types/conditions';

/**
 * ⚠️ DONNÉES FACTICES DE DÉMONSTRATION.
 * Servent uniquement à éprouver le design de l'écran « Le moment ».
 * À remplacer par le moteur de conditions réel (marées + météo + lune + score) au Plan 3.
 * Aucun appel réseau ici.
 */
export const mockMoment: MomentData = {
	spot: "Île d'Yeu · Port-Joinville",
	date: 'Mercredi 18 juin',
	score: 78,
	scoreWhy:
		'Gros coefficient (95), étale de pleine mer au lever du jour et vent de NO modéré : conditions très favorables au bar.',
	factors: [
		{ label: 'Coefficient', weight: 0.95 },
		{ label: 'Phase de marée', weight: 0.85 },
		{ label: 'Aube / crépuscule', weight: 0.8 },
		{ label: 'Vent & mer', weight: 0.6 },
		{ label: 'Lune', weight: 0.5 },
		{ label: 'Saison', weight: 0.85 }
	],
	tide: {
		points: [
			{ t: '04:12', height: 1.1, type: 'low' },
			{ t: '07:24', height: 2.8 },
			{ t: '10:36', height: 5.2, type: 'high' },
			{ t: '13:40', height: 2.9 },
			{ t: '16:48', height: 1.0, type: 'low' },
			{ t: '20:02', height: 3.0 },
			{ t: '22:54', height: 5.0, type: 'high' }
		],
		nowFraction: 0.34,
		coefficient: 95,
		nextEtale: 'Pleine mer à 10:36'
	},
	stats: [
		{ label: 'Vent', value: '15', unit: 'nds NO' },
		{ label: 'Mer', value: 'Belle', unit: '' },
		{ label: 'Lune', value: '34', unit: '%' },
		{ label: 'Eau', value: '18', unit: '°C' }
	],
	tip: {
		title: 'Conseil du jour',
		body: "À l'étale de pleine mer, privilégie un leurre de surface (stickbait) au lever du jour le long des roches de la Pointe du But : par mer belle, le bar chasse en surface."
	},
	windows: [
		{ label: 'Lever du soleil', time: '06:12' },
		{ label: 'Étale pleine mer', time: '10:36' },
		{ label: 'Étale basse mer', time: '16:48' },
		{ label: 'Coucher du soleil', time: '22:01' }
	]
};
