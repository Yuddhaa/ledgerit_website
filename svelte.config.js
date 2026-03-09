import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// If IS_CAPACITOR is true, use Static. Otherwise, use Vercel.
		adapter: process.env.IS_CAPACITOR
			? adapterStatic({
					pages: 'build',
					assets: 'build',
					fallback: 'index.html', // Essential for SPA mode
					precompress: false,
					strict: true
				})
			: adapterVercel(),

		// Capacitor usually expects the app to be at the root or a specific path
		// paths: {
		// 	base: ''
		// },

		prerender: {
			// This tells SvelteKit not to fail if it can't find
			// the dynamic [id] routes during the build
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
