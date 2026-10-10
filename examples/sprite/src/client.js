// Draws an animated sprite from an aseprite spritesheet export. The whole
// sheet is drawn on top for reference, with the animation playing below it.
//
// The sheet's image and json are loaded as assets:
//   assets/imgs/Sprite-0001.pixelated.png  -> g.web.assets['tex/Sprite-0001']
//   assets/animations/Sprite-0001.json     -> g.web.assets['animation/Sprite-0001']
import g from 'g.js/web';

var anim = null;
const scale = 10; // screen pixels per sprite pixel

g.web.canvas(document.getElementById('primary'));

// Draws the region uv ([x, y, w, h] in texture coordinates) of tex, centered
// at p (pixels from the canvas center) with size s (pixels).
const draw_region = (tex, p, s, uv) => {
    const W = g.web.gfx.width(), H = g.web.gfx.height();
    // the plane's uvs are flipped on both axes, so flip the quad to match
    const model = [].mat_scale([-s[0] / W, -s[1] / H, 1])
                    .mat_mul([].translate([2 * p[0] / W, 2 * p[1] / H, 0]));

    g.web.assets['mesh/plane'].using_shader('sprite')
        .with_attribute({name:'a_position', buffer: 'positions', components: 3})
        .with_attribute({name:'a_tex_coord', buffer: 'texture_coords', components: 2})
        .set_uniform('u_model').mat4(model)
        .set_uniform('u_uv').vec4(uv)
        .set_uniform('u_texture').texture(tex)
        .draw_tri_fan();
};

g.initialize(function ()
{
    g.is_running = false;

    g.web.assets.load(asset_list, function() {
        g.web.gfx.shader.create('sprite',
            g.web.assets['shaders/sprite.vert'],
            g.web.assets['shaders/sprite.frag']
        );

        anim = new g.web.assets['animation/Sprite-0001']();

        gl.disable(gl.DEPTH_TEST);
        g.is_running = true;
    });

    return true;
});

g.update(function (dt)
{
    anim.tick(dt);
});

g.web.draw(function (dt)
{
    if (!g.is_running) { return; }

    gl.clearColor(0.2, 0.2, 0.25, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const tex = g.web.assets['tex/Sprite-0001'];

    // the whole sheet
    draw_region(tex, [0, 100], [tex.width * scale, tex.height * scale], [0, 0, 1, 1]);

    // the animation's current frame. origin() and size() are the frame's
    // region of the sheet in texture coordinates
    const frame_size = [anim.size()[0] * tex.width * scale, anim.size()[1] * tex.height * scale];
    draw_region(tex, [0, -110], frame_size, anim.origin().concat(anim.size()));
});

g.start();
