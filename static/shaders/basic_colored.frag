varying lowp vec3 v_color;
varying lowp vec3 v_normal;
varying highp vec4 v_light_proj_pos;

uniform sampler2D u_shadow_map;

void main (void)
{
	lowp vec3 light_dir = normalize(v_light_proj_pos.xyz);

	lowp float bias = 0.00005;//max(0.005 * (1.0 - dot(v_normal, light_dir)), 0.0005);

	highp float depth = v_light_proj_pos.z - bias;
	mediump float shadowing = 0.0;
	// const lowp float kernel[25] = float[25](
	// 	0.003765,0.015019,0.023792,0.015019,0.003765,
	// 	0.015019,0.059912,0.094907,0.059912,0.015019,
	// 	0.023792,0.094907,0.150342,0.094907,0.023792,
	// 	0.015019,0.059912,0.094907,0.059912,0.015019,
	// 	0.003765,0.015019,0.023792,0.015019,0.003765,
	// );

	for(lowp float y = -2.0; y <= 2.0; y++)
	for(lowp float x = -2.0; x <= 2.0; x++)
	{
		highp float sampled_depth = texture2D(u_shadow_map, v_light_proj_pos.xy + (vec2(x, y) * 0.0005)).r;

		if (depth <= sampled_depth)
		{
			shadowing += 1.0 / 25.0;
		}
	}

	lowp float ndl = (dot(v_normal, light_dir));// + 1.0) / 2.0;
	lowp float shading = ndl * shadowing;//min(ndl, shadowing);
	// shadowing = max(0.4, shadowing);

	gl_FragColor = vec4(v_color * shading, 1.0);

}
