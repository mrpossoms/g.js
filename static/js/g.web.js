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
                        console.error('Error building ' + type);
                        console.error(source);
                        console.error('An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader));
                        console.error('-------------------------');

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

                return g.web.gfx.shader[name] = program;
            }
        },
        mesh: {
            create: function(mesh_json)
            {
                var mesh = {
                    indices: null,
                    vertices: {},
                    shader_configs: {},

                    using_shader: function(shader_name)
                    {
                        const mesh_ref = this;
                        const shader = g.web.gfx.shader[shader_name];
                        gl.useProgram(shader);

                        return {
                            with_attribute: function(description)
                            {
                                // TODO: add functionality to cache vertex attr pointers
                                const buf = mesh_ref.vertices[description.buffer];

                                if (buf === undefined) { console.error('Cannot use undefined buffer'); return; }
                                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                                const loc = gl.getAttribLocation(shader, description.name);
                                if (loc < 0)
                                {
                                    console.error('Cannot find location for attribute "' + name + '" in shader "' + shader_name + '"');
                                    return null;
                                }

                                gl.vertexAttribPointer(
                                    loc,
                                    description.components || 1,
                                    description.type || gl.FLOAT,
                                    description.normalized || false,
                                    description.stride || 0,
                                    description.offset || 0
                                );
                                gl.enableVertexAttribArray(loc);

                                return this;
                            },
                            set_uniform: function(uni_name)
                            {
                                const shader_ref = this;
                                const loc = gl.getUniformLocation(shader, uni_name);
                                return {
                                    mat4: function(m)
                                    {
                                        gl.uniformMatrix4fv(loc, false, m.as_Float32Array());
                                        return shader_ref;
                                    }
                                };
                            },
                            draw_tris: function()
                            {
                                if (mesh_ref.indices)
                                {
                                    gl.drawElements(
                                        gl.TRIANGLES,
                                        mesh_ref.indices.length,
                                        gl.UNSIGNED_SHORT,
                                        0
                                    );
                                }
                                else
                                {
                                    gl.drawArrays(gl.TRIANGLES, 0, mesh_ref.positions.length / 3);
                                }
                            }
                        };
                    }
                };

                if (mesh_json.positions)
                {
                    mesh.vertices.positions = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices.positions);
                    gl.bufferData(gl.ARRAY_BUFFER, mesh_json.positions.as_Float32Array(), gl.STATIC_DRAW);
                }

                if (mesh_json.texture_coords)
                {
                    mesh.vertices.texture_coords = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices.texture_coords);
                    gl.bufferData(gl.ARRAY_BUFFER, mesh_json.texture_coords.as_Float32Array(), gl.STATIC_DRAW);
                }

                if (mesh_json.normals)
                {
                    mesh.vertices.normals = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices.normals);
                    gl.bufferData(gl.ARRAY_BUFFER, mesh_json.normals.as_Float32Array(), gl.STATIC_DRAW);
                }

                if (mesh_json.indices)
                {
                    mesh.indices = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh_json.indices.as_Int16Array(), gl.STATIC_DRAW);
                }

                return mesh;
            }
        }
    },

	assets: {
		load: function(asset_arr, on_finish)
		{
			var count = asset_arr.length;

            function load_resource(path)
            {
                return fetch(path).then(function(res)
                {
                    const type = res.headers.get('content-type');
                    const type_stem = type.split('/')[0];
                    var bytes_to_read = parseInt(res.headers.get('content-length'));

                    switch (type_stem)
                    {
                        case 'image':
                        {
                            var img = new Image();
                            img.src = res.url;
                            g.web.assets[path] = img;
                        } break;

                        case 'audio':
                        {
                            g.web.assets[path] = new Audio(res.url);
                        } break;
                    }

                    // specific mime types
                    switch (type)
                    {
                        case 'application/json':
                        case 'application/json; charset=UTF-8':
                        {
                            g.web.assets[path] = '';
                            res.body.getReader().read().then(function(res)
                            {
                                g.web.assets[path] += (new TextDecoder()).decode(res.value);
                                bytes_to_read -= res.value.length;
                                if (res.done || bytes_to_read == 0)
                                {
                                    g.web.assets[path] = JSON.parse(g.web.assets[path]);
                                }
                            });
                        } break;

                        case 'text/plain':
                        case 'application/octet-stream':
                        {
                            g.web.assets[path] = '';
                            res.body.getReader().read().then(function(res)
                            {
                                g.web.assets[path] += (new TextDecoder()).decode(res.value);
                            });
                        } break;
                    }
                });
            }

            var promises = [];
			for (var i = 0; i < asset_arr.length; i++)
			{
                promises.push(load_resource(asset_arr[i]));
			}

            Promise.all(promises).then(function(values)
            {
                on_finish();
            });
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
