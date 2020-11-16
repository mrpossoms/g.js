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

// game.server.setup(50);

// socket io setup
io.on('connection', function(player) {
	var player_id = new_player_id();

	player.id = player_id;
	game.server.players[player_id] = player;

	game.server.player.connected(player);

	player.on('message', function (msg) {
		game.server.player.on_message(player, msg);
	});

	player.on('disconnect', function() {
		game.server.player.disconnected(player);
		delete game.server.players[player_id];
	});
});

// game mainloop
const dt = 1 / 30;
setInterval(function() {
	game.server.update(dt);

	for (var player_key in game.server.players)
	{
		var player = game.server.players[player_key];
		game.server.player.update(player, dt);
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
			const name = base_name + '.' + path.parse(src_path).ext;

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
