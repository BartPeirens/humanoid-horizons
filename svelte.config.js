import adapterStatic from '@sveltejs/adapter-static';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: true
	},

	kit: {
		adapter: adapterStatic({
			pages: 'build',
			assets: 'build',
			fallback: '404.html'
		}),

		paths: isGitHubPages ? { base: '/humanoid-horizons' } : {}
	}
};

export default config;
