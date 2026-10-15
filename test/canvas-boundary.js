// Small pixel boundary, not a browser polyfill. Production player owns all scheduling and drawing choices.
export function canvasBoundary(canvas){
 let width=0,height=0;
 const ctx={canvas,globalCompositeOperation:'source-over',operations:[],
  clearRect(){canvas.pixels.fill(0);this.operations.push({type:'clear'});},
  drawImage(source,dx,dy,dw,dh){
   if(canvas.drawError||source.drawError)throw Error('Frame unavailable');
   const sw=source.videoWidth??source.width,sh=source.videoHeight??source.height,bytes=source.framePixels??source.pixels;
   if(!sw||!sh||!bytes)throw Error('Frame unavailable');dw??=sw;dh??=sh;
   this.operations.push({type:'draw',source,composite:this.globalCompositeOperation});
   if(this.globalCompositeOperation==='copy')canvas.pixels.fill(0);
   for(let y=Math.max(0,Math.ceil(dy));y<Math.min(height,Math.ceil(dy+dh));y++)for(let x=Math.max(0,Math.ceil(dx));x<Math.min(width,Math.ceil(dx+dw));x++){
    const s=(Math.min(sh-1,Math.floor((y-dy)/dh*sh))*sw+Math.min(sw-1,Math.floor((x-dx)/dw*sw)))*4,t=(y*width+x)*4;
    if(this.globalCompositeOperation==='copy')canvas.pixels.set(bytes.slice(s,s+4),t);
    else{const a=bytes[s+3]/255,b=canvas.pixels[t+3]/255,out=a+b*(1-a);for(let k=0;k<3;k++)canvas.pixels[t+k]=out?(bytes[s+k]*a+canvas.pixels[t+k]*b*(1-a))/out:0;canvas.pixels[t+3]=out*255;}
   }
  },
 };
 const resize=()=>{canvas.pixels=new Uint8ClampedArray(width*height*4);ctx.globalCompositeOperation='source-over';ctx.operations.push({type:'resize'});};
 Object.defineProperties(canvas,{width:{get:()=>width,set:v=>{width=v;resize();}},height:{get:()=>height,set:v=>{height=v;resize();}}});
 canvas.getContext=kind=>kind==='2d'?ctx:null;canvas.context=ctx;canvas.pixels=new Uint8ClampedArray();
 return canvas;
}
