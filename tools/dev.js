import path from 'path';
import fs from 'fs';
import http from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import express from 'express';
import socket_io from 'socket.io';
import { bundle } from './bundle.js';

const template_path = fileURLToPath(new URL('../templates/index.html', import.meta.url));
const favicon_path = fileURLToPath(new URL('../templates/favicon.ico', import.meta.url));

/**
 * Lists every file in dir (recursively) as a path relative to dir. These are
 * the names the client's asset loader uses, e.g. 'imgs/foo.png'
 */
export function list_assets(dir)
{
	function walk(rel)
	{
		var results = [];
		try
		{
			for (const name of fs.readdirSync(path.join(dir, rel)).sort())
			{
				if (name.startsWith('.')) { continue; }
				const file = rel ? rel + '/' + name : name;
				if (fs.statSync(path.join(dir, file)).isDirectory()) { results = results.concat(walk(file)); }
				else { results.push(file); }
			}
		}
		catch(e)
		{
			console.error('Could not walk ' + path.join(dir, rel) + ' ' + e);
		}
		return results;
	};

	return walk('');
}

/**
 * Serves the game in game_dir for development. Expects:
 *   src/client.js  browser entry point, bundled on every page load
 *   src/server.js  optional, authoritative game server module
 *   assets/        served as-is, and listed for the client's asset loader on
 *                  every page load
 *   asset-map.json optional, watches folders and runs a command on changes
 */
export async function dev(game_dir, opts = {})
{
	game_dir = path.resolve(game_dir);
	const client_path = path.join(game_dir, 'src', 'client.js');
	const server_path = path.join(game_dir, 'src', 'server.js');
	const assets_dir = path.join(game_dir, 'assets');
	const name = path.basename(game_dir);

	const app = express();
	const server = http.Server(app);
	const has_server = fs.existsSync(server_path);
	const game = has_server ? (await import(server_path)).default : null;

	function render()
	{
		const parts = {
			'<!-- g:title -->': name,
			// socket.io is only included for games with a server, so games
			// without one run offline exactly as they would when baked
			'<!-- g:head -->': has_server ? '<script src="/socket.io/socket.io.js"></script>' : '',
			'<!-- g:assets -->': '<script>const asset_list = ' + JSON.stringify(list_assets(assets_dir)) + ';</script>',
			'<!-- g:script -->': '<script src="/client.js"></script>',
		};

		var html = fs.readFileSync(template_path, 'utf8');
		for (const marker in parts) { html = html.replace(marker, parts[marker]); }
		return html;
	}

	app.get('/', (req, res) => {
		res.send(render());
	});

	app.get('/client.js', async (req, res) => {
		try
		{
			res.type('application/javascript').send(await bundle(client_path, { sourcemap: true }));
		}
		catch (e)
		{
			// show build errors in the browser console too
			res.type('application/javascript').send('console.error(' + JSON.stringify(e.message) + ');');
		}
	});

	app.get('/favicon.ico', (req, res) => res.sendFile(favicon_path));

	app.get('/reload', (req, res) => {
		// allow game server to initialize game state, etc
		if (game) { game.setup(game.state); }
		res.send(render());
	});

	app.use(express.static(assets_dir));

	if (game)
	{
		const io = socket_io(server);

		function new_player_id()
		{
			var id = null;
			do
			{
				id = Math.floor(Math.random() * 4096);
			}
			while (game.players[id] != undefined);

			return id;
		}

		// allow game server to initialize game state, etc
		game.setup(game.state);

		// socket io setup
		io.on('connection', function(player) {
			var player_id = new_player_id();

			player.id = player_id;
			game.players[player_id] = player;

			game.player.connected(player, game.state, game.players);

			player.on('disconnect', function() {
				game.player.disconnected(player, game.state);
				delete game.players[player_id];
			});
		});

		// game mainloop
		const dt = 1 / 100;
		var msg = {
			rate: 1 / 30,
			time_since_last: 1,
		};
		setInterval(function() {
			game.update(game.players, game.state, dt);

			for (var player_key in game.players)
			{
				var player = game.players[player_key];
				game.player.update(player, game.state, dt);
			}

			msg.time_since_last += dt;
			if (msg.time_since_last >= msg.rate)
			{
				msg.time_since_last = 0;
				game.send_states(game.players, game.state);
			}
		}, dt * 1000);
	}

	// Automatic asset watcher and processor
	const asset_map_path = path.join(game_dir, 'asset-map.json');
	if (fs.existsSync(asset_map_path))
	{
		const asset_map = JSON.parse(fs.readFileSync(asset_map_path, 'utf8'));
		var asset_processing_fuses = {};

		for (const asset_path in asset_map)
		{
			try
			{
				fs.watch(asset_path, { persistent: true, recursive: true }, function(event_type, file) {

					var src_path = path.join(asset_path, file);
					var base_name = path.parse(src_path).name;
					var name = base_name + path.parse(src_path).ext;

					var fuse = setTimeout(function() {
						const command = asset_map[asset_path].cmd.replace('$SRC', src_path)
						                                         .replace('$BASENAME', base_name)
						                                         .replace('$NAME', name);
						console.log(command);
						exec(command, { cwd: game_dir }, (err, stdout, sterr) => {
							delete asset_processing_fuses[src_path];

							if (game) { game.setup(game.state); }
						});
					}, 500);

					if (src_path in asset_processing_fuses)
					{
						clearTimeout(asset_processing_fuses[src_path]);
					}

					asset_processing_fuses[src_path] = fuse;

					console.log(asset_path + ' ' + file);
				});

				console.log('Watching :' + asset_path);
			}
			catch (e)
			{
				console.log("Cannot watch '" + asset_path + "' " + e);
			}
		}
	}

	const port = opts.port || process.env.PORT || 3001;
	server.listen(port, function() { console.log('Serving ' + name + ' at: http://localhost:' + port); });
}
