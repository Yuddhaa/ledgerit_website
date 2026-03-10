import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Terminal from 'vite-plugin-terminal'; // 1. Import it

export default defineConfig({
    plugins: [tailwindcss(), sveltekit(), Terminal()],
    server: {
        allowedHosts: ["churchly-phebe-inconstantly.ngrok-free.dev"]
    }
});
