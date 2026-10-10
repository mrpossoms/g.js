# g.js

A small WebGL game engine. Games are separate projects that import it as an
ES module, in the browser and in Node, and use its `g` command to serve or
bake them.

## Game layout

```
my-game/
  package.json
  deps/g.js/          this repo, as a git submodule (or cloned by gitman etc.)
  src/client.js       browser entry point
  src/server.js       optional authoritative game server
  assets/             imgs/ sounds/ shaders/ meshes/ voxels/ animations/
  asset-map.json      optional, see below
```

`package.json`:

```json
{
  "name": "my-game",
  "private": true,
  "type": "module",
  "scripts": { "dev": "g dev", "bake": "g bake" },
  "dependencies": { "g.js": "file:deps/g.js" }
}
```

```sh
git submodule add https://github.com/mrpossoms/g.js.git deps/g.js
npm install          # links deps/g.js into node_modules and installs its dependencies
npm run dev          # http://localhost:3001
npm run bake         # dist/my-game.html
```

## Client

```js
import g from 'g.js/web';

g.web.canvas(document.getElementById('primary'));

g.initialize(() => {
    g.web.assets.load(asset_list, () => { /* assets ready */ });
    return true;
});

g.update((dt) => { /* simulate */ });
g.web.draw((dt) => { /* render */ });

g.start();
```

Assets are named by their path within `assets/`, e.g. `assets/imgs/foo.png`
is `g.web.assets['imgs/foo.png']`, with its texture at `g.web.assets['tex/foo']`.

## Server

If `src/server.js` exists, `g dev` runs it at 100Hz and the page connects with
socket.io. Without one, the game runs offline in both `dev` and `bake`.
`g.web.is_online()` tells the client which. See `examples/voxel-fps/src/server.js`
for the module's interface. Server code can `import g from 'g.js'`.

## Commands

```
g dev  [game dir] [--port <n>]
g bake [game dir] [-o <file>] [--no-minify]
```

`bake` bundles `src/client.js` with esbuild, then `tools/bake.sh` inlines it
and embeds every file in `assets/` as a base64 data url, producing a single
self contained .html file. Baked games are always offline.

## asset-map.json

Watches folders and runs a command when files in them change, then re-runs the
server's `setup`. Commands run from the game's directory:

```json
{ "/path/to/voxels": { "cmd": "node deps/g.js/tools/vox2json.js $SRC > assets/voxels/$BASENAME.json" } }
```

## Examples

```sh
npm start                              # voxel-fps, multiplayer
node bin/g.js dev examples/demo2d      # offline 2D demo
node bin/g.js dev examples/sprite      # animated sprite from an aseprite spritesheet
node bin/g.js bake examples/demo2d     # examples/demo2d/dist/demo2d.html
```
