import Schema from '@deepseek-ai/schemastery';
import {resolveDshHome} from '@deepseek-ai/dsh-home-paths';
import {DEFAULTS} from './core.js';
import {createRuntime} from './runtime.js';
import {RendererPetBridge,bindRendererBridge} from './renderer-bridge.js';
export const name='dsh-pet-company';
export const inject=['webServer','connection'];
const fields={};
for(const [key,value] of Object.entries(DEFAULTS)) {
  let field;
  if(typeof value==='boolean') field=Schema.boolean();
  else if(typeof value==='number') field=Schema.number().min(key==='minGapMinutes'?20:1).max(1440).step(1);
  else if(key==='frequency') field=Schema.union(['quiet','standard','chatty']);
  else if(key==='character') field=Schema.union(['silver','orange','tide']);
  else field=Schema.string();
  fields[key]=field.default(value);
}
export const Config=Schema.object(fields).description('首次启动默认值。日常请在「设置 → 陪伴」管理；该页面保存的配置优先于此处。');
export function apply(ctx,config) {
  let runtime;
  const bridge=bindRendererBridge(ctx,new RendererPetBridge({onConnect:()=>runtime?.tick()}));
  runtime=createRuntime(ctx,config,resolveDshHome(),{bridge});
  runtime.start();
}
