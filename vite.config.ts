import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	clearScreen: false,
	server: {
		port: 5173,
		strictPort: true
	},
	plugins: [tailwindcss(), sveltekit()]
});
