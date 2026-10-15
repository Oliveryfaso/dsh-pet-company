import {readFile} from 'node:fs/promises';
import {EMBEDDED_IDS} from '../runtime-provider.js';
export const APPEARANCE_DEFAULTS=Object.freeze({size:462,marginX:16,marginY:16,corner:'bottom-right',cloud:true,pop:true,closeSeconds:8,display:'desktop'});
export function validateAppearance(value={}) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('外观配置无效');
 for(const key of Object.keys(value))if(!Object.hasOwn(APPEARANCE_DEFAULTS,key))throw Error('未知外观配置');
 const a={...APPEARANCE_DEFAULTS,...value};
 for(const [key,min,max] of [['size',100,800],['marginX',0,4000],['marginY',0,4000],['closeSeconds',3,20]])if(!Number.isInteger(a[key])||a[key]<min||a[key]>max)throw Error('外观数值超出范围：'+key);
 if(!['bottom-right','bottom-left','top-right','top-left'].includes(a.corner)||!['web','desktop','none'].includes(a.display)||typeof a.cloud!=='boolean'||typeof a.pop!=='boolean')throw Error('外观选项无效');
 return a;
}
export async function roleView(id,appearance={}) {
 if(!EMBEDDED_IDS.includes(id))throw Error('内置角色无效');
 const pack=JSON.parse(await readFile(new URL('../../pet/'+id+'-config.json',import.meta.url),'utf8')),a=validateAppearance(appearance);
 return {pet:{id,name:pack.pets[0].name,size:a.size,position:{corner:a.corner,marginX:a.marginX,marginY:a.marginY},presentation:{theme:id.slice('companion-'.length),pop:a.pop,cloud:a.cloud,closeSeconds:a.closeSeconds}},animations:{idle:pack.animations.idle,clicks:pack.animations.clicks,drag:pack.animations.drag,events:{whisper:pack.animations.events.whisper}},display:a.display};
}
