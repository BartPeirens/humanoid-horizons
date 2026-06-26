import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: true
	},

	kit: {
		adapter: isGitHubPages
			? adapterStatic({
					pages: 'build',
					assets: 'build',
					fallback: '404.html'
				})
			: adapterNode(),

		paths: isGitHubPages ? { base: '/humanoid-horizons' } : {}
	}
};

export default config;
