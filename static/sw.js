// Kill-switch service worker.
//
// Contexte : un ancien service worker (Workbox, généré par vite-plugin-pwa)
// précachait l'app shell et le servait pour TOUTES les navigations. Sur les PWA
// déjà installées, ce shell périmé postait vers des routes sans action →
// « POST method not allowed. No form actions exist for this page ».
//
// Retirer le plugin ne suffit pas : un SW déjà enregistré continue de tourner.
// Ce fichier, servi à la même URL (/sw.js), prend la main sur l'ancien lors de
// sa prochaine vérification de mise à jour, purge tous les caches, se désinscrit
// puis recharge les pages ouvertes — qui repartent alors 100 % sur le réseau (SSR).
//
// L'offline (re)viendra proprement au Plan 7.

self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// 1. Purge tous les caches laissés par l'ancien SW.
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));

			// 2. Prend le contrôle des pages déjà ouvertes, puis se désinscrit.
			await self.clients.claim();
			await self.registration.unregister();

			// 3. Recharge les pages : libérées du SW, elles repartent du serveur.
			const clients = await self.clients.matchAll({ type: 'window' });
			for (const client of clients) {
				try {
					client.navigate(client.url);
				} catch {
					// Navigation impossible (page en cours de fermeture) : sans gravité.
				}
			}
		})()
	);
});
