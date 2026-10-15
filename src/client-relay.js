/** Self-contained browser function: embed inside the existing ModuleLoader factory, with no imports. */
export function createRendererRelay(options) {
  const channel='/api',endpointPrefix='dsh-pet-company/',rpc=options.rpc,fetcher=options.fetcher??globalThis.fetch;
  const now=options.now??Date.now,clientId=options.clientId??globalThis.crypto.randomUUID();
  const maxBytes=options.maxBytes??65536,fetchTimeoutMs=options.fetchTimeoutMs??3000,retryMs=options.retryMs??1000;
  const lifetime=new AbortController(),seen=new Map();let leaseToken,task;
  const error=code=>Object.assign(new Error(code),{code});
  function feedbackDetails(value){
    if(value===null||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==2||!Object.hasOwn(value,'eventId')||!Object.hasOwn(value,'source'))throw error('RELAY_BAD_REQUEST');
    const {eventId,source}=value;
    if(typeof eventId!=='string'||eventId.length<1||eventId.length>100||/[^A-Za-z0-9_-]/.test(eventId)||source!=='care')throw error('RELAY_BAD_REQUEST');
    return {eventId,source};
  }
  const abort=()=>lifetime.abort();
  if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});
  function size(value){let text;try{text=JSON.stringify(value);}catch{throw error('RELAY_BAD_RESPONSE');}if(text===undefined)throw error('RELAY_BAD_RESPONSE');if(new TextEncoder().encode(text).length>maxBytes)throw error('RELAY_TOO_LARGE');}
  function timeoutSignal(ms,includeLifetime=true){
    const controller=new AbortController(),cancel=()=>controller.abort(error('RELAY_CLOSED'));
    if(includeLifetime){if(lifetime.signal.aborted)cancel();else lifetime.signal.addEventListener('abort',cancel,{once:true});}
    const timer=setTimeout(()=>controller.abort(error('RELAY_TIMEOUT')),ms);
    return {signal:controller.signal,dispose(){clearTimeout(timer);lifetime.signal.removeEventListener('abort',cancel);}};
  }
  async function call(method,payload,ms=3000,includeLifetime=true){const timeout=timeoutSignal(ms,includeLifetime);try{return await rpc.call(channel,endpointPrefix+method,payload,timeout.signal);}finally{timeout.dispose();}}
  async function pause(){if(lifetime.signal.aborted)return;await new Promise(resolve=>{const done=()=>{clearTimeout(timer);lifetime.signal.removeEventListener('abort',done);resolve();};const timer=setTimeout(done,retryMs);lifetime.signal.addEventListener('abort',done,{once:true});});}
  async function jsonBody(response){
    if(!response.body?.getReader)return response.json();
    const reader=response.body.getReader(),chunks=[];let length=0;
    try{
      while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>maxBytes)throw error('RELAY_TOO_LARGE');chunks.push(part.value);}
      const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw error('RELAY_BAD_RESPONSE');}
    }catch(failure){try{await reader.cancel();}catch{}throw failure;}
    finally{reader.releaseLock();}
  }
  async function execute(command){
    const rules={state:[],config:[],broadcast:['pet','text','feedback'],anim:['pet','name','feedback']};
    const fields=Object.hasOwn(rules,command?.operation)?rules[command.operation]:undefined;
    if(!fields||Object.keys(command).some(key=>!['id','operation','issuedAt','deadline',...fields].includes(key)))throw error('RELAY_BAD_REQUEST');
    size(command);
    if(typeof command.id!=='string'||!Number.isFinite(command.issuedAt)||!Number.isFinite(command.deadline)||now()<command.issuedAt||now()>=command.deadline)throw error('RELAY_TIMEOUT');
    if(fields.includes('pet')&&(typeof command.pet!=='string'||!command.pet.trim()||command.pet.length>64))throw error('RELAY_BAD_REQUEST');
    if(command.operation==='broadcast'&&(typeof command.text!=='string'||!command.text.trim()))throw error('RELAY_BAD_REQUEST');
    if(command.operation==='anim'&&command.name!=='care')throw error('RELAY_BAD_REQUEST');
    const extra=Object.hasOwn(command,'feedback')?{feedback:feedbackDetails(command.feedback)}:{};
    const operation=command.operation,post=operation==='broadcast'||operation==='anim';
    const url='/dsh-pet-7340/'+operation+(post?'?pet='+encodeURIComponent(command.pet):'');
    const timeout=timeoutSignal(Math.min(fetchTimeoutMs,command.deadline-now()));
    try{
      if(lifetime.signal.aborted||timeout.signal.aborted)throw error('RELAY_CLOSED');
      const response=await fetcher(url,{method:post?'POST':'GET',credentials:'same-origin',redirect:'error',headers:post?{'Content-Type':'application/json'}:{},body:post?JSON.stringify(operation==='broadcast'?{text:command.text,...extra}:{name:command.name,...extra}):undefined,signal:timeout.signal});
      if(!response.ok)throw error(response.status===403?'DESKTOP_ACCESS_BLOCKED':'DEPENDENCY_UNAVAILABLE');
      const value=await jsonBody(response);size(value);
      if(value===null||typeof value!=='object'||Array.isArray(value))throw error('RELAY_BAD_RESPONSE');
      if(post&&value.ok!==true)throw error(value.reason==='unknown-pet'?'PET_NOT_FOUND':'DEPENDENCY_UNAVAILABLE');
      if(timeout.signal.aborted||now()>=command.deadline)throw error('RELAY_TIMEOUT');
      return {ok:true,value};
    }catch(failure){throw failure?.code?failure:error(timeout.signal.aborted?'RELAY_TIMEOUT':'DEPENDENCY_UNAVAILABLE');}
    finally{timeout.dispose();}
  }
  async function runLoop(){
    try{
      while(!lifetime.signal.aborted){
        try{
          const response=await call('take',{clientId,...leaseToken?{leaseToken}:{}},18000);
          if(!response?.ok){if(response?.error?.code==='RELAY_CLOSED')break;leaseToken=undefined;await pause();continue;}
          if(typeof response.value?.leaseToken!=='string')throw error('RELAY_BAD_RESPONSE');
          leaseToken=response.value.leaseToken;const command=response.value.command;if(!command)continue;
          let result=seen.get(command.id)?.result;
          if(!result){
            for(const [id,entry] of seen)if(entry.deadline<now())seen.delete(id);
            try{if(seen.size>=128)throw error('RELAY_BUSY');result=await execute(command);}
            catch(failure){result={ok:false,error:{code:failure.code??'DEPENDENCY_UNAVAILABLE'}};}
            if(seen.size<128)seen.set(command.id,{deadline:command.deadline,result});
          }
          if(lifetime.signal.aborted)break;
          try{size({type:'client-request',rpcId:'0'.repeat(36),method:endpointPrefix+'complete',payload:{clientId,leaseToken,id:command.id,...result}});}
          catch(failure){result={ok:false,error:{code:failure.code??'RELAY_TOO_LARGE'}};if(seen.has(command.id)||seen.size<128)seen.set(command.id,{deadline:command.deadline,result});}
          const ack=await call('complete',{clientId,leaseToken,id:command.id,...result});
          if(!ack?.ok)leaseToken=undefined;
        }catch{if(!lifetime.signal.aborted)await pause();}
      }
    }finally{
      options.signal?.removeEventListener('abort',abort);
      if(leaseToken)try{await call('release',{clientId,leaseToken},1000,false);}catch{}
      seen.clear();
    }
  }
  return {run(){return task??=(runLoop());},stop(){abort();options.signal?.removeEventListener('abort',abort);return task;}};
}
