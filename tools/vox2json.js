#!/usr/bin/env node
import fs from 'fs';
import parse_mv from 'parse-magica-voxel';

console.error('path: ' + process.argv[2]);
var buf = fs.readFileSync(process.argv[2])
console.error('Buf len: ' + buf.length);

var vox = parse_mv(buf);

console.log(JSON.stringify(vox));
