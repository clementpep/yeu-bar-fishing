import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			workbox: {
				// App SSR + auth + form actions : NE PAS servir un shell caché pour les
				// navigations (sinon un client PWA installé sert une page périmée qui POST
				// vers une route sans action → « No form actions exist for this page »).
				// Les navigations passent toujours par le serveur (auth/SSR/actions corrects).
				// L'offline avancé (navigation hors-ligne) sera traité au Plan 7.
				navigateFallback: null,
				cleanupOutdatedCaches: true
			},
			manifest: {
				name: "Bar d'Yeu",
				short_name: "Bar d'Yeu",
				description: 'Assistant de pêche au bar — île d\'Yeu',
				lang: 'fr',
				start_url: '/',
				display: 'standalone',
				background_color: '#0A1722',
				theme_color: '#0A1722',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{ src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			}
		})
	],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined
});
