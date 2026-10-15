#!/usr/bin/env node
/** Chromium alpha and config-reference checks; build-time only, no installs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const modulePath=process.env.PLAYWRIGHT_MODULE||'playwright';
const {chromium}=require(modulePath);
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const report=JSON.parse(await fs.readFile(path.join(root,'qa/fywdy/last-run-report.json'),'utf8'));
if(report.clips.length!==27)throw new Error(`Expected 27 source clips, got ${report.clips.length}`);
for(const kind of ['silver','orange','tide']){
 const cfg=JSON.parse(await fs.readFile(path.join(root,'pet',`companion-${kind}-config.json`),'utf8'));
 if(kind==='orange'&&JSON.stringify(cfg.animations.idle)!=='["review"]')throw new Error('Orange must default to the user-selected reading animation');
 if(Array.isArray(cfg.workStatusTexts)&&cfg.workStatusTexts.length===0)throw new Error('Upstream rejects an empty workStatusTexts array; omit it to inherit valid defaults');
 const a=cfg.animations;
 if(a.moves.actions.some(x=>x.name!=='running-left'))throw new Error('Only canonical left-running assets may drive DSH movement');
 const references=[...a.idle,...a.turn,...a.drag,...a.clicks,...a.moves.actions.map(x=>x.name),...a.categories.flatMap(x=>x.actions),...Object.values(a.events).flat(2)];
 for(const name of new Set(references))await fs.access(path.join(root,'pet',`companion-${kind}-animation`,`${name}.webm`));
 const careSource=await fs.readFile(path.join(root,'pet',`companion-${kind}-animation/${kind==='orange'?'review':'waving'}.webm`));
 const care=await fs.readFile(path.join(root,'pet',`companion-${kind}-animation/care.webm`));
 if(!careSource.equals(care))throw new Error('Care must match the selected normal-proportion source action');
 if(kind==='orange'){
  const idle=await fs.readFile(path.join(root,'pet',`companion-${kind}-animation/idle.webm`));
  const sourceIdle=await fs.readFile(path.join(root,'pet',`companion-${kind}-animation/source-idle.webm`));
  if(!idle.equals(sourceIdle))throw new Error('Orange source idle must be retained unmodified');
 }
}
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1120,height:780},deviceScaleFactor:1});
 for(const clip of report.clips){
  const b64=(await fs.readFile(path.join(root,clip.file))).toString('base64');
  const result=await page.evaluate(async({b64,time})=>{
   const video=document.createElement('video');video.muted=true;video.preload='auto';
   const loaded=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error('Browser decode failed'));});
   video.src='data:video/webm;base64,'+b64;await loaded;
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');
   const samples=[];
   for(const seekTime of [0,time]){
    if(seekTime>0){const seeked=new Promise(resolve=>video.onseeked=resolve);video.currentTime=seekTime;await seeked;}
    ctx.clearRect(0,0,640,360);ctx.drawImage(video,0,0);const rgba=ctx.getImageData(0,0,640,360).data;
    let transparentPixels=0,opaquePixels=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]===0)transparentPixels++;if(rgba[i]===255)opaquePixels++;}
    samples.push({time:seekTime,transparentPixels,opaquePixels,cornerRGBA:Array.from(rgba.slice(0,4))});
   }
   video.removeAttribute('src');video.load();video.remove();return samples;
  },{b64,time:clip.durationMs/2000});
  for(const sample of result)if(sample.cornerRGBA[3]!==0||sample.transparentPixels<120000||sample.opaquePixels<4000)throw new Error(`Chromium alpha failed for ${clip.file}`);
  results.push({kind:clip.kind,action:clip.action,samples:result});
 }
 await page.goto('file://'+path.join(root,'assets/characters/preview.html'));
 await page.screenshot({path:path.join(root,'assets/characters/preview.png'),fullPage:true});
 await page.setViewportSize({width:375,height:900});
 await page.screenshot({path:path.join(root,'qa/fywdy/preview-mobile.png'),fullPage:true});
 const overflow=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 if(overflow.scrollWidth>overflow.innerWidth)throw new Error('Mobile preview overflows horizontally');
 await fs.writeFile(path.join(root,'qa/fywdy/chromium-verification.json'),JSON.stringify({scope:'27 adapted source clips, decoded serially in headless Chromium; first and midpoint alpha; no DSH host was opened by this check.',mobilePreview:overflow,results},null,2)+'\n');
 console.log(`Checked ${results.length} clips in Chromium (first and midpoint), config references, aliases and 375px preview layout.`);
}finally{await browser.close();}
