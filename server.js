var path = require('path');
var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = game || require('./game.server.js');

console.log(game);

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

	game.server.player.connected(player, game.server.state);

	player.on('disconnect', function() {
		game.server.player.disconnected(player);
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
	game.server.update(game.server.players, dt);

	for (var player_key in game.server.players)
	{
		var player = game.server.players[player_key];
		game.server.player.update(player, dt);
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
try
{
	var asset_map = require('./asset-map.json');

	for (var asset_path in asset_map)
	{
		if (!fs.existsSync(asset_path))
		{
			console.error('Cannot watch "' + asset_path + '" path does not exist');
			continue;
		}

		fs.watch(asset_path, { persistent: true }, (event_type, file) => {
			if (file[0] === '.') { return; }
			if (file[file.length-1] === '~') { return; }

			console.log(event_type + " " + file);

			const src_path = path.join(asset_path, file);
			const base_name = path.parse(src_path).name;
			const name = base_name + path.parse(src_path).ext;

			const command = asset_map[asset_path].cmd.replace('$SRC', src_path)
													 .replace('$BASENAME', base_name)
													 .replace('$NAME', name);
			console.log(command);
			exec(command);
		});

		console.log('Watching "' + asset_path + '"');
	}
}
catch (e)
{
	console.warn('Error occured while setting up asset watch');
	console.error(e);
}


// express setup
app.use(express.static(path.join(__dirname, 'static')));
//app.use(express.static('static'));
http.listen(PORT, function() { console.log('Listening at: ' + PORT); });
