varying lowp vec3 v_color;
varying highp vec4 v_world_pos;

uniform highp vec3 u_light_world_pos;
uniform highp mat4 u_light_view;
uniform highp mat4 u_light_proj;
uniform sampler2D u_shadow_map;

void main (void)
{
	lowp vec4 proj_pos = u_light_proj * u_light_view * v_world_pos;
	lowp vec2 sample_coord = proj_pos.xy;

	// texture2D
	mediump float depth = distance(v_world_pos.xyz, u_light_world_pos);
	mediump float sampled_depth = texture2D(u_shadow_map, sample_coord).z;

	mediump float ndc = sampled_depth * 2.0 - 1.0;
	const mediump float near = 0.1;
	const mediump float far = 500.0;
	sampled_depth = (2.0 * near * far) / (far + near - ndc * (far - near));	

	if (depth > sampled_depth)
	{
		gl_FragColor = vec4(v_color * 0.5, 1.0);
	}
	else
	{
		gl_FragColor = vec4(v_color, 1.0);
	}

	// gl_FragColor = vec4(v_color / depth, 1.0);

}
