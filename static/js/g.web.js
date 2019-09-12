g.web = {
	_draw: function() {},
	_on_message: function() {},
	_canvas: null,
	
	assets: {
		load: function(asset_arr, on_finish)
		{
			var count = asset_arr.length;

			for (i in asset_arr)
			{
				var path = asset_arr[i];

				fetch(path).then(function(res)
				{
					res.blob().then(function(blob)
					{
						// general mime classes
						const type = blob.type.split('/')[0];
						switch (type)
						{
							case 'image':
								var img = new Image();
								img.src = URL.createObjectURL(blob);
								g.web.assets[path] = img;
								break;
							case 'audio':
								g.web.assets[path] = new Audio(URL.createObjectURL(blob));
								break;
						}

						// specific mime types
						switch (blob.type)
						{
							case 'application/json':
								blob.text().then(function(text) 
								{
									g.web.assets[path] = JSON.parse(text);
								});
								break;
						}

						if (count--) { on_finish(); }
					});
				});
			}
		},
	},

	pointer:
	{
		on_move: function(on_move_func)
		{
			g.web._canvas.addEventListener("touchmove", function(e)
			{
				e.preventDefault();
				on_move_func({ x: 0, y: 0 });
			}, false);

			g.web._canvas.addEventListener("mousemove", function(e)
			{
				e.preventDefault();
				on_move_func(e);
			}, false);

			return this;
		},

		on_press: function(on_press_func)
		{
			return this;
		}
	},

	key:
	{
		_initalized: false,
		_map: {},
		is_pressed: function(key)
		{

			if (!g.web.key._initalized)
			{
				document.onkeydown = function(key)
				{
					g.web.key._map[key.key] = true;
				};

				document.onkeyup = function(key)
				{
					g.web.key._map[key.key] = false;
				};

				g.web.key._initalized = true;
			}

			return g.web.key._map[key] || false;
		}
	},

	on_message: function(f) { g.web._on_message = f; return this; },

	canvas: function(dom_element)
	{
		g.web._canvas = dom_element;
		document.body.onresize = function(e) {
			g.web._canvas.width = document.body.clientWidth;
			g.web._canvas.height = document.body.clientHeight;
		};
		return this;
	},

	draw: function(f) { g.web._draw = f; return this; }

};
