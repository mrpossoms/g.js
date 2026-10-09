#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import { dev } from '../tools/dev.js';
import { bundle } from '../tools/bundle.js';

const root = fileURLToPath(new URL('..', import.meta.url));

const usage = `usage: g <command> [game dir] [options]

commands:
  dev   serve the game for development (default port 3001)
          --port <n>
  bake  build the game into a single self contained .html file
          -o, --out <file>   (default: <game dir>/dist/<name>.html)
          --no-minify

A game dir contains src/client.js, optionally src/server.js, and assets/`;

async function bake(game_dir, opts)
{
	game_dir = path.resolve(game_dir);
	const name = path.basename(game_dir);
	const out = path.resolve(opts.out || path.join(game_dir, 'dist', name + '.html'));

	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g-bake-'));
	try
	{
		const bundle_path = path.join(tmp, 'bundle.js');
		fs.writeFileSync(bundle_path, await bundle(path.join(game_dir, 'src', 'client.js'), { minify: !opts['no-minify'] }));

		const html = execFileSync('sh', [
			path.join(root, 'tools', 'bake.sh'),
			path.join(root, 'templates', 'index.html'),
			bundle_path,
			path.join(game_dir, 'assets'),
			name,
		], { maxBuffer: 1 << 30 });

		fs.mkdirSync(path.dirname(out), { recursive: true });
		fs.writeFileSync(out, html);
		console.log(path.relative(process.cwd(), out) + ' ' + (html.length / 1024).toFixed(0) + 'K');
	}
	finally
	{
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		port: { type: 'string' },
		out: { type: 'string', short: 'o' },
		'no-minify': { type: 'boolean' },
		help: { type: 'boolean', short: 'h' },
	},
});

const [command, game_dir = '.'] = positionals;

if (values.help || !command)
{
	console.log(usage);
	process.exit(values.help ? 0 : 1);
}

if (!fs.existsSync(path.join(game_dir, 'src', 'client.js')))
{
	console.error(`g: ${path.resolve(game_dir)} has no src/client.js\n\n${usage}`);
	process.exit(1);
}

switch (command)
{
	case 'dev': await dev(game_dir, { port: values.port }); break;
	case 'bake': await bake(game_dir, values); break;
	default:
		console.error(`g: unknown command '${command}'\n\n${usage}`);
		process.exit(1);
}
