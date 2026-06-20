import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// PWA / service worker volontairement retirés (Plan 7 les réintroduira proprement).
// L'ancien SW Workbox servait un shell périmé → POST vers des routes sans action.
// Un kill-switch (static/sw.js) désinscrit les SW déjà installés ; le manifest
// statique (static/manifest.webmanifest) conserve l'identité installable.
export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined
});
