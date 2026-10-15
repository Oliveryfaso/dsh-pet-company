import {randomUUID} from 'node:crypto';

export const RELAY_CHANNEL='/api';
export const RELAY_ENDPOINT='dsh-pet-company';
const messages={RENDERER_UNAVAILABLE:'DSH 主界面中继未连接，提醒已暂停',RELAY_CLOSED:'宠物中继已关闭',RELAY_TIMEOUT:'宠物中继请求超时，未自动重试',RELAY_BUSY:'另一界面正在提供宠物中继',RELAY_HANDOFF:'等待上一界面的命令失效',RELAY_LEASE_LOST:'界面中继租约已失效',RELAY_BAD_REQUEST:'宠物中继请求无效',RELAY_BAD_RESPONSE:'宠物中继响应无效',RELAY_TOO_LARGE:'宠物中继数据超过 64 KiB，未截断',PET_NOT_FOUND:'找不到所选宠物，请核对宠物 ID',DESKTOP_ACCESS_BLOCKED:'桌面宿主拒绝当前界面的宠物请求（403）',DEPENDENCY_UNAVAILABLE:'当前界面无法访问 dsh-pet'};
const failure=code=>Object.assign(Error(messages[code]??messages.DEPENDENCY_UNAVAILABLE),{code});
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
const feedbackDetails=value=>{
  if(!record(value)||Reflect.ownKeys(value).length!==2||!Object.hasOwn(value,'eventId')||!Object.hasOwn(value,'source'))throw failure('RELAY_BAD_REQUEST');
  const {eventId,source}=value;
  if(typeof eventId!=='string'||eventId.length<1||eventId.length>100||/[^A-Za-z0-9_-]/.test(eventId)||source!=='care')throw failure('RELAY_BAD_REQUEST');
  return {eventId,source};
};

