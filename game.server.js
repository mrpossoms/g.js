const g = require('./static/js/g.js');


module.exports.server = {
	// map of all connected players
	players: {},
	// complete game state
	state: {},
	// server initialization goes here
	setup: function(state)
	{
		console.log(g.g);
		state.world = g.voxel.create(require('./static/voxels/temple.json'));
	},
	// handlers for all player connection events
	player: {
		connected: function(player, state)
		{
			console.log('player: ' + player.id + ' connected');

			const cam_colision_check = (new_pos, new_vel) => {
				const vox = state.world;
				return vox.intersection(new_pos.add(vox.center_of_mass()), new_vel);
			};

			player.cam = g.camera.fps({ collides: cam_colision_check });
			player.walk_dir = [0, 0];

			player.on('walk', (walk_dir) => {
				player.walk_dir = walk_dir;
			});
		},
		update: function(player, dt)
		{
			if (player.walk_dir[0] > 0)
			{
				player.cam.walk_right(dt);
				console.log(player.id + " walk right");
			}
			else if (player.walk_dir[0] < 0)
			{
				player.cam.walk_left(dt);
				console.log(player.id + " walk left");
			}

			if (player.walk_dir[1] > 0)
			{
				player.cam.walk_forward(dt);
				console.log(player.id + " walk forward");
			}
			else if (player.walk_dir[1] < 0)
			{
				player.cam.walk_backward(dt);
				console.log(player.id + " walk backward");
			}

			player.cam.update(dt);
			// player.emit('message', Uint8Array.from([1, 2, 3, 4]));
		},
		disconnected: function(player)
		{
			console.log('player: ' + player.id + ' disconnected');
		}
	},
	// main game loop
	update: function(dt, players)
	{

	}
};
