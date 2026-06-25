import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const isGhPages = process.env.GHPAGES === 'true';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapterStatic({
				pages: isGhPages ? 'docs' : 'build',
				assets: isGhPages ? 'docs' : 'build',
				fallback: '404.html'
			}),

			paths: isGhPages ? { base: '/humanoid-horizons' } : {}
		})
	]
});
