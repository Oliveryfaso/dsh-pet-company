// DOM/media boundary for window-free tests; the view, feedback reducer and player stay real.
import {canvasBoundary} from './canvas-boundary.js';
export function ownedDocument() {
 const timers=new Map(),paints=new Map(),elements=[];let serial=0,clock=0;
 const win=Object.assign(new EventTarget(),{innerWidth:900,innerHeight:700,devicePixelRatio:1,
  performance:{now:()=>clock},getComputedStyle:()=>({transform:'none'}),
  setTimeout(fn){const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),
  requestAnimationFrame(fn){const id=++serial;paints.set(id,fn);return id;},cancelAnimationFrame:id=>paints.delete(id),
  matchMedia:()=>Object.assign(new EventTarget(),{matches:false})});
 const doc=Object.assign(new EventTarget(),{defaultView:win,hidden:false});
 class Element extends EventTarget {
  constructor(tag){super();this.tagName=tag;this.ownerDocument=doc;this.children=[];this.dataset={};const priorities={};this.style={setProperty(key,value,priority=''){this[key]=value;priorities[key]=priority;},getPropertyPriority:key=>priorities[key]??''};this.attributes={};this.className='';this.textContent='';this.offsetWidth=160;this.offsetHeight=80;this.scrollHeight=this.clientHeight=40;this.frames=new Map();this.loads=0;this.pauses=0;this.readyState=0;this.animations=[];if(tag==='video'){this.videoWidth=2;this.videoHeight=1;this.framePixels=new Uint8ClampedArray([255,0,0,255,0,0,0,0]);}
   this.classList={contains:name=>this.className.split(' ').includes(name),add:name=>{if(!this.classList.contains(name))this.className=(this.className+' '+name).trim();},remove:name=>{this.className=this.className.split(' ').filter(v=>v!==name).join(' ');}};elements.push(this);
  }
  append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(e=>e!==this);}
  setAttribute(key,value){this.attributes[key]=value;}
  removeAttribute(key){delete this[key];delete this.attributes[key];}
  setPointerCapture(){}
  getBoundingClientRect(){return {x:250,y:250,left:250,top:250,right:410,bottom:330,width:160,height:80};}
  animate(){const animation={cancel(){}};this.animations.push(animation);return animation;}
  load(){this.loads++;this.readyState=0;this.ended=false;}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;this.pauses++;}
  requestVideoFrameCallback(fn){const id=++serial;this.frames.set(id,fn);return id;}
  cancelVideoFrameCallback(id){this.frames.delete(id);}
  loaded(){this.readyState=2;this.currentSrc=this.src;this.dispatchEvent(new Event('loadeddata'));}
  present(metadata={}){for(const [id,fn]of [...this.frames]){this.frames.delete(id);fn(clock,metadata);}}
 }
 doc.createElement=tag=>{const e=new Element(tag);return tag==='canvas'?canvasBoundary(e):e;};doc.head=doc.createElement('head');doc.body=doc.createElement('body');
 doc.querySelector=selector=>elements.find(e=>selector==='style[data-dsh-feedback-css]'?e.tagName==='style'&&'dshFeedbackCss'in e.dataset:e.classList.contains(selector.slice(1)));
 return {doc,win,elements,timers,paints,setTime(value){clock=value;},paint(){clock+=16;const callbacks=[...paints.values()];paints.clear();for(const fn of callbacks)fn(clock);},fire(target,type,fields={}){target.dispatchEvent(Object.assign(new Event(type),fields));}};
}
