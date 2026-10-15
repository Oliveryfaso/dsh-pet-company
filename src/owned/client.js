import {createOwnedView} from './view.js';
export function createOwnedClientPlugin(React) {
 function Overlay(){const host=React.useRef(null);React.useEffect(()=>{let stopped=false,timer,view=null,signature='';const abort=new AbortController();
  const poll=async()=>{try{if(document.hidden){view?.destroy();view=null;signature='';return;}const res=await fetch('/pet-company-runtime/view?visible=1',{credentials:'same-origin',signal:abort.signal});if(!res.ok)throw Error();const data=await res.json();if(stopped)return;const next=data.view?.display==='web'?JSON.stringify(data.view):'';
   if(next){const p=data.view.pet.position;Object.assign(host.current.style,{left:'auto',right:'auto',top:'auto',bottom:'auto'});host.current.style[p.corner.endsWith('left')?'left':'right']=p.marginX+'px';host.current.style[p.corner.startsWith('top')?'top':'bottom']=p.marginY+'px';}
   if(next!==signature){view?.destroy();view=null;signature=next;if(next)view=createOwnedView(host.current,data.view,{assetURL:(id,name)=>'/pet-company-runtime/asset/'+encodeURIComponent(id)+'/'+(name?encodeURIComponent(name)+'.webm':'')});}
   view?.update(data.state);
  }catch{view?.destroy();view=null;signature='';}finally{if(!stopped)timer=setTimeout(poll,1000);}};void poll();return()=>{stopped=true;clearTimeout(timer);abort.abort();view?.destroy();};},[]);
  return React.createElement('div',{ref:host,style:{position:'fixed',right:16,bottom:16,pointerEvents:'none',zIndex:1000,maxWidth:'100vw'}});
 }
 return {name:'pet-company-runtime-client',inject:['slots'],apply(ctx){ctx.slots.inject('shell.overlay',function*(){yield ctx.slots.register({name:'shell.overlay',id:'pet-company-runtime',order:1000},Overlay);});}};
}
