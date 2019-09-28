attribute vec3 a_position;
attribute vec2 a_tex_coord;

uniform mat4 u_model_view;
uniform mat4 u_proj;

varying lowp vec2 v_tex_coord;

void main (void)
{
  gl_Position = u_proj * u_model_view * vec4(a_position, 1.0);
  v_tex_coord = a_tex_coord;
}