/** Host-owned transport. Only a live authorized renderer can perform its fixed operations. */
export class RendererPetBridge {
  constructor(options={}) {
    this.now=options.now??Date.now; this.setTimer=options.setTimer??setTimeout; this.clearTimer=options.clearTimer??clearTimeout;
    this.leaseMs=options.leaseMs??30000; this.requestTimeoutMs=options.requestTimeoutMs??8000; this.pollTimeoutMs=options.pollTimeoutMs??15000;
    this.maxBytes=options.maxBytes??65536; this.maxPending=options.maxPending??8;
    this.onConnect=options.onConnect;
    this.jobs=new Map(); this.lease=null; this.waiter=null; this.closed=false; this.handoffAfter=0; this.dispatchedUntil=0; this.lastNow=this.now();
  }
  checkSize(value) {
    let text;try{text=JSON.stringify(value);}catch{throw failure('RELAY_BAD_REQUEST');}
    if(text===undefined)throw failure('RELAY_BAD_REQUEST');
    if(Buffer.byteLength(text)>this.maxBytes)throw failure('RELAY_TOO_LARGE');
  }
  timer(fn,ms) { const timer=this.setTimer(fn,ms);timer?.unref?.();return timer; }
  expire() {
    const now=this.now();
    if(this.lease&&(now<this.lastNow||now>=this.lease.expiresAt))this.dropLease('RENDERER_UNAVAILABLE');
    this.lastNow=now;
    for(const job of [...this.jobs.values()])if(now>=job.command.deadline)this.settle(job,failure('RELAY_TIMEOUT'));
  }
  renew() {
    this.clearTimer(this.lease.timer);this.lease.expiresAt=this.now()+this.leaseMs;
    this.lease.timer=this.timer(()=>this.dropLease('RENDERER_UNAVAILABLE'),this.leaseMs);
  }
  owns(payload) { return this.lease&&payload.clientId===this.lease.clientId&&payload.leaseToken===this.lease.token; }
  settle(job,error,value) {
    if(!this.jobs.delete(job.command.id))return;
    this.clearTimer(job.timer);error?job.reject(error):job.resolve(value);
  }
  dropLease(code) {
    if(this.lease)this.clearTimer(this.lease.timer);
    // A new renderer must not take over while an old dispatched action can still begin.
    this.handoffAfter=Math.max(this.handoffAfter,this.dispatchedUntil);this.lease=null;
    const waiting=this.waiter;if(waiting)waiting.finish(undefined,failure(code));
    for(const job of [...this.jobs.values()])this.settle(job,failure(code));
  }
  nextCommand() {
    const job=[...this.jobs.values()].find(item=>!item.dispatched);
    if(!job)return null;
    job.dispatched=true;this.dispatchedUntil=Math.max(this.dispatchedUntil,job.command.deadline);
    return {...job.command};
  }
  flush() {
    if(this.waiter&&this.lease){const command=this.nextCommand();if(command)this.waiter.finish(this.reply(command));}
  }
  reply(command) { return {leaseToken:this.lease.token,expiresAt:this.lease.expiresAt,command}; }
  async request(operation,details={}) {
    this.expire();if(this.closed)throw failure('RELAY_CLOSED');
    const rules={state:[],config:[],broadcast:['pet','text','feedback'],anim:['pet','name','feedback']};
    const allowed=Object.hasOwn(rules,operation)?rules[operation]:undefined;
    if(!allowed||!record(details)||Object.keys(details).some(key=>!allowed.includes(key)))throw failure('RELAY_BAD_REQUEST');
    if(allowed.includes('pet')&&(typeof details.pet!=='string'||!details.pet.trim()||details.pet.length>64))throw failure('RELAY_BAD_REQUEST');
    if(operation==='broadcast'&&(typeof details.text!=='string'||!details.text.trim()))throw failure('RELAY_BAD_REQUEST');
    if(operation==='anim'&&details.name!=='care')throw failure('RELAY_BAD_REQUEST');
    if(Object.hasOwn(details,'feedback'))details={...details,feedback:feedbackDetails(details.feedback)};
    this.checkSize({operation,...details});
    if(!this.lease)throw failure('RENDERER_UNAVAILABLE');
    if(this.jobs.size>=this.maxPending)throw failure('RELAY_BUSY');
    return new Promise((resolve,reject)=>{
      const command={id:randomUUID(),operation,...details,issuedAt:this.now(),deadline:this.now()+this.requestTimeoutMs};
      const job={command,resolve,reject,dispatched:false};
      job.timer=this.timer(()=>this.settle(job,failure('RELAY_TIMEOUT')),this.requestTimeoutMs);
      this.jobs.set(command.id,job);this.flush();
    });
  }
  async state(pet) {
    const state=await this.request('state');
    if(pet!==undefined){
      const entries=await this.request('config');
      if(!record(entries))throw failure('RELAY_BAD_RESPONSE');
      if(!Object.values(entries).some(entry=>Array.isArray(entry?.pets)&&entry.pets.some(item=>item?.id===pet)))throw failure('PET_NOT_FOUND');
    }
    return state;
  }
  broadcast(pet,text,feedback) { return this.request('broadcast',{pet,text,...feedback===undefined?{}:{feedback}}); }
  async animate(pet,feedback) {
    const extra=feedback===undefined?{}:{feedback:feedbackDetails(feedback)};
    const entries=await this.request('config');
    if(!record(entries))throw failure('RELAY_BAD_RESPONSE');
    const entry=Object.values(entries).find(item=>item?.pets?.some(p=>p?.id===pet));
    if(entry?.animations?.categories?.some(category=>category.actions?.includes('care')))await this.request('anim',{pet,name:'care',...extra});
  }
  take(payload,signal) {
    if(!validId(payload.clientId))throw failure('RELAY_BAD_REQUEST');
    if(!this.lease){
      if(this.now()<this.handoffAfter)throw failure('RELAY_HANDOFF');
      this.lease={clientId:payload.clientId,token:randomUUID(),expiresAt:0};this.renew();
      if(typeof this.onConnect==='function')void Promise.resolve().then(()=>this.onConnect()).catch(()=>{});
      return this.reply(null);
    }
    if(!this.owns(payload))throw failure('RELAY_BUSY');
    if(this.waiter)throw failure('RELAY_BUSY');
    if(signal?.aborted){this.dropLease('RENDERER_UNAVAILABLE');throw failure('RELAY_LEASE_LOST');}
    this.renew();const command=this.nextCommand();if(command)return this.reply(command);
    return new Promise((resolve,reject)=>{
      const abort=()=>{waiting.finish(undefined,failure('RELAY_LEASE_LOST'));this.dropLease('RENDERER_UNAVAILABLE');};
      const waiting={finish:(value,error)=>{
        if(this.waiter!==waiting)return;this.waiter=null;this.clearTimer(waiting.timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve(value);
      }};
      waiting.timer=this.timer(()=>waiting.finish(this.reply(null)),this.pollTimeoutMs);
      this.waiter=waiting;signal?.addEventListener('abort',abort,{once:true});
    });
  }
  complete(payload) {
    if(!this.owns(payload))throw failure('RELAY_LEASE_LOST');
    if(!validId(payload.id)||typeof payload.ok!=='boolean')throw failure('RELAY_BAD_REQUEST');
    this.renew();const job=this.jobs.get(payload.id);
    if(!job||!job.dispatched)return {accepted:false};
    if(payload.ok){
      if(!record(payload.value))throw failure('RELAY_BAD_RESPONSE');
      this.settle(job,null,payload.value);
    }else this.settle(job,failure(Object.hasOwn(messages,payload.error?.code)?payload.error.code:'DEPENDENCY_UNAVAILABLE'));
    return {accepted:true};
  }
  async rpc(method,payload,signal) {
    try{
      this.expire();if(this.closed)throw failure('RELAY_CLOSED');
      if(!record(payload))throw failure('RELAY_BAD_REQUEST');this.checkSize(payload);
      let value;
      if(method==='take')value=await this.take(payload,signal);
      else if(method==='complete')value=this.complete(payload);
      else if(method==='release'){if(!this.owns(payload))throw failure('RELAY_LEASE_LOST');this.dropLease('RENDERER_UNAVAILABLE');value={released:true};}
      else throw failure('RELAY_BAD_REQUEST');
      return {ok:true,value};
    }catch(error){return {ok:false,error:{code:error.code??'RELAY_BAD_REQUEST',message:messages[error.code]??messages.RELAY_BAD_REQUEST,details:{}}};}
  }
  close() {if(this.closed)return;this.closed=true;this.dropLease('RELAY_CLOSED');}
}

async function requestMessage(request,maxBytes) {
  const reader=request.body?.getReader();if(!reader)throw failure('RELAY_BAD_REQUEST');
  const chunks=[];let length=0;
  try {
    while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>maxBytes)throw failure('RELAY_TOO_LARGE');chunks.push(part.value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw failure('RELAY_BAD_REQUEST');}
  }catch(error){try{await reader.cancel();}catch{}throw error;}
  finally{reader.releaseLock();}
}

