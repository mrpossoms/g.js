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
						var obj = null;
						const type = blob.type.split('/')[0];
						switch (type)
						{
							case 'image':
								obj = new Image();
								obj.src = URL.createObjectURL(blob);
								break;
							case 'audio':

								break;
							case 'text':

								break;
						}

						g.web.assets[path] = obj;
						console.log(res);
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
