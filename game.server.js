const g = require('./static/js/g.js');


module.exports.server = {

	// map of all connected players
	players: {},


	// complete game state
	state: {},


	// server initialization goes here
	setup: function(state)
	{
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
			player.cam.position([0, 10, 0]);
			player.cam.forces.push([0, -9, 0]);
			player.cam.force = 20;
			player.cam.friction = 5;
			player.walk_dir = [0, 0];

			player.on('walk', (walk_dir) => {
				player.walk_dir = walk_dir;
			});

			player.on('angles', (pitch_yaw) => {
				player.cam.pitch(pitch_yaw[0]);
				player.cam.yaw(pitch_yaw[1]);
			});

			player.on('jump', () => {
				if (!player.cam.is_airborn())
				{
					player.cam.velocity(player.cam.velocity().add([0, 6, 0])); 
				}
			});
		},

		update: function(player, dt)
		{
			if (player.walk_dir[0] > 0)      { player.cam.walk.right(dt); }
			else if (player.walk_dir[0] < 0) { player.cam.walk.left(dt); }

			if (player.walk_dir[1] > 0)      { player.cam.walk.forward(dt); }
			else if (player.walk_dir[1] < 0) { player.cam.walk.backward(dt); }

			player.cam.update(dt);
		},

		disconnected: function(player)
		{
			console.log('player: ' + player.id + ' disconnected');
		}
	},


	// main game loop
	update: function(players, dt)
	{

	},


	send_states: function(players, state)
	{
		for (var id in players)
		{
			console.log('player: ' + id + ' update');
			players[id].emit('pos', (players[id].cam.position()));
			players[id].emit('vel', (players[id].cam.velocity()));
		}
	}
};
