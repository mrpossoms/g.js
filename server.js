var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = {};

function new_player_id()
{
	var id = null;
	do
	{
		id = Math.floor(Math.random() * 4096);
	}
	while (players[id] != undefined);

	return id;
}

io.on('connection', function(player) {
	var player_id = new_player_id();
	console.log('Player: ' + player_id + ' connected');

	player.on('message', function (msg) {
		
	});

	player.on('disconnect', function() {
		console.log('Player: ' + player_id + ' disconnected');
		delete players[player_id];
	});

	players[player_id] = player;
});



app.use(express.static('static'));
http.listen(8080, function() { console.log('Running!'); });
