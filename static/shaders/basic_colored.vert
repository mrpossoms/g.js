attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

uniform highp mat4 u_light_view;
uniform highp mat4 u_light_proj;

varying lowp vec3 v_color;
varying highp vec4 v_proj_pos;

void main (void)
{
	highp vec4 v_world_pos = u_model * vec4(a_position, 1.0);
	gl_Position = u_proj * u_view * v_world_pos;

	v_color = a_color;
	v_proj_pos = u_light_proj * u_light_view * v_world_pos;
	v_proj_pos /= v_proj_pos.w;
	v_proj_pos = (v_proj_pos + 1.0) / 2.0;
}
