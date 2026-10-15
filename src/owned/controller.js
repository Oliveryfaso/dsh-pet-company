import {roleView} from './config.js';
import {WorkObserver} from './work-observer.js';
const failure=(code,message)=>Object.assign(Error(message),{code});
export class OwnedController {
 constructor({helper,now=Date.now}={}){this.helper=helper;this.now=now;this.observer=new WorkObserver(now);this.target=null;this.currentView=null;this.leaves=null;this.generation=0;this.closed=false;this.active=true;this.seen=new Map();this.webSeen=-Infinity;this.ready=Promise.resolve();}
 rawState(){return {sections:this.observer.snapshot(),pets:this.target?{[this.target]:structuredClone(this.leaves)}:{}};}
 observe(session,event){if(!this.closed)this.observer.observe(session,event);}
 observeError(){if(!this.closed)this.observer.error();}
 async updateTarget(id,appearance){if(this.closed)return;const gen=++this.generation;const view=await roleView(id,appearance);if(gen!==this.generation||this.closed)return;this.active=true;this.target=id;this.currentView=view;this.leaves={say:{counter:0,data:null},anim:{counter:0,data:null}};this.seen.clear();this.webSeen=-Infinity;await this.helper?.configure(view,this.rawState());}
 async configure(config){if(config.provider!=='embedded'||!config.handoffConfirmed){await this.deactivate();return;}await this.updateTarget(config.petId,config.appearance);}
 async deactivate(){this.active=false;this.generation++;this.webSeen=-Infinity;await this.helper?.stop?.();}
 isReady(){return !this.closed&&this.active&&(this.currentView?.display==='web'?this.now()-this.webSeen<5000:this.currentView?.display==='desktop'&&this.helper?.ready===true);}
 check(id){if(id!==this.target)throw failure('PET_NOT_FOUND','找不到所选内置角色');if(!this.isReady())throw failure('OWNED_UNAVAILABLE','内置伴侣尚未就绪，请检查展示方式和独立运行时');}
 async state(id=this.target){this.check(id);return this.rawState();}
 view(visible=true){if(visible&&this.active&&this.currentView?.display==='web')this.webSeen=this.now();return {view:this.active?this.currentView:null,state:this.rawState()};}
 async deliver(kind,id,data,feedback){
  this.check(id);
  if(!feedback||typeof feedback!=='object'||Object.keys(feedback).sort().join(',')!=='eventId,source'||feedback.source!=='care'||typeof feedback.eventId!=='string'||!/^[A-Za-z0-9_.:-]{1,128}$/.test(feedback.eventId))throw Error('关怀标识无效');
  if(this.observer.snapshot().workStatus.data.state==='waiting')throw failure('OWNED_WAITING','等你处理完审批或提问后再关心你');
  const key=kind+':'+feedback.eventId;
  for(const [id,event]of this.seen)if(event.settled&&this.now()-event.at>5*60_000)this.seen.delete(id);
  if(this.seen.has(key))return this.seen.get(key).promise;
  if(this.seen.size>=512)throw failure('OWNED_BUSY','关怀事件已满，请稍后');
  const generation=this.generation;
  this.leaves[kind]={counter:this.leaves[kind].counter+1,data:{...data,feedback:{...feedback}}};
  const promise=(async()=>{if(this.currentView.display==='desktop')await this.helper.send(this.rawState());if(this.closed||generation!==this.generation)throw failure('PROVIDER_CHANGED','陪伴目标已改变');return {ok:true};})();
  const event={promise,at:this.now(),settled:false};this.seen.set(key,event);promise.then(()=>{event.settled=true;},()=>{event.settled=true;});return promise;
 }
 broadcast(id,text,feedback){if(typeof text!=='string'||!text.trim()||Array.from(text).length>2000)return Promise.reject(Error('关怀文字长度无效'));return this.deliver('say',id,{text},feedback);}
 animate(id,feedback){return this.deliver('anim',id,{name:'care'},feedback);}
 close(){if(this.closing)return this.closing;this.closed=true;this.active=false;this.generation++;this.seen.clear();return this.closing=Promise.resolve().then(()=>this.helper?.close?.());}
}
