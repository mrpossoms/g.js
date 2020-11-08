varying lowp vec3 v_color;
// varying highp vec4 v_world_pos;

// uniform mat4 u_light_model;
// uniform mat4 u_light_view;
// uniform mat4 u_light_proj;
uniform sampler2D u_shadow_map;

void main (void)
{
	// texture2D
    gl_FragColor = vec4(v_color + vec3(texture2D(u_shadow_map, vec2(0.0)).r), 1.0);
}
