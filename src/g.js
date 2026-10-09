import './g.math.js';

const g = {
	_initalize: function() {},
	_update: function() {},
	is_running: true,

	timer: function(){
		this._last = (new Date()).getTime();
		this._start = (new Date()).getTime();

		this.tick = function()
		{
			var t = (new Date()).getTime();
			var dt = t - this._last;
			this._last = t;
			return dt / 1000;
		};

		this.total = function()
		{
			return (new Date()).getTime() - this._start;
		};
	},

	initialize: function(f) { g._initialize = f; return this; },

	update: function(f) { g._update = f; return this; },

	canvas: function(dom_element) { g._canvas = dom_element; return this; },

	start: function(opts)
	{
		opts = opts || {};
		var req_frame = window.requestAnimationFrame       ||
		                window.webkitRequestAnimationFrame ||
		                window.mozRequestAnimationFrame    ||
		                window.oRequestAnimationFrame      ||
		                window.msRequestAnimationFrame;
		var step_timer = new g.timer();

		// if we are a browser, setup socket.io to connect to the server.
		// networking is skipped when socket.io isn't loaded (e.g. a baked,
		// self contained game) or when explicitly disabled with { net: false }
		if (g.web)
		{
			if (opts.net !== false && typeof io !== 'undefined')
			{
				g.web._socket = io();
				g.web._socket.binaryType = 'arraybuffer';
				g.web._socket.on('message', g.web._on_message);

				for (var e in g.web._on_event)
				{
					g.web._socket.on(e, g.web._on_event[e]);
				}
			}

			g.web.socket = function() { return g.web._socket; }
            if (!g.web.gfx._initalize()) { return; }
            g.web.snd._initalize();
		}

 		// custom initialization
		if (!g._initialize())
		{
			console.error('initialize_func(): returned false.');
			return;
		}

		// update, and render if appropriate
		var frames = 0;
		var time_since_sec = 0;
		var update = function() {
			var dt = step_timer.tick();

			if (g.is_running && (dt > 0 && dt < 1) && isFinite(dt))
			{
				g._update(dt);

				if (g.web)
				{
					g.web._draw(dt);
				}
			}

			if (g.web) { req_frame(update); }

			if (opts.print_fps)
			{
				if (time_since_sec >= 1)
				{
					console.log(frames + ' fps');
					frames = 0;
					time_since_sec = 0;
				}
				time_since_sec += dt;
				frames++;
			}
		};

		if (g.web) { req_frame(update); }
	},

	voxel: {
		create: function(voxel_data)
		{
			// process data into uniform type here.
			var palette = null;
			var locations = [];
			const RGBA = voxel_data.RGBA.slice();

			// grab the palette if it exists
			if (voxel_data.palette)
			{
				palette = new Array(voxel_data.palette.length / 4);
				for (var pi = 0; pi < voxel_data.palette.length; pi += 4)
				{
					palette[pi >> 2] = [voxel_data.palette[pi + 0] / 255, voxel_data.palette[pi + 1] / 255, voxel_data.palette[pi + 2] / 255];//, palette[pi].a / 255];
				}
			}

			// convert to uniform data storage
			if (voxel_data.SIZE)
			{
				var cells = new Array(voxel_data.SIZE.x);
				for (var xi = voxel_data.SIZE.x; xi--;)
				{
					cells[xi] = new Array(voxel_data.SIZE.z);
					for (var yi = voxel_data.SIZE.z; yi--;)
					{
						cells[xi][yi] = new Array(voxel_data.SIZE.y);
						cells[xi][yi].fill(0);
					}
				}

				for (var vi = voxel_data.XYZI.length; vi--;)
				{
					const set = voxel_data.XYZI[vi];
					cells[set.x][set.z][set.y] = set.c - 1;
				}

				if (voxel_data.RGBA && typeof(voxel_data.RGBA[0]) == 'object')
				{
					palette = voxel_data.RGBA;
					for (var pi = palette.length; pi--;)
					{
						if (!palette[pi]) { continue; }
						palette[pi] = [palette[pi].r / 255, palette[pi].g / 255, palette[pi].b / 255];//, palette[pi].a / 255];
					}
				}

				voxel_data = {
					width: voxel_data.SIZE.x,
					height: voxel_data.SIZE.z,
					depth: voxel_data.SIZE.y,
					scale: voxel_data.scale || 1,
					palette: palette,
					cells: cells
				};
			}

			const w = voxel_data.width;
			const h = voxel_data.height;
			const d = voxel_data.depth;
			const s = voxel_data.scale || 1;
			var cells = voxel_data.cells;
			var center_of_mass = [0, 0, 0];

			return {
				width: w,
				height: h,
				depth: d,
				scale: s,
				palette: palette,
				cells: cells,
				center_of_mass: function(force)
				{
					if (force || center_of_mass.sum() == 0)
					{
						center_of_mass = [0, 0, 0];
						var cell_count = 0;
						for (var x = w; x--;)
						for (var y = h; y--;)
						for (var z = d; z--;)
						{
							if (cells[x][y][z] > 0)
							{
								center_of_mass = center_of_mass.add([x, y, z]);
								cell_count++;
							}
						}

						center_of_mass = center_of_mass.mul(s / cell_count);
					}

					return center_of_mass;
				},
				intersection: function(pos, dir)
				{
					pos = pos.mul(1/s);
					dir = dir.mul(1/s);
					var fp = pos.floor(), cp = pos.ceil();

					let itrs = Math.ceil(dir.len()) * 5;
					for (var p = 0; p < itrs; p++)
					{
						const pd = pos.add(dir.mul(p / itrs));
						const pd_f = pd.floor();
						const pd_c = pd.ceil();

						if (pd_f[0] < 0 || pd_f[0] >= w) { return false; }
						if (pd_f[1] < 0 || pd_f[1] >= h) { return false; }
						if (pd_f[2] < 0 || pd_f[2] >= d) { return false; }

						if (cells[pd_f[0]][pd_f[1]][pd_f[2]] > 0)
						{
							var norm = fp.sub(pd_f);
							if (norm.dot(norm) > 0) { norm = norm.norm(); }

							var pen = [0, 0, 0];

							for (var i = 0; i < 3; i++)
							{
								if (dir[i] >= 0) { pen[i] = pd[i] - pd_f[i]; }
								else             { pen[i] = pd[i] - pd_c[i]; }
							}

							return {
								point: pd,
								normal: norm,
								penetration: pen
							};
						}
					}

					return false;
				},
				sample: function(pos)
				{
					pos = pos.mul(1/s);
					var fp = pos.floor();

					if (fp[0] < 0 || fp[0] >= w) { return undefined; }
					if (fp[1] < 0 || fp[1] >= h) { return undefined; }
					if (fp[2] < 0 || fp[2] >= d) { return undefined; }

					return {
						point: fp.mul(s),
						cell: cells[fp[0]][fp[1]][fp[2]]
					}
				},
				each_voxel: function(cb)
				{
					for (var x = 0; x < w; x++)
					for (var y = 0; y < h; y++)
					for (var z = 0; z < d; z++)
					{
						if (cells[x][y][z])
						{
							if (cb(x, y, z)) { return; }
						}
					}
				},
				downsample: function(factor)
				{
					var vox_data = {
						SIZE: {
							x: w / factor,
							y: d / factor,
							z: h / factor,
						},
						XYZI: [],
						RGBA: RGBA,
						scale: voxel_data.scale * factor
						// palette: palette
					};

					for (var ds_x = 0; ds_x < vox_data.SIZE.x; ds_x++)
					for (var ds_y = 0; ds_y < vox_data.SIZE.z; ds_y++)
					for (var ds_z = 0; ds_z < vox_data.SIZE.y; ds_z++)
					{

						// find the mode of this downsampled block
						var filled = 0;
						var empty = 0;
						var last_id = 0;
						for (var x = ds_x * factor; x < (ds_x + 1) * factor; x++)
						for (var y = ds_y * factor; y < (ds_y + 1) * factor; y++)
						for (var z = ds_z * factor; z < (ds_z + 1) * factor; z++)
						{
							const id = cells[x][y][z];
							if (id <= 0) { empty += 1; }
							else
							{
								filled += 1;
								last_id = id;
							}
						}

						var mode = 0;
						if (filled > empty / 2)
						{
							mode = last_id;
						}

						if (mode)
						vox_data.XYZI.push({
							x: ds_x,
							y: ds_z,
							z: ds_y,
							c: mode + 1
						});
					}

					return g.voxel.create(vox_data);
				}
			};
		}
	},

	animation: {
		create: function(json)
		{
			var frames = [];
			var tags = {};
			var tag;

			for_each(json.meta.frameTags, (frame_tag) => {
				tags[frame_tag.name] = [];
				switch (frame_tag.direction)
				{
					case 'forward':
						for (var i = frame_tag.from; i <= frame_tag.to; ++i)
						{
							tags[frame_tag.name].push(i);
						}
						break;
					case 'pingpong':
						for (var i = frame_tag.from; i <= frame_tag.to; ++i)
						{
							tags[frame_tag.name].push(i);
						}
						for (var i = frame_tag.to; i >= frame_tag.from; --i)
						{
							tags[frame_tag.name].push(i);
						}
						break;
				}

				tag = tags[frame_tag.name];
			});

			for_each(json.frames, (frame_meta) => {
				const frame = frame_meta.frame;
				frames.push({
					asset: frame_meta.asset,
					sec: frame_meta.duration / 1000
				});
			});

			return function() {
				this.frame_idx = 0;
				this.frame_duration = frames[0].sec;
				this.paused = false;
				this.speed = 1;
				this.tag = tag;
				this.tags = tags;
				this.queue = [];

				this.current_frame = function()
				{
					return frames[this.tag[this.frame_idx]];
				}

				this.pause = function(pause) { this.paused = pause; }

				this.tick = function(dt)
				{
					dt *= this.speed;

					if(!this.paused)
					while (dt > 0)
					{
						const prev_dur = this.frame_duration;
						this.frame_duration -= dt;

						if (this.frame_duration <= 0)
						{
							this.frame_idx++;
							if (this.frame_idx >= this.tag.length)
							{
								if (this.queue.length > 0)
								{
									this.tag = this.queue.pop();
								}

								this.frame_idx = 0;
							}
							this.frame_duration = this.current_frame().sec;
						}

						dt -= prev_dur;
					}
				};

				this.set = function(tag)
				{
					this.frame_idx = 0;
					this.tag = this.tags[tag];
				}
			};
		}
	},

	camera: {
		create: function()
		{
			var _q = [0,0,0,1];
			var _view = [].I(4);
			var _proj = [].I(4);
			var _pos = [0,0,0];
			var _forward = [0,0,-1];
			var _up = [0,1,0];
			var _left = [-1,0,0];
			var is_listener = true;

			var cam = {
				look_at: function(position, subject, up)
				{
					if (position && subject && up)
					{
						_pos = position;
						_forward = position.sub(subject).norm();
						_up = up.norm();
						_view = [].view(_pos, _forward, _up);
						_left = _q.quat_rotate_vector([-1, 0, 0]);
					}

					return _view;
				},
				orientation: function(q)
				{
					if (q) { _q = q; }

					_up = _q.quat_rotate_vector([0, 1, 0]);
					_forward = _q.quat_rotate_vector([0, 0, -1]);
					_left = _q.quat_rotate_vector([-1, 0, 0]);

					return _q;
				},
				tilt: function(d_yaw, d_pitch, d_roll)
				{
					d_yaw = d_yaw || 0;
					d_pitch = d_pitch || 0;
					d_roll = d_roll || 0;

					const dqx = [].quat_rotation([1, 0, 0], d_yaw);
					const dqy = [].quat_rotation([0, 1, 0], d_pitch);
					const dqz = [].quat_rotation([0, 0, 1], d_roll);
					const dq = dqx.quat_mul(dqy).quat_mul(dqz);
					_q = _q.quat_mul(dq);

					_up = _q.quat_rotate_vector([0, 1, 0]);
					_forward = _q.quat_rotate_vector([0, 0, -1]);
					_left = _q.quat_rotate_vector([-1, 0, 0]);

					this.view(_pos, _forward, _up);
				},
				position: function(p)
				{
					if (p)
					{
						_pos = p;
						this.view(_pos, _forward, _up);
					}

					return _pos;
				},
				up: function(u)
				{
					if (u)
					{
						_up = u;
						this.view(_pos, _forward, _up);
					}

					return _up;
				},
				left: function()
				{
					return _left;
				},
				forward: function(f)
				{
					if (f)
					{
						_forward = f;
						this.view(_pos, _forward, _up);
					}

					return _forward;
				},
				projection: function() { return _proj; },
				perspective: function(fov, near, far)
				{
					fov = fov || Math.PI / 2;
					near = near || 0.1;
					far = far || 1000;

					_proj = [].perspective(fov, g.web.gfx.aspect(), near, far);

					return this;
				},
				orthographic: function(width, height, near, far)
				{
					const a = g.web.gfx.aspect();
					near = near || 0.1;
					far = far || 500;
					_proj = [].orthographic(width/2, -width/2, height/2, -height/2, near, far);

					return this;
				}
			};

			cam.view = (position, forward, up) => {
				if (position && forward && up)
				{
					_pos = position;
					_forward = forward.norm();
					_up = up.norm();
					_left = _up.cross(_forward);
					_up = _forward.cross(_left);
					_view = [].view(_pos, _forward, _up);
					// _left = _q.quat_rotate_vector([-1, 0, 0]);

					if (is_listener && g.web && g.web._audio_ctx) { g.web.snd.listener.from_camera(cam); }
				}

				return _view;
			};

			return cam;
		},
		fps: function(opts)
		{
			var cam = g.camera.create();

			cam.mass = 1.0;
			cam.force = 1.0;
			cam.friction = 1.0;
			cam.forces = [];
			cam.max_pitch = Math.PI / 2;
			cam.min_pitch = -Math.PI / 2;

			var pitch = 0;
			var yaw = 0;
			var velocity = [0, 0, 0];
			var last_collisions = [];
			var coll_offsets = [];
			var coll_dirs = [];

			if (opts && opts.collision_rep)
			{

			}
			else
			{
				// default cube collision rep
				for (var i = -1; i <= 1; i++)
				{
					if (0 == i) { continue; }
					coll_dirs.push([i, 0, 0].mul(0.125));
					coll_dirs.push([0, i, 0].mul(1));
					coll_dirs.push([0, 0, i].mul(0.125));
				}

				for (var x = -1; x <= 1; x++)
				for (var y = -1; y <= 1; y++)
				for (var z = -1; z <= 1; z++)
				{
					if (x + y + z == 0) { continue; }
					coll_offsets.push([x, y, z].mul(0.25));
				}
			}

			cam.walk = {
				forward: (dt)=> {
					if (cam.is_airborn()) { dt *= 0.25; }
					var accel = cam.forward().mul(-dt * cam.force / cam.mass);
					velocity = velocity.add(accel);
				},
				backward: (dt)=> {
					if (cam.is_airborn()) { dt *= 0.25; }
					var accel = cam.forward().mul(dt * cam.force / cam.mass);
					velocity = velocity.add(accel);
				},
				left: (dt)=> {
					if (cam.is_airborn()) { dt *= 0.25; }
					var accel = cam.left().mul(dt * cam.force / cam.mass);
					velocity = velocity.add(accel);
				},
				right: (dt)=> {
					if (cam.is_airborn()) { dt *= 0.25; }
					var accel = cam.left().mul(-dt * cam.force / cam.mass);
					velocity = velocity.add(accel);
				}
			};

			cam.force = (force, dt) => {
				var accel = force.mul(dt / cam.mass);
				velocity = velocity.add(accel);
			};

			cam.velocity = (vel) => {
				if (vel) { velocity = vel; }
				else { return velocity; }
			};

			cam.tilt = (d_pitch, d_yaw) => {
				const new_pitch = pitch + d_pitch;

				if (new_pitch > cam.min_pitch && new_pitch < cam.max_pitch)
				{
					pitch = new_pitch;
				}

				yaw += d_yaw;

				const pos = cam.position();

				const qx = [].quat_rotation([1, 0, 0], pitch);
				const qy = [].quat_rotation([0, 1, 0], yaw);
				const q = cam._q = qy.quat_mul(qx)

				const up = q.quat_rotate_vector([0, 1, 0]);
				const forward = q.quat_rotate_vector([0, 0, -1]);
				// cam._left = cam._q.quat_rotate_vector([-1, 0, 0]));

				cam.view(pos, forward, up);
			};

			cam.pitch = (p) => {
				if (p)
				{
					pitch = p;

					const qx = [].quat_rotation([1, 0, 0], pitch);
					const qy = [].quat_rotation([0, 1, 0], yaw);
					const q = qx.quat_mul(qy);

					let up = qx.quat_rotate_vector([0, 1, 0]);
					up = qy.quat_rotate_vector(up);

					let forward = qx.quat_rotate_vector([0, 0, 1]);
					forward = qy.quat_rotate_vector(forward);

					cam.view(cam.position(), forward, up);
				}
				return pitch;
			};

			cam.yaw = (y) => {
				if (y)
				{
					yaw = y;

					const qx = [].quat_rotation([1, 0, 0], pitch);
					const qy = [].quat_rotation([0, 1, 0], yaw);
					const q = qx.quat_mul(qy)

					const up = q.quat_rotate_vector([0, 1, 0]);
					const forward = q.quat_rotate_vector([0, 0, 1]);
					cam.forward(forward);
				}
				return yaw;
			};

			cam.last_collisions = () => { return last_collisions; }

			cam.is_airborn = () => {
				var sum = 0;
				for (var i = 0; i < last_collisions.length; i++)
				{
					sum += last_collisions[i].normal.dot([0, 1, 0])
				}
				return sum < 0.0001;
			}

			cam.update = (dt)=> {
				var new_vel = [0, 0, 0];

				if (opts && opts.dynamics)
				{
					new_vel = opts.dynamics(cam, dt);
				}
				else
				{ // default dynamics
					var net_force = [0, 0, 0];

					for (var i = 0; i < cam.forces.length; i++)
					{
						net_force = net_force.add(cam.forces[i]);
					}

					const net_accel = net_force.mul(dt / cam.mass);
					var new_vel = velocity.add(net_accel);
				}

				last_collisions = [];

				if (opts && opts.collides)
				for (var i = coll_offsets.length; i--;)
				for (var j = coll_dirs.length; j--;)
				{
					var dir = coll_dirs[j];

					const new_vel_dt = new_vel.mul(dt);
					if (dir.dot(new_vel_dt) > 0)
					{
						dir = dir.add(new_vel_dt);
					}

					const collision = opts.collides(
						coll_offsets[i].add(cam.position()),
						dir
					);

					if (collision)
					{
						if (collision.normal.dot(velocity) - 0.001 >= 0) { continue; }

						last_collisions.push(collision);

						if (opts.on_collision) { opts.on_collision(cam, collision); }
						else
						{
							const cancled = new_vel.mul(collision.normal.abs());
							new_vel = new_vel.sub(cancled);
						}
					}
				}

				if (last_collisions.length > 0)
				{
					new_vel = new_vel.add(new_vel.mul(-cam.friction * dt));
				}

				if (!isFinite(new_vel[0]))
				{
					console.log('why');
				}

				velocity = new_vel;
				const pos = cam.position().add(velocity.mul(dt));

				const qx = [].quat_rotation([1, 0, 0], pitch);
				const qy = [].quat_rotation([0, 1, 0], yaw);
				const q = cam._q = qy.quat_mul(qx)

				const up = q.quat_rotate_vector([0, 1, 0]);
				const forward = q.quat_rotate_vector([0, 0, -1]);
				// cam._left = cam._q.quat_rotate_vector([-1, 0, 0]));

				cam.view(pos, forward, up);

			};

			return cam;
		}
	},
};

function for_each(obj, cb)
{
	if (!obj) { return obj; }
	if (obj.constructor === Array)
	{
		return obj.for_each(cb);
	}
	else
	{
		for (var k in obj)
		{
			if (!obj.hasOwnProperty(k)) { continue; }
			cb(obj[k], k, this);
		}

		return obj;
	}
}

Array.prototype.for_each = function(cb)
{
	for (var i = 0; i < this.length; ++i)
	{
		cb(this[i], i, this);
	}

	return this;
};

g.for_each = for_each;

export default g;
export { for_each };
