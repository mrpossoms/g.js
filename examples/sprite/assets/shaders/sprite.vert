attribute vec3 a_position;
attribute vec2 a_tex_coord;
uniform mat4 u_model;
uniform vec4 u_uv; // xy: frame origin, zw: frame size
varying mediump vec2 v_uv;
void main (void)
{
  gl_Position = u_model * vec4(a_position, 1.0);
  v_uv = u_uv.xy + a_tex_coord * u_uv.zw;
}
