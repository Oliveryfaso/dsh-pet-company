import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {DEFAULTS,validateConfig,Scheduler,pickLine,MINUTE} from './core.js';
import {PetBridge} from './bridge.js';
export const ROUTE='/dsh-pet-company';
export const LEGACY_ROUTE='/dsh-companion';
export function createRuntime(ctx, initial, home, options={}) {
  const now=options.now??Date.now, bridge=options.bridge??new PetBridge(()=>ctx.webServer.port);
  const file=join(home,'dsh-pet-company','config.json');
  const legacyFile=join(home,'dsh-companion','config.json');
  let configSource=file;
  let config=validateConfig(initial??{}), available=false, reason='正在连接 dsh-pet', phase='connecting';
  let lastReminder=null, timer, stopped=false, saving=false, corrupt=false, mutating=false, serial=0, lastAttempt=-Infinity;
  const scheduler=new Scheduler(now());
  const status=()=>({available,reason,phase,config:{...config},lastReminder,snoozeUntil:scheduler.snoozeUntil});
  const ready=(async()=>{
    try {
      let raw;
      try { raw=await readFile(file,'utf8'); }
      catch(e) { if(e.code!=='ENOENT')throw e; configSource=legacyFile; raw=await readFile(legacyFile,'utf8'); }
      const saved=JSON.parse(raw);
      if(!saved||typeof saved!=='object'||Array.isArray(saved))throw Error('配置应为对象');
      config=validateConfig({...config,...saved});
    }
    catch(e) { if(e.code!=='ENOENT') { corrupt=true; config={...config,enabled:false}; reason='陪伴配置无法读取，请先修复配置文件'; } }
  })();
  function unavailable(error) {
    available=false;
    reason=['PET_NOT_FOUND','DESKTOP_ACCESS_BLOCKED','RENDERER_UNAVAILABLE','RELAY_TIMEOUT','RELAY_CLOSED','RELAY_TOO_LARGE','RELAY_BUSY','RELAY_HANDOFF','RELAY_LEASE_LOST','RELAY_BAD_REQUEST','RELAY_BAD_RESPONSE'].includes(error.code)?error.message:'需要先安装并启用 dsh-pet 才能显示宠物';
    phase='unavailable'; scheduler.disconnect(now());
  }
  async function speak(kind,day) {
    const text=pickLine(kind,config.character,serial++);
    const feedback={eventId:randomUUID(),source:'care'};
    await bridge.broadcast(config.petId,text,feedback);
    if (stopped) return;
    scheduler.delivered(kind,now(),day); lastReminder={kind,text,at:now()};
    try { void bridge.animate(config.petId,feedback).catch(()=>{}); } catch {} // Optional animation must never repeat a delivered bubble.
  }
  async function tick() {
    await ready;
    if (stopped || mutating || saving || corrupt) return;
    mutating=true;
    try {
      const state=await bridge.state(config.petId); if(stopped)return;
      const result=scheduler.observe(state,now(),config);
      available=true; reason=''; phase=result.phase;
      if (result.kind) {
        const gap=Math.max({quiet:60,standard:30,chatty:20}[config.frequency],config.minGapMinutes)*MINUTE;
        if(now()-lastAttempt>=gap) { lastAttempt=now(); await speak(result.kind,result.day); }
        else phase='cooldown';
      }
    } catch(e) { if(!stopped) unavailable(e); }
    finally { mutating=false; }
  }
  async function bodyOf(req) {
    if (!String(req.headers['content-type']??'').startsWith('application/json')) throw Error('需要 JSON 请求');
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) throw Error('请求来源无效');
    let body='';
    for await (const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>8192) throw Error('请求过大'); }
    return JSON.parse(body||'{}');
  }
  async function handle(req,res) {
    const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    await ready;
    const requestedPath=new URL(req.url,'http://localhost').pathname;
    const path=requestedPath===LEGACY_ROUTE||requestedPath.startsWith(LEGACY_ROUTE+'/')?ROUTE+requestedPath.slice(LEGACY_ROUTE.length):requestedPath;
    if(req.method==='GET' && path===ROUTE+'/status') return send(200,status());
    if(req.method==='GET') return send(404,{error:'接口不存在'});
    if(!['PUT','POST'].includes(req.method)) return send(405,{error:'请求方法不支持'});
    if(saving||mutating) return send(409,{error:'正在处理，请稍后重试'});
    saving=true;
    try {
      const body=await bodyOf(req);
      if(req.method==='PUT' && path===ROUTE+'/config') {
        if(corrupt) return send(409,{error:'配置文件损坏，未覆盖原文件。请先修复 '+configSource});
        const next=validateConfig(body);
        await mkdir(dirname(file),{recursive:true});
        const temporary=file+'.'+randomUUID()+'.tmp';
        try {
          await writeFile(temporary,JSON.stringify(next,null,2)+'\n',{mode:0o600,flag:'wx'});
          await rename(temporary,file);
        } finally { await rm(temporary,{force:true}); }
        config=next; scheduler.reset(now());
        return send(200,status());
      }
      if(req.method==='POST' && path===ROUTE+'/snooze') {
        if(!Number.isInteger(body.minutes)||body.minutes<1||body.minutes>1440) throw Error('稍后提醒时间无效');
        scheduler.snoozeUntil=now()+body.minutes*MINUTE; phase='snoozed'; return send(200,status());
      }
      if(req.method==='POST' && path===ROUTE+'/test') {
        if(!available) return send(409,{ok:false,reason});
        let fresh;
        try { fresh=await bridge.state(config.petId); }
        catch(e) { unavailable(e); return send(409,{ok:false,reason}); }
        const observation=scheduler.observe(fresh,now(),config);
        if(observation.phase==='waiting' || scheduler.blockedAt!==undefined || fresh.sections?.workStatus?.data?.state==='waiting') return send(409,{ok:false,reason:'等你处理完当前审批或提问后，再试说一句。'});
        if(now()-Math.max(scheduler.lastSpeech,lastAttempt)<MINUTE) return send(429,{ok:false,reason:'刚说过话，稍等一分钟再试。'});
        lastAttempt=now();
        try { await speak('water'); }
        catch(e) { unavailable(e); return send(409,{ok:false,reason}); }
        return send(200,{ok:true});
      }
      send(404,{error:'接口不存在'});
    } catch(e) { send(400,{error:e.message}); } finally {saving=false;}
  }
  const start=()=>{
    ctx.effect(()=>ctx.webServer.register({kind:'prefix',path:ROUTE,handler:handle}),'pet company routes');
    ctx.effect(()=>ctx.webServer.register({kind:'prefix',path:LEGACY_ROUTE,handler:handle}),'legacy companion routes');
    ctx.effect(()=>{
      const run=async()=>{ await tick(); if(!stopped) {timer=setTimeout(run,15_000); timer.unref?.();} };
      void run();
      return ()=>{stopped=true;clearTimeout(timer);bridge.close();};
    },'companion polling');
  };
  return {start,tick,handle,status,ready,stop:()=>{stopped=true;clearTimeout(timer);bridge.close();}};
}
