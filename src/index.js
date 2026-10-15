import Schema from '@deepseek-ai/schemastery';
import {resolveDshHome} from '@deepseek-ai/dsh-home-paths';
import {DEFAULTS} from './core.js';
import {createRuntime} from './runtime.js';
import {RendererPetBridge,bindRendererBridge} from './renderer-bridge.js';
import {ProviderBridge} from './runtime-provider.js';
import {OwnedController} from './owned/controller.js';
import * as ownedPlugin from './owned/plugin.js';
import {OwnerLock} from './owned/owner-lock.js';
import {HelperManager} from './owned/helper-manager.js';
import {RuntimeSource} from './owned/runtime-source.js';
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
fields.runtimeExecutable=Schema.string().default('').description('可选：已有官方 Electron 43.3.0 的独立可执行文件路径。不能使用 DSH Desktop.app。');
export const Config=Schema.object(fields).description('首次启动默认值。日常请在「设置 → 陪伴」管理；该页面保存的配置优先于此处。');
export function apply(ctx,config) {
  let runtime;
  const {runtimeExecutable,...careConfig}=config;
  const home=resolveDshHome(),ownership=new OwnerLock(home);
  const runtimeSource=new RuntimeSource({home,configuredExecutable:runtimeExecutable||undefined});
  const helper=new HelperManager({home,ownership,source:runtimeSource});
  const external=bindRendererBridge(ctx,new RendererPetBridge({onConnect:()=>runtime?.tick()}));
  const embedded=new OwnedController({helper});
  ctx.plugin(ownedPlugin,{controller:embedded});
  const bridge=new ProviderBridge({external,embedded});
  runtime=createRuntime(ctx,careConfig,home,{bridge,ownership,runtimeSource,helper});
  runtime.start();
  ctx.effect(()=>async()=>{await runtime.stop();await runtimeSource.close();await ownership.release();},'company ownership lifetime');
}
