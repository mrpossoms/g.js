g.web = {
	_draw: function() {},
	_on_message: function() {},
	_canvas: null,
	
    gfx: {
        _initalize: function()
        {
            with (g.web)
            {
                if (_canvas == null)
                {
                    console.error('Canvas element has not been set, WebGL cannot initialize');
                    return false;
                }

                const gl = _canvas.getContext('webgl');

                if (gl == null)
                {
                    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
                    return false;
                }

                gl.clearColor(0.1, 0.1, 0.1, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                window.gl = gl;

                return true;
            }
        },
        texture: function(img)
        {

        },
        shader: {
            create: function(name, vertex_src, fragment_src)
            {
                function load_shader(type, source)
                {
                    const shader = gl.createShader(type);

                    // Send the source to the shader object
                    gl.shaderSource(shader, source);

                    // Compile the shader program
                    gl.compileShader(shader);

                    // See if it compiled successfully
                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                    {
                        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                        gl.deleteShader(shader);
                        return null;
                    }

                    return shader;
                }

                const vertex_shader = load_shader(gl.VERTEX_SHADER, vertex_src);
                const fragment_shader = load_shader(gl.FRAGMENT_SHADER, fragment_src);

                const program = gl.createProgram();
                gl.attachShader(program, vertex_shader);
                gl.attachShader(program, fragment_shader);
                gl.linkProgram(program);

                if (!gl.getProgramParameter(program, gl.LINK_STATUS))
                {
                    console.error('Failed to link shader program: ' + gl.getProgramInfoLog(shaderProgram));
                    return null;
                }

                g.web.shader[name] = shader;

                return shader;
            }
        }
    },

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
