import {OWNED_ROUTE,readOwnedAsset} from './assets.js';
export const name='pet-company-runtime';
export const inject=['webServer'];
export function apply(ctx,{controller}){
 ctx.effect(()=>ctx.webServer.register({kind:'prefix',path:OWNED_ROUTE,async handler(req,res){
  try{if(req.method!=='GET'){res.writeHead(405);res.end();return;}const url=new URL(req.url,'http://localhost');
   if(url.pathname===OWNED_ROUTE+'/view'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(controller.view(url.searchParams.get('visible')==='1')));return;}
   const match=url.pathname.match(/^\/pet-company-runtime\/asset\/([^/]+)\/([^/]+)\.webm$/);if(!match)throw Error();
   const asset=await readOwnedAsset(decodeURIComponent(match[1]),decodeURIComponent(match[2]));res.writeHead(200,{'Content-Type':asset.type,'Content-Length':asset.bytes.length,'X-Content-Type-Options':'nosniff'});res.end(asset.bytes);
  }catch{res.writeHead(404);res.end();}
 }}),'company assets and view');
 ctx.on('session/event',(session,event)=>controller.observe(session,event));ctx.on('agent/error',()=>controller.observeError());
 ctx.effect(()=>()=>controller.close(),'company controller lifetime');
}
