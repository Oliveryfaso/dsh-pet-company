// Company-owned IPC/window adapter; MIT. Derived presentation player attribution is in vendor/.
'use strict';
const {app,BrowserWindow,ipcMain,protocol,screen,session}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const ids=new Set(['companion-silver','companion-orange','companion-tide']);
const userData=process.argv.find(a=>a.startsWith('--company-user-data='))?.slice('--company-user-data='.length);
if(!userData||!path.isAbsolute(userData)){process.exit(2);}
app.setName('DSH Pet Company Helper');app.setPath('userData',userData);app.setPath('sessionData',path.join(userData,'session'));
protocol.registerSchemesAsPrivileged([{scheme:'company-pet',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let win=null,initial=null,buffer='',quitting=false;const pending=new Set();
const emit=data=>process.stdout.write(JSON.stringify(data)+'\n');
const quit=()=>{if(quitting)return;quitting=true;app.quit();};
process.stdin.on('end',quit);process.on('SIGTERM',quit);app.on('window-all-closed',quit);
const same=event=>win&&!win.isDestroyed()&&event.sender===win.webContents;
function validState(state){const pet=state?.pets?.[initial?.view.pet.id];if(!state||Object.keys(state.pets??{}).length!==1||!pet||!state.sections?.workStatus)return false;for(const key of ['say','anim']){const leaf=pet[key];if(!leaf||!Number.isSafeInteger(leaf.counter)||leaf.counter<0)return false;if(leaf.data){const f=leaf.data.feedback;if(!f||f.source!=='care'||typeof f.eventId!=='string'||!/^[A-Za-z0-9_.:-]{1,128}$/.test(f.eventId))return false;if(key==='say'&&(typeof leaf.data.text!=='string'||Array.from(leaf.data.text).length>2000))return false;if(key==='anim'&&leaf.data.name!=='care')return false;}}return true;}
ipcMain.handle('company:init',event=>{if(!same(event))return null;return initial;});
ipcMain.on('company:ready',event=>{if(same(event))emit({type:'ready'});});
ipcMain.on('company:ack',(event,id)=>{if(same(event)&&pending.delete(id))emit({type:'ack',id});});
let interactive=false;
ipcMain.on('company:interactive',(event,value)=>{if(!same(event)||typeof value!=='boolean'||value===interactive)return;interactive=value;win.setIgnoreMouseEvents(!value,{forward:true});});
ipcMain.on('company:drag',(event,delta)=>{if(!same(event)||!delta||!Number.isFinite(delta.dx)||!Number.isFinite(delta.dy)||Math.abs(delta.dx)>2000||Math.abs(delta.dy)>2000)return;const b=win.getBounds(),a=screen.getDisplayMatching(b).workArea,pad=initial.padding;const x=Math.round(Math.min(a.x+a.width-b.width+pad,Math.max(a.x-pad,b.x+delta.dx))),y=Math.round(Math.min(a.y+a.height-b.height+pad,Math.max(a.y-pad,b.y+delta.dy)));win.setBounds({...b,x,y});});
async function boot(message){await app.whenReady();if(quitting)return;const view=message.view;if(!view||!ids.has(view.pet?.id)||!Number.isInteger(view.pet.size)||view.pet.size<100||view.pet.size>800||view.display!=='desktop')throw Error('invalid init');const padding=Math.max(96,Math.round(view.pet.size*.35));initial={view,state:message.state,padding};if(!validState(initial.state))throw Error('invalid state');
 const {readOwnedAsset}=await import('../../src/owned/assets.js');protocol.handle('company-pet',async request=>{try{const u=new URL(request.url),segments=u.pathname.split('/').filter(Boolean);if(u.hostname!=='asset'||segments.length!==2||!segments[1].endsWith('.webm'))throw Error();const asset=await readOwnedAsset(decodeURIComponent(segments[0]),decodeURIComponent(segments[1].slice(0,-5)));return new Response(asset.bytes,{headers:{'Content-Type':asset.type,'Content-Length':String(asset.bytes.length)}});}catch{return new Response('',{status:404});}});
 session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 const a=screen.getPrimaryDisplay().workArea,p=view.pet.position,w=view.pet.size+padding*2,h=Math.ceil(view.pet.size*9/16)+padding*2;
 const x=p.corner.endsWith('left')?a.x+p.marginX-padding:a.x+a.width-p.marginX-w+padding;
 const y=p.corner.startsWith('top')?a.y+p.marginY-padding:a.y+a.height-p.marginY-h+padding;
 win=new BrowserWindow({x:Math.round(x),y:Math.round(y),width:w,height:h,frame:false,transparent:true,hasShadow:false,resizable:false,fullscreenable:false,skipTaskbar:true,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});
 win.setMenu(null);win.setAlwaysOnTop(true,'floating');win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});win.setIgnoreMouseEvents(true,{forward:true});app.dock?.hide();
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));const expected=pathToFileURL(path.join(__dirname,'index.html')).href;win.webContents.on('will-navigate',(event,url)=>{if(url!==expected)event.preventDefault();});win.on('closed',()=>{win=null;quit();});
 await win.loadFile(path.join(__dirname,'index.html'));if(!quitting)win.showInactive();
}
process.stdin.on('data',chunk=>{buffer+=chunk;if(Buffer.byteLength(buffer)>32*1024)return quit();let at;while((at=buffer.indexOf('\n'))>=0){const raw=buffer.slice(0,at);buffer=buffer.slice(at+1);let msg;try{msg=JSON.parse(raw);}catch{return quit();}if(msg.type==='init'&&!initial&&!win){void boot(msg).catch(quit);}else if(msg.type==='state'&&win&&!win.isDestroyed()&&validState(msg.state)&&typeof msg.id==='string'&&/^[a-f0-9-]{36}$/.test(msg.id)&&Number.isFinite(msg.expiresAt)&&msg.expiresAt>=Date.now()&&msg.expiresAt<=Date.now()+3000&&pending.size<2){pending.add(msg.id);win.webContents.send('company:state',{id:msg.id,expiresAt:msg.expiresAt,state:msg.state});}else return quit();}});
