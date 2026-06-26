import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapterStatic({
				pages: 'build',
				assets: 'build',
				fallback: '200.html'
			}),

			paths: process.env.GITHUB_PAGES === 'true' ? { base: '/humanoid-horizons' } : {}
		})
	]
});
