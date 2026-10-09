import * as esbuild from 'esbuild';

// Bundles a game's client entry point (and everything it imports, including
// g.js) into a single browser script. Returns the script's source text.
export async function bundle(entry, opts = {})
{
	const result = await esbuild.build({
		entryPoints: [entry],
		bundle: true,
		format: 'iife',
		target: 'es2020',
		write: false,
		minify: !!opts.minify,
		sourcemap: opts.sourcemap ? 'inline' : false,
		logLevel: 'error',
	});

	return result.outputFiles[0].text;
}
