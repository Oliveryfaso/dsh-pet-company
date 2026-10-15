import {WorkStatusStore,reduceWorkStatus,goalUpdateAction} from '../../vendor/dsh-pet-0.3.7/work-status.js';
export class WorkObserver {
 constructor(now=Date.now){this.now=now;this.store=new WorkStatusStore();this.sessions=new Map();this.seq=0;this.counter=0;this.notify={counter:0,data:null};this.last=null;}
 observe(session,event){
  const id=session?.header?.id??session?.id;if(typeof id!=='string'||!id||id.length>128||!event||typeof event.type!=='string')return;
  this.expire();const prior=this.sessions.get(id)??{at:0,flags:{}};
  if(!this.sessions.has(id)&&this.sessions.size>=256){const oldest=this.sessions.keys().next().value;this.sessions.delete(oldest);this.store.clear(oldest);}
  if(event.type==='turn/start'){prior.flags={};this.store.clear(id);}
  if(event.type==='user/message'&&event.data?.source?.kind==='goal')prior.flags.goalRound=true;
  if(event.type==='tool/call'&&event.data?.name==='update_goal')prior.flags.closing=goalUpdateAction(String(event.data?.arguments??''));
  prior.at=this.now();this.sessions.set(id,prior);
  if(!['turn/start','tool/call','tool/result','approval/asked','turn/end'].includes(event.type))return;
  const next=reduceWorkStatus(event,prior.flags);
  if(next)this.store.setState(id,next,++this.seq);else this.store.clear(id);
  if(event.type==='approval/asked'||event.type==='tool/call'&&event.data?.name==='ask_user_question')this.notify={counter:this.notify.counter+1,data:{type:event.type==='approval/asked'?'approval/requested':'question/requested'}};
  this.refresh();
 }
 error(){this.store.setState('company-agent-error','error',++this.seq);this.sessions.set('company-agent-error',{at:this.now(),flags:{}});this.refresh();}
 expire(){for(const[id,entry]of this.sessions)if(this.now()-entry.at>30*60_000){this.sessions.delete(id);this.store.clear(id);}this.refresh();}
 refresh(){const next=this.store.snapshot().state;if(next!==this.last){this.last=next;this.counter++;}}
 snapshot(){this.expire();return {workStatus:{counter:this.counter,data:{state:this.last}},notify:structuredClone(this.notify)};}
}
