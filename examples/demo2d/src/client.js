// Minimal self contained 2D demo. Runs without a server, so it can be baked
// into a single .html file with `g bake examples/demo2d`
import g from 'g.js/web';

var hud = null;
var pos = [0, 0];        // sprite center in pixels, origin at canvas center
var vel = [180, 120];    // pixels per second
const size = 128;        // sprite size in pixels
const speed = 300;

g.web.canvas(document.getElementById('primary'));

// draws a quad textured with tex, centered at p (pixels) with size s (pixels).
// The plane's uvs are flipped on both axes, so images need flipping to appear
// upright. Text textures are already drawn flipped and don't.
const draw_quad = (tex, p, s, flip) => {
    const W = g.web.gfx.width(), H = g.web.gfx.height();
    const f = flip ? -1 : 1;
    const model = [].mat_scale([f * s[0] / W, f * s[1] / H, 1])
                    .mat_mul([].translate([2 * p[0] / W, 2 * p[1] / H, 0]));

    g.web.assets['mesh/plane'].using_shader('basic_textured')
        .with_attribute({name:'a_position', buffer: 'positions', components: 3})
        .with_attribute({name:'a_tex_coord', buffer: 'texture_coords', components: 2})
        .set_uniform('u_proj').mat4([].I(4))
        .set_uniform('u_view').mat4([].I(4))
        .set_uniform('u_model').mat4(model)
        .set_uniform('u_texture').texture(tex)
        .draw_tri_fan();
};

const bounce = () => {
    new g.web.assets['sound/step1']([0, 0, 0]).play();
};

g.initialize(function ()
{
    g.is_running = false;

    g.web.assets.load(asset_list, function() {
        g.web.gfx.shader.create('basic_textured',
            g.web.assets['shaders/basic_textured.vert'],
            g.web.assets['shaders/basic_textured.frag']
        );

        hud = g.web.gfx.text.create(512, 32, '24px monospace')
                 .text('WASD to steer, space to beep', '#ffffff');

        gl.disable(gl.DEPTH_TEST);
        g.is_running = true;
    });

    return true;
});

g.web.key.is_down((key) => { if (key == ' ') { bounce(); } });
g.web.pointer.on_press(() => bounce());

g.update(function (dt)
{
    var steer = [0, 0];
    if (g.web.key.is_pressed('w') || g.web.key.is_pressed('arrowup'))    { steer = steer.add([ 0, 1]); }
    if (g.web.key.is_pressed('s') || g.web.key.is_pressed('arrowdown'))  { steer = steer.add([ 0,-1]); }
    if (g.web.key.is_pressed('a') || g.web.key.is_pressed('arrowleft'))  { steer = steer.add([-1, 0]); }
    if (g.web.key.is_pressed('d') || g.web.key.is_pressed('arrowright')) { steer = steer.add([ 1, 0]); }

    vel = vel.add(steer.mul(speed * dt));
    pos = pos.add(vel.mul(dt));

    // bounce off the canvas edges
    const half = [(g.web.gfx.width() - size) / 2, (g.web.gfx.height() - size) / 2];
    for (var i = 0; i < 2; i++)
    {
        if (Math.abs(pos[i]) > half[i])
        {
            pos[i] = Math.sign(pos[i]) * half[i];
            vel[i] *= -1;
        }
    }
});

g.web.draw(function (dt)
{
    if (!g.is_running) { return; }

    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    draw_quad(g.web.assets['tex/test'], pos, [size, size], true);
    draw_quad(hud, [0, g.web.gfx.height() / 2 - 32], [hud.width, hud.height]);
});

g.start();
