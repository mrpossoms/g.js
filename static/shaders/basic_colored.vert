attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

varying lowp vec3 v_color;
varying highp vec4 v_world_pos;

void main (void)
{
	v_world_pos = u_model * vec4(a_position, 1.0);
	gl_Position = u_proj * u_view * v_world_pos;
	//float l = (dot(normalize(vec3(1.0, 1.0, 0.0)), a_normal) + 1.0) * 0.5;
	v_color = a_color;// * min(1.0, 0.25 + l);
}
