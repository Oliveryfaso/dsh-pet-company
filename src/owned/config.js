import {readFile} from 'node:fs/promises';
import {EMBEDDED_IDS} from '../runtime-provider.js';
import {validateAppearance} from './appearance.js';
export {APPEARANCE_DEFAULTS,validateAppearance} from './appearance.js';
export async function roleView(id,appearance={}) {
 if(!EMBEDDED_IDS.includes(id))throw Error('内置角色无效');
 const pack=JSON.parse(await readFile(new URL('../../pet/'+id+'-config.json',import.meta.url),'utf8')),a=validateAppearance(appearance);
 return {pet:{id,name:pack.pets[0].name,size:a.size,position:{corner:a.corner,marginX:a.marginX,marginY:a.marginY},presentation:{theme:id.slice('companion-'.length),pop:a.pop,cloud:a.cloud,closeSeconds:a.closeSeconds}},animations:{idle:pack.animations.idle,clicks:pack.animations.clicks,drag:pack.animations.drag,events:{whisper:pack.animations.events.whisper}},display:a.display};
}
