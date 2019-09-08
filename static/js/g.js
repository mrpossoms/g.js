var g = {
	_initalize: function() {},
	_update: function() {},
	_draw: function() {},
	_canvas: null,
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

	canvas: function(dom_element) { g._canvas = dom_element; return this; },

	initalize: function(f) { g._initialize = f; return this; },

	update: function(f) { g._update = f; return this; },

	start: function()
	{
		var req_frame = window.webkitRequestAnimationFrame ||
		                window.mozRequestAnimationFrame    ||
		                window.oRequestAnimationFrame      ||
		                window.msRequestAnimationFrame;
		var step_timer = new g.timer();

		if (!g._initialize())
		{
			console.error('initialize_func(): returned false.');
			return;
		}

		var update_and_render = function() {
			var dt = step_timer.tick();

			if (is_running)
			{
				g._update(dt);
				g._draw(dt);
			}
		};
	},

	pointer:
	{
		on_move: function(on_move_func)
		{
			g._canvas.addEventListener("touchmove", function(e)
			{
				e.preventDefault();
				on_move_func({ x: 0, y: 0 });
			}, false);

			g._canvas.addEventListener("mousemove", function(e)
			{
				e.preventDefault();
				cb(e);
			}, false);

			return this;
		},
		on_press: function(on_press_func)
		{
			return this;
		}
	}
};
