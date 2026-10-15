#!/usr/bin/env node
/** Build-time adapter entry point. Source art: fywdy, CC BY-NC 4.0; upstream tools/JSON: MIT.
 * Project adapter code: MIT under CODE-LICENSE.md; artwork remains CC BY-NC 4.0.
 * PYTHON=/path/to/python3 node scripts/generate-pet-pack.mjs --source-root /path/to/codex-native [--capture-preview]
 * Requires existing Python/Pillow, ffmpeg/ffprobe; optional preview uses existing Playwright. Never installs.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);const capture=args.includes('--capture-preview');
const outAt=args.indexOf('--out');const root=outAt<0?path.join(here,'..'):path.resolve(args[outAt+1]);
const result=spawnSync(process.env.PYTHON||'python3',[path.join(here,'adapt-fywdy-pet-packs.py'),...args.filter(a=>a!=='--capture-preview')],{stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exitCode=1;}
else if(result.status!==0)process.exitCode=result.status??1;
else if(capture){const screenshot=spawnSync(process.execPath,[path.join(here,'capture-pet-pack-preview.mjs'),root],{stdio:'inherit'});if(screenshot.error)console.error(screenshot.error.message);process.exitCode=screenshot.status??1;}
