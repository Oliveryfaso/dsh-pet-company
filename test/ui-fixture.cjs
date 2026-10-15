/* Dependency-free component contract fixture. This emulates hooks, not a real DSH renderer. */
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const SOURCE = readFileSync(__dirname + '/../client.js', 'utf8');
const CONFIG = {enabled:true,frequency:'quiet',petId:'main',character:'silver',quietStart:'00:00',quietEnd:'08:00',minGapMinutes:20,sitMinutes:50,waterMinutes:90,workMinutes:120,lateAt:'23:30',sitting:true,water:true,work:true,late:true,schemaVersion:2,provider:'external',externalTarget:'main',embeddedTarget:'companion-silver',handoffConfirmed:true,appearance:{size:462,marginX:16,marginY:16,corner:'bottom-right',cloud:true,pop:true,closeSeconds:8,display:'desktop'}};
const clone = x => JSON.parse(JSON.stringify(x));
function fixture(options = {}) {
  let component, tree, cursor = 0, pending = false, running = true, serial = 0;
  let server = {available:true,reason:'',phase:'watching',config:clone(CONFIG),lastReminder:null};
  Object.assign(server, options.status || {});
  const childPlugins=[], registeredSlots=new Map();
  const pluginEffects = [], slots = [], effects = [], timers = new Map(), calls = [], handlers = [];
  const equal = (a,b) => a && b && a.length === b.length && a.every((v,i) => Object.is(v,b[i]));
  function schedule() { if (!running || pending) return; pending = true; queueMicrotask(() => { pending = false; if (running) render(); }); }
  const React = {
    createElement(type, props, ...children) { return {type, props:props || {}, children:children.flat(Infinity).filter(x => x !== false && x !== null && x !== undefined)}; },
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = {value:typeof initial === 'function' ? initial() : initial}; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; schedule(); }]; },
    useRef(value) { const i = cursor++; if (!slots[i]) slots[i] = {current:value}; return slots[i]; },
    useCallback(fn, deps) { const i = cursor++; if (!slots[i] || !equal(slots[i].deps,deps)) slots[i] = {value:fn,deps}; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || !equal(slots[i].deps,deps)) { const old = slots[i]; slots[i] = {deps,cleanup:old && old.cleanup}; effects.push(() => { if (slots[i].cleanup) slots[i].cleanup(); slots[i].cleanup = fn(); }); } }
  };
  function render() { cursor=0; tree=component(); while(effects.length) effects.shift()(); }
  function context(disposers) {
    const ctx={effect(fn){const cleanup=fn();disposers.push(cleanup);return cleanup;},
      connection:{rpc:{call(channel,method,payload,signal){if(method==='dsh-pet-company/release')return Promise.resolve({ok:true,value:null});return new Promise((resolve,reject)=>{if(signal.aborted)reject(Error('aborted'));else signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});}}},
      slots:{inject(name,gen){assert.ok(['settings.section','shell.overlay'].includes(name));const entries=[...gen()];disposers.push(()=>entries.forEach(meta=>registeredSlots.delete(meta.name+':'+meta.id)));},register(meta,fn){const key=meta.name+':'+meta.id;assert.ok(!registeredSlots.has(key));registeredSlots.set(key,fn);if(meta.name==='settings.section'){assert.equal(meta.label(),'陪伴');component=fn;}else assert.equal(meta.id,'pet-company-runtime');return meta;}},
      plugin(plugin,config){assert.equal(typeof plugin.apply,'function');assert.deepEqual(Array.from(plugin.inject),['slots']);childPlugins.push(plugin.name);const owned=[];const child=context(owned);const returned=plugin.apply(child,config);if(returned)owned.push(returned);const dispose=()=>{for(const fn of owned.splice(0).reverse())fn?.();};disposers.push(dispose);return {dispose};}
    };return ctx;
  }
  const ctx=context(pluginEffects);
  const sandbox = {window:{__ModuleLoader__:{load(spec) {assert.equal(spec.id,'dsh-pet-company'); const mod=spec.factory(name=>{assert.equal(name,'react');return React;}); assert.deepEqual(Array.from(mod.inject),['slots','connection']); mod.apply(ctx);}}},AbortController,Set,Date,JSON,Number,Object,console,TextEncoder,TextDecoder,crypto:{randomUUID:()=>'fixture-renderer'},
    setTimeout(fn,ms) {const id=++serial; timers.set(id,{fn,ms,type:'timeout'});return id;},clearTimeout(id){timers.delete(id);},
    setInterval(fn,ms) {const id=++serial;timers.set(id,{fn,ms,type:'interval'});return id;},clearInterval(id){timers.delete(id);},
    async fetch(url,request) {calls.push({url,request}); if(handlers.length)return handlers.shift()(url,request); const path=url.split('/').pop(); if(path==='config')server.config=JSON.parse(request.body); if(path==='snooze')server.phase='snoozed'; return {ok:true,json:async()=>clone(path==='test'?{ok:true}:server)};}
  };
  vm.runInNewContext(SOURCE,sandbox,{filename:'client.js'}); render();
  function nodes(node=tree) { if(!node || typeof node!=='object')return []; return [node,...node.children.flatMap(x=>nodes(x))]; }
  const result = {
    calls,handlers,timers,childPlugins,registeredSlots,
    get tree(){return tree;},get server(){return server;},set server(value){server=value;},
    text(){const walk=node=>node&&typeof node==='object'?node.children.map(walk).join(''):String(node??'');return walk(tree);},
    byRole(role){return nodes().filter(node=>node.props.role===role);},
    byId(id){return nodes().find(node=>node.props.id===id);},
    button(label){return nodes().find(node=>node.type==='button' && node.children.some(x=>typeof x==='string' && x.includes(label)));},
    input(id,value){const input=result.byId(id);assert.ok(input,'missing input '+id);input.props.onChange({target:{value}});},
    click(label){const button=result.button(label);assert.ok(button,'missing button '+label);assert.ok(!button.props.disabled,'disabled button '+label);return button.props.onClick({preventDefault(){}});},
    submit(){const form=nodes().find(n=>n.type==='form');assert.ok(form);form.props.onSubmit({preventDefault(){}});},
    poll(){const timer=[...timers.values()].find(x=>x.type==='interval');assert.equal(timer.ms,15000);return timer.fn();},
    timeout(){const timer=[...timers.values()].find(x=>x.type==='timeout'&&x.ms===8000);assert.ok(timer,'request timeout installed');timer.fn();},
    unmount(){running=false;pluginEffects.splice(0).reverse().forEach(fn=>fn?.());slots.forEach(x=>{if(x && x.cleanup)x.cleanup();});},
    async flush(){for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));}
  };
  return result;
}

module.exports = {fixture, CONFIG, clone};
