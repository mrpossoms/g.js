varying lowp vec3 v_color;
varying highp vec4 v_proj_pos;

uniform sampler2D u_shadow_map;

void main (void)
{
	mediump float depth = v_proj_pos.z - 0.001;
	mediump float sampled_depth = texture2D(u_shadow_map, v_proj_pos.xy).r;

	if (depth > sampled_depth)
	{
		gl_FragColor = vec4(v_color * 0.5, 1.0);
	}
	else
	{
		gl_FragColor = vec4(v_color, 1.0);
	}

}