/** Public exact Fetch routes stay behind Connection's existing authenticated /api carrier. */
export function bindRendererBridge(ctx,bridge) {
  for(const method of ['take','complete','release'])ctx.effect(()=>ctx.connection.fetch.register({
    path:`${RELAY_CHANNEL}/${RELAY_ENDPOINT}/${method}`,methods:['POST'],requestBody:'buffered',
    async fetch(request) {
      const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
      if(request.method!=='POST')return Response.json({error:'method not allowed'},{status:405,headers});
      if(request.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')return Response.json({error:'JSON required'},{status:415,headers});
      let rpcId='invalid-request';
      try {
        const message=await requestMessage(request,bridge.maxBytes);
        if(!record(message)||Object.keys(message).length!==4||!['type','rpcId','method','payload'].every(key=>Object.hasOwn(message,key))||message.type!=='client-request'||typeof message.rpcId!=='string'||message.rpcId.length<1||message.rpcId.length>100||/[^A-Za-z0-9_-]/.test(message.rpcId)||message.method!==`${RELAY_ENDPOINT}/${method}`)throw failure('RELAY_BAD_REQUEST');
        rpcId=message.rpcId;
        const result=await bridge.rpc(method,message.payload,request.signal);
        const envelope={type:'server-response',rpcId,result};
        bridge.checkSize(envelope);
        return Response.json(envelope,{headers});
      }catch(error){
        const code=error.code==='RELAY_TOO_LARGE'?'RELAY_TOO_LARGE':'RELAY_BAD_REQUEST';
        return Response.json({type:'server-response',rpcId,result:{ok:false,error:{code,message:messages[code],details:{}}}},{status:code==='RELAY_TOO_LARGE'?413:400,headers});
      }
    },
  }),`company renderer relay ${method} Fetch route`);
  ctx.effect(()=>()=>bridge.close(),'company renderer relay disposal');
  return bridge;
}
