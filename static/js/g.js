var g = {
	_initalize: function() {},
	_update: function() {},
	is_running: true,

	timer: function(){
		this._last = 0;
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

	start: function()
	{
		var req_frame = window.requestAnimationFrame       ||
                        window.webkitRequestAnimationFrame ||
		                window.mozRequestAnimationFrame    ||
		                window.oRequestAnimationFrame      ||
		                window.msRequestAnimationFrame;
		var step_timer = new g.timer();

		// if we are a browser, setup socket.io to connect to the server
		if (g.web)
		{
			g.web._socket = io();
			g.web._socket.on('message', g.web._on_message);

            if (!g.web.gfx._initalize()) { return; }
		}

 		// custom initialization
		if (!g._initialize())
		{
			console.error('initialize_func(): returned false.');
			return;
		}

		// update, and render if appropriate
		var update = function() {
			var dt = step_timer.tick();

			if (g.is_running)
			{
				g._update(dt);

				if (g.web)
				{
					g.web._draw(dt);
				}
			}

			if (g.web) { req_frame(update); }
		};

		if (g.web) { req_frame(update); }
	},
};

try
{
	module.exports.g = g;
}
catch { console.log('Not a node.js module'); }

Array.prototype.new_matrix = function(rows, cols)
{
	var M = new Array(rows);
	for (var r = rows; r--;) M[r] = new Array(cols);
	return M;
};

Array.prototype.add = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] + v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] + v[i]; }

	return r;
};

Array.prototype.sub = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] - v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] - v[i]; }

	return r;
};

Array.prototype.mul = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] * v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] * v[i]; }

	return r;
};

Array.prototype.div = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] / v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] / v[i]; }

	return r;
};

Array.prototype.lerp = function(v, p)
{
	var r = new Array(this.length);
	for (var i = 0; i < r.length; i++) { r[i] = this[i] * (1-p) + v[i] * p; }
	return r;
};

Array.prototype.len = function()
{
	if (typeof this[0] !== 'number') { return NaN; }

	return Math.sqrt(this.dot(this));
};

Array.prototype.norm = function()
{
	if (typeof this[0] !== 'number') { return null; }

	return this.div(this.len());
}

Array.prototype.mat_dims = function()
{
	return [ this.length, this[0].length ];
};

Array.prototype.mat_mul = function(m)
{
	var M = this.matrix();
	var N = m.matrix();

	const m0_dims = M.mat_dims();
	const m1_dims = N.mat_dims();

	var O = this.new_matrix(m0_dims[0], m1_dims[1]);

	var inner = m0_dims[1];
	for (var r = m0_dims[0]; r--;)
	for (var c = m1_dims[1]; c--;)
	{
		O[r][c] = 0;
		for (var i = inner; i--;) { O[r][c] += M[r][i] * N[i][c]; }
	}

	return O;
}

Array.prototype.flatten = function()
{
	var v = [];

	if (typeof(this[0]) === 'number') { v = this; }
	else
	{
		for (var i = 0; i < this.length; ++i)
		{
			v = v.concat(this[i]);
		}
	}

	return v;
};

Array.prototype.as_Float32Array = function(first_argument) {
	return new Float32Array(this.flatten());
};

Array.prototype.as_Int16Array = function(first_argument) {
	return new Int16Array(this.flatten());
};

Array.prototype.transpose = function()
{
	const dims = this.mat_dims();
	var M = this.new_matrix(dims[1], dims[0]);

	for (var r = dims[0]; r--;)
	for (var c = dims[1]; c--;)
	{
		M[c][r] = this[r][c];
	}

	return M;
};

Array.prototype.matrix = function()
{
	if (this[0].constructor === Array) { return this; }
	else { return [this].transpose(); }
};

Array.prototype.I = function(dim)
{
	var M = this.new_matrix(dim, dim);

	for (var r = dim; r--;)
	for (var c = dim; c--;)
	{
		M[c][r] = r == c ? 1 : 0;
	}

	return M;
};

Array.prototype.dot = function(v)
{
	var s = 0;
	for (var i = this.length; i--;) s += this[i] * v[i];
	return s;
}

Array.prototype.cross = function(v)
{
	return [
		this[1] * v[2] - this[2] * v[1],
		this[2] * v[0] - this[0] * v[2],
		this[0] * v[1] - this[1] * v[0]
	];
}

Array.prototype.translate = function(t)
{
	return [
		[ 1, 0, 0, 0 ],
		[ 0, 1, 0, 0 ],
		[ 0, 0, 1, 0 ],
		[ t[0], t[1], t[2], 1.   ]
	];
};

Array.prototype.perspective = function(fov, aspect, near, far)
{
	const a = Math.tan(Math.PI * 0.5 - 0.5 * fov);
	const fsn = far - near;
	const fpn = far + near;
	const ftn = far * near;

	return [
	       [  a/aspect,         0,          0,         0 ],
	       [         0,         a,          0,         0 ],
	       [         0,         0,   -fpn/fsn,        -1 ],
	       [         0,         0, -2*ftn/fsn,         1 ]
	];
};

Array.prototype.orthographic = function(r, l, t, b, n, f)
{
	const rml = r - l;
	const rpl = r + l;
	const tmb = t - b;
	const tpb = t + b;
	const fmn = f - n;
	const fpn = f + n;

	return [
	       [  2/rml,         0,          0, -rpl/rml ],
	       [      0,     2/tmb,          0, -tpb/tmb ],
	       [      0,         0,     -2/fmn, -fpn/fmn ],
	       [      0,         0,          0,        1 ]
	];
};

Array.prototype.view = function(up, forward, position)
{
	const r = up.cross(forward).mul(-1);
	const u = up;
	const f = forward;
	const p = position;

	var ori = [
		[ r[0], r[1], r[2], 0 ],
		[ u[0], u[1], u[2], 0 ],
		[ f[0], f[1], f[2], 0 ],
		[    0,    0,    0, 1 ]
	];

	var trans = [
		[     1,     0,     0,    0 ],
		[     0,     1,     0,    0 ],
		[     0,     0,     1,    0 ],
		[ -p[0], -p[1], -p[2],    1 ]
	];

	return trans.mat_mul(ori);
};

Array.prototype.rotation = function(axis, angle)
{
	const a = axis;
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	const omc = 1 - c;

	return [
		[c+a[0]*a[0]*omc,      a[1]*a[0]*omc+a[2]*s, a[2]*a[0]*omc-a[1]*s, 0],
		[a[0]*a[1]*omc-a[2]*s, c+a[1]*a[1]*omc,      a[2]*a[1]*omc+a[0]*s, 0],
		[a[0]*a[2]*omc+a[1]*s, a[1]*a[2]*omc-a[0]*s, c+a[2]*a[2]*omc,      0],
		[                   0,                    0,                    0, 1]
	];
};

Math.ray = function(ray)
{
	return {
		intersects: {
			sphere: function(position, radius)
			{
				const l = position.sub(ray.position);
				const s = ray.direction.dot(l);
				const l_2 = l.dot(l);
				const r_2 = radius * radius;
				var t = 0;

				if (s < 0 && l_2 > r_2) { return false; }

				const m_2 = l_2 - s * s;

				if (m_2 > r_2) { return false; }

				const q = Math.sqrt(r_2 - m_2);

				if (r_2 - m_2)
				{
					t = s - q;
				}
				else
				{
					t = s + q;
				}

				return ray.position + ray.direction * t;
			}
		}
	};
};
