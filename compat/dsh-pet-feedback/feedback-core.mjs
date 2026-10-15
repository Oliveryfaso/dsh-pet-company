/** Renderer-independent feedback state and placement. All geometry uses one CSS/DIP coordinate system. */
const clamp=(n,min,max)=>Math.min(Math.max(n,min),max);
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
export function normalizeFeedback(raw,options={}){
 if(!raw||typeof raw!=='object')return null;
 const eventId=String(raw.eventId??'').trim();
 if(!eventId||Array.from(eventId).length>200)return null;
 const limit=Math.trunc(clamp(finite(options.maxCharacters,120),1,500));
 let text=String(raw.text??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu,'').replace(/\s+/gu,' ').trim();
 const chars=Array.from(text);if(chars.length>limit)text=chars.slice(0,Math.max(0,limit-1)).join('')+'…';
 if(!text)return null;
 return {eventId,text,fallback:raw.fallback===true,trigger:raw.trigger==='click'?'click':'care',via:raw.via==='keyboard'?'keyboard':'pointer',durationMs:clamp(finite(raw.durationMs,finite(options.durationMs,8000)),250,60000)};
}
export function createFeedbackState(options={}){
 return {phase:'hidden',eventId:null,text:'',fallback:false,expiresAt:0,seenIds:[],documentHidden:false,suppressClickUntil:0,options:{durationMs:options.durationMs,maxCharacters:options.maxCharacters}};
}
const clear=(state,phase='hidden')=>({...state,phase,eventId:null,text:'',fallback:false,expiresAt:0});
export function reduceFeedback(state,action,now=0){
 if(state.phase==='destroyed')return state;
 if(action.type==='destroy')return {...clear(state,'destroyed'),seenIds:[]};
 if(action.type==='dragstart')return clear(state,'dragging');
 if(action.type==='dragend')return {...clear(state),suppressClickUntil:now+300};
 if(action.type==='background')return {...(action.hidden?clear(state):state),documentHidden:Boolean(action.hidden)};
 if(action.type==='close')return state.phase==='visible'?clear(state):state;
 if(action.type==='expire')return state.phase==='visible'&&now>=state.expiresAt?clear(state):state;
 if(action.type!=='show')return state;
 const event=normalizeFeedback(action.event,state.options);
 if(!event)return state;
 if(state.seenIds.includes(event.eventId)){
  if(state.phase==='visible'&&state.eventId===event.eventId&&now<state.expiresAt&&state.fallback&&!event.fallback)return {...state,text:event.text,fallback:false};
  return state;
 }
 const seenIds=[...state.seenIds,event.eventId].slice(-64);
 if(state.documentHidden||state.phase==='dragging'||(event.trigger==='click'&&now<state.suppressClickUntil))return {...state,seenIds};
 return {...state,phase:'visible',eventId:event.eventId,text:event.text,fallback:event.fallback,expiresAt:now+event.durationMs,seenIds};
}
function rect(value){
 if(!value)return null;
 const x=Number(value.x??value.left),y=Number(value.y??value.top),width=Number(value.width),height=Number(value.height);
 return [x,y,width,height].every(Number.isFinite)&&width>0&&height>0?{x,y,width,height}:null;
}
export function placeCloud({anchor,bubble,viewport,padding=12,gap=12}={}){
 anchor=rect(anchor);viewport=rect(viewport);
 if(!anchor||!viewport||!bubble||![bubble.width,bubble.height].every(v=>Number.isFinite(v)&&v>0))return null;
 padding=clamp(finite(padding,12),0,Math.min(viewport.width,viewport.height)/4);
 gap=Math.max(0,finite(gap,12));
 const maxWidth=viewport.width-2*padding,maxHeight=viewport.height-2*padding;
 const width=Math.min(bubble.width,maxWidth),height=Math.min(bubble.height,maxHeight);
 const minX=viewport.x+padding,minY=viewport.y+padding,maxX=viewport.x+viewport.width-padding,maxY=viewport.y+viewport.height-padding;
 const above=anchor.y-gap-height,below=anchor.y+anchor.height+gap;
 const placement=above>=minY?'above':below+height<=maxY?'below':(anchor.y-minY>=maxY-(anchor.y+anchor.height)?'above':'below');
 const x=clamp(anchor.x+anchor.width/2-width/2,minX,maxX-width);
 const y=clamp(placement==='above'?above:below,minY,maxY-height);
 const tailPadding=Math.min(18,width/2);
 const tailX=clamp(anchor.x+anchor.width/2-x,tailPadding,width-tailPadding);
 return {x,y,width,height,placement,tailX,maxWidth,maxHeight};
}
export function motionKeyframes(reduced=false){
 return reduced?[]:[{scale:1,offset:0},{scale:.97,offset:.32},{scale:1.01,offset:.72},{scale:1,offset:1}];
}
