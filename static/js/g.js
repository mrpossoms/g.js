Array.prototype.plus = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] + v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] + v[i]; }

	return r;
};

Array.prototype.minus = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] - v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] - v[i]; }

	return r;
};

Array.prototype.times = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] * v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] * v[i]; }

	return r;
};

Array.prototype.divided_by = function(v)
{
	var r = new Array(this.length);

	if (typeof v === 'number')        { for (var i = this.length; i--;) r[i] = this[i] * v; }
	else if (v.constructor === Array) { for (var i = this.length; i--;) r[i] = this[i] * v[i]; }

	return r;
};

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

		if (g.web)
		{
			g.web._socket = io();
			g.web._socket.on('message', g.web._on_message);

            if (!g.web.gfx._initalize()) { return; }
		}

		if (!g._initialize())
		{
			console.error('initialize_func(): returned false.');
			return;
		}

		var update_and_render = function() {
			var dt = step_timer.tick();

			if (g.is_running)
			{
				g._update(dt);

				if (g.web)
				{
					g.web._draw(dt);
				}
			}

			req_frame(update_and_render);
		};

		req_frame(update_and_render);
	},
};
