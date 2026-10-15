import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {DEFAULTS,validateConfig} from './core.js';
export const EMBEDDED_IDS=Object.freeze(['companion-silver','companion-orange','companion-tide']);
export const PROVIDER_DEFAULTS=Object.freeze({...DEFAULTS,schemaVersion:2,provider:'embedded',petId:EMBEDDED_IDS[0],externalTarget:'main',embeddedTarget:EMBEDDED_IDS[0],handoffConfirmed:true});
const extras=['schemaVersion','provider','externalTarget','embeddedTarget','handoffConfirmed'];
export function validateCompanyConfig(value) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('配置必须是对象');
 for(const key of Object.keys(value))if(!Object.hasOwn(PROVIDER_DEFAULTS,key))throw Error('未知配置项：'+key);
 const result={...PROVIDER_DEFAULTS,...value};
 if(result.schemaVersion!==2)throw Error('配置版本无效');
 if(!['embedded','external'].includes(result.provider))throw Error('陪伴模式无效');
 if(typeof result.handoffConfirmed!=='boolean')throw Error('交接确认必须是开关');
 if(!EMBEDDED_IDS.includes(result.embeddedTarget))throw Error('内置角色无效');
 validateConfig({petId:result.externalTarget});
 const legacy=Object.fromEntries(Object.keys(DEFAULTS).map(k=>[k,result[k]]));validateConfig(legacy);
 if(result.petId!==(result.provider==='embedded'?result.embeddedTarget:result.externalTarget))throw Error('当前目标与陪伴模式不一致');
 return result;
}
export function initialCompanyConfig(initial={}) {
 const base=validateConfig(Object.fromEntries(Object.entries(initial).filter(([key])=>!extras.includes(key))));
 if(initial.provider)return validateCompanyConfig({...base,...initial,externalTarget:initial.externalTarget??base.petId,embeddedTarget:initial.embeddedTarget??EMBEDDED_IDS[0],petId:initial.provider==='external'?(initial.externalTarget??base.petId):(initial.embeddedTarget??EMBEDDED_IDS[0])});
 return validateCompanyConfig({...base,...PROVIDER_DEFAULTS,...base,petId:EMBEDDED_IDS[0],externalTarget:base.petId});
}
export function migrateLegacyConfig(value,initial={}) {
 const legacy=validateConfig({...validateConfig(initial),...value});
 return validateCompanyConfig({...PROVIDER_DEFAULTS,...legacy,provider:'external',externalTarget:legacy.petId,handoffConfirmed:false});
}
export function switchProviderConfig(config,provider,target) {
 const next={...config,provider};
 if(provider==='embedded')next.embeddedTarget=target??next.embeddedTarget;
 else if(provider==='external')next.externalTarget=target??next.externalTarget;
 next.petId=provider==='embedded'?next.embeddedTarget:next.externalTarget;
 return validateCompanyConfig(next);
}
export function exportLegacyConfig(config) {
 return validateConfig(Object.fromEntries(Object.keys(DEFAULTS).map(key=>[key,key==='petId'?config.externalTarget:config[key]])));
}
export async function loadCompanyConfig(home,initial={}) {
 const file=join(home,'dsh-pet-company','config.v2.json');
 let source=file,config=initialCompanyConfig(initial);
 for(const candidate of [file,join(home,'dsh-pet-company','config.json'),join(home,'dsh-companion','config.json')]) {
  source=candidate;
  try {
   const value=JSON.parse(await readFile(candidate,'utf8'));
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('配置应为对象');
   config=candidate===file?validateCompanyConfig(value):migrateLegacyConfig(value,exportLegacyConfig(config));
   return {config,file,source,corrupt:false,migrated:candidate!==file};
  }catch(error){if(error.code!=='ENOENT')return {config:{...config,enabled:false},file,source,corrupt:true,migrated:false};}
 }
 return {config,file,source:file,corrupt:false,migrated:false};
}
export async function saveCompanyConfig(home,value) {
 const config=validateCompanyConfig(value),file=join(home,'dsh-pet-company','config.v2.json');
 await mkdir(dirname(file),{recursive:true});const temporary=file+'.'+randomUUID()+'.tmp';
 try {await writeFile(temporary,JSON.stringify(config,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(temporary,file);}
 finally {await rm(temporary,{force:true});}
 return config;
}
export class ProviderBridge {
 constructor(providers){this.providers=providers;this.generation=0;this.closed=false;}
 async update(config){this.generation++;this.config=config;await this.providers[config.provider]?.updateTarget?.(config.petId);}
 async call(method,args){const generation=this.generation,provider=this.providers[this.config?.provider];if(this.closed)throw Error('陪伴已停止');if(!provider)throw Error('所选运行组件尚未就绪');const result=await provider[method](...args);if(this.closed||generation!==this.generation)throw Object.assign(Error('陪伴目标已切换'),{code:'PROVIDER_CHANGED'});return result;}
 state(...args){return this.call('state',args);}
 broadcast(...args){return this.call('broadcast',args);}
 animate(...args){return this.call('animate',args);}
 async close(){if(this.closed)return;this.closed=true;this.generation++;await Promise.allSettled([...new Set(Object.values(this.providers))].map(p=>p?.close()));}
}
