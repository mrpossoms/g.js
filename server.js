var path = require('path');
var fs = require('fs');
var express = require('express');
var bars = require('express-handlebars');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = game || require('./game.server.js');
var asset_paths = [];

app.engine('handlebars', bars());
app.set('view engine', 'handlebars');

/**
 * This function walks asset directories and generates a list of assets
 * to be loaded by the client
 */
function refresh_asset_paths()
{
	function walk(dir)
	{
		var results = [];
		try
		{
			for (const name of fs.readdirSync(dir))
			{
				const file = dir + '/' + name;
				if (fs.statSync(file).isDirectory()) { results = results.concat(walk(file)); }
				else { results.push(file.replace(/\\/g, '/').replace('static/', '')); }
			}
		}
		catch(e)
		{
			console.error('Could not walk ' + dir + ' ' + e);
		}
		return results;
	};

	asset_paths = ['voxels', 'imgs', 'sounds', 'shaders', 'meshes']
		.map((d) => walk('static/' + d))
		.reduce((all, paths) => all.concat(paths), []);
}

app.get('/', (req, res) => {
	console.log('collective: ' + asset_paths);
	res.render('index', { asset_paths: asset_paths });
});

app.get('/reload', (req, res) => {
	console.log('collective: ' + asset_paths);
	// allow game server to initialize game state, etc
	game.server.setup(game.server.state);
	res.render('index', { asset_paths: asset_paths });
});

function new_player_id()
{
	var id = null;
	do
	{
		id = Math.floor(Math.random() * 4096);
	}
	while (game.server.players[id] != undefined);

	return id;
}

// allow game server to initialize game state, etc
game.server.setup(game.server.state);

// socket io setup
io.on('connection', function(player) {
	var player_id = new_player_id();

	player.id = player_id;
	game.server.players[player_id] = player;

	game.server.player.connected(player, game.server.state, game.server.players);

	player.on('disconnect', function() {
		game.server.player.disconnected(player, game.server.state);
		delete game.server.players[player_id];
	});
});

// game mainloop
const dt = 1 / 100;
var msg = {
	rate: 1 / 30,
	time_since_last: 1,
};
setInterval(function() {
	game.server.update(game.server.players, game.server.state, dt);

	for (var player_key in game.server.players)
	{
		var player = game.server.players[player_key];
		game.server.player.update(player, game.server.state, dt);
	}

	msg.time_since_last += dt;
	if (msg.time_since_last >= msg.rate)
	{
		msg.time_since_last = 0;
		game.server.send_states(game.server.players, game.server.state);
	}
}, dt * 1000);


const PORT = process.env.PORT || 3001;

// Automatic asset watcher and processor
const { exec } = require('child_process');
var asset_map = require('./asset-map.json');
var asset_processing_fuses = {};
var watchers = [];

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
				exec(command, (err, stdout, sterr) => {
					delete asset_processing_fuses[src_path];
					refresh_asset_paths();

					game.server.setup(game.server.state);
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

refresh_asset_paths();
// express setup
app.use(express.static(path.join(__dirname, 'static')));
//app.use(express.static('static'));
http.listen(PORT, function() { console.log('Listening at: ' + PORT); });
