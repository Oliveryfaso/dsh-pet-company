#!/usr/bin/env python3
"""Adapt the selected fywdy community sprite sheets to DSH pet packs.

Build-time only: Python + Pillow, ffmpeg/libvpx-vp9, ffprobe. No installation.
Uniform resize only; no per-frame bounding-box alignment or anatomy correction.
The source art is CC BY-NC 4.0. Upstream scripts/JSON and this project adapter code are MIT; art remains CC BY-NC 4.0.
"""
import argparse
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import time
from PIL import Image, ImageDraw

ROWS = [
 ('idle',0,[280,110,110,140,140,320]),
 ('running-right',1,[120]*7+[220]),
 ('running-left',2,[120]*7+[220]),
 ('waving',3,[140]*3+[280]),
 ('jumping',4,[140]*4+[280]),
 ('failed',5,[140]*7+[240]),
 ('waiting',6,[150]*5+[260]),
 ('running',7,[120]*5+[220]),
 ('review',8,[150]*5+[280]),
]
PETS = {
 'silver':('chatgpt-white-dragon-chibi-v5','银白龙娘'),
 'orange':('claude-orange-scholar-chibi-v3','橙书娘'),
 'tide':('deepseek-whale-maid-chibi-v4','蓝鲸女仆'),
}


def write_json(file, value):
 file.parent.mkdir(parents=True,exist_ok=True)
 file.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')


def sample_metrics(tile):
 alpha=tile.getchannel('A');box=alpha.getbbox()
 if box is None: return {'bbox':None,'opaquePixels':0,'edgeContacts':[]}
 edge=[]
 if box[0]==0: edge.append('left')
 if box[1]==0: edge.append('top')
 if box[2]==192: edge.append('right')
 if box[3]==208: edge.append('bottom')
 histogram=alpha.histogram()
 return {'bbox':list(box),'width':box[2]-box[0],'height':box[3]-box[1],
         'aspectRatio':round((box[2]-box[0])/(box[3]-box[1]),4),
         'visiblePixels':192*208-histogram[0],'opaquePixels':histogram[255],
         'edgeContacts':edge}


def canvas_frame(tile, scale):
 w,h=round(192*scale),round(208*scale)
 if w>640 or h>360: raise ValueError('Uniform scale does not fit the 640x360 canvas')
 resized=tile.resize((w,h),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(640,360),(0,0,0,0))
 canvas.alpha_composite(resized,((640-w)//2,(360-h)//2))
 return canvas


def encode(file, frames, durations, tick, ffmpeg):
 fps=1000//tick
 command=[ffmpeg,'-hide_banner','-loglevel','error','-y',
  '-threads','1','-filter_threads','1','-filter_complex_threads','1',
  '-f','rawvideo','-pixel_format','rgba','-video_size','640x360','-framerate',str(fps),'-i','pipe:0',
  '-an','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-lossless','1','-auto-alt-ref','0',
  '-row-mt','0','-tile-columns','0','-threads','1','-deadline','good','-cpu-used','4',str(file)]
 file.parent.mkdir(parents=True,exist_ok=True)
 start=time.monotonic()
 process=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 try:
  for frame,duration in zip(frames,durations):
   raw=frame.tobytes()
   for _ in range(duration//tick): process.stdin.write(raw)
  process.stdin.close()
  error=process.stderr.read().decode('utf8','replace')
  code=process.wait()
 except BaseException:
  process.kill();process.wait();raise
 if code: raise RuntimeError(error)
 return {'elapsedSeconds':round(time.monotonic()-start,3),'threads':1,'fps':fps,
         'encodedFrames':sum(durations)//tick,'durationMs':sum(durations),
         'logicalSourceFrames':len(frames),'sourceFrameDurationMs':durations,
         'losslessVp9':True,'pixelFormat':'yuva420p','frameHoldTickMs':tick,'fileBytes':file.stat().st_size}


def validate(file, expected, ffmpeg, ffprobe):
 probe=subprocess.run([ffprobe,'-v','error','-show_entries',
  'format=duration:stream=codec_name,width,height,r_frame_rate:stream_tags=alpha_mode','-of','json',str(file)],
  capture_output=True,text=True,check=True)
 info=json.loads(probe.stdout);stream=info['streams'][0]
 if (stream['codec_name'],stream['width'],stream['height'])!=('vp9',640,360):raise ValueError('Wrong video format')
 if stream.get('tags',{}).get('alpha_mode')!='1':raise ValueError('Missing alpha metadata')
 actual_ms=round(float(info['format']['duration'])*1000)
 if actual_ms!=expected['durationMs']:raise ValueError(f'Duration mismatch: {actual_ms} != {expected["durationMs"]}')
 process=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-filter_complex_threads','1','-c:v','libvpx-vp9',
  '-i',str(file),'-f','rawvideo','-pix_fmt','rgba','pipe:1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 count=0;samples=[];boundaries=[];hold=0;held_frame=None
 for duration in expected['sourceFrameDurationMs']:
  boundaries.append(hold);hold+=duration//expected['frameHoldTickMs']
 try:
  while True:
   raw=process.stdout.read(640*360*4)
   if not raw:break
   if len(raw)!=640*360*4:raise ValueError('Incomplete decoded RGBA frame')
   if count in boundaries:
    held_frame=raw
    alpha=raw[3::4]
    transparent=alpha.count(0);opaque=alpha.count(255)
    if transparent<120000 or opaque<4000 or raw[3]!=0:raise ValueError('Invalid transparent frame')
    samples.append({'encodedFrame':count,'transparentPixels':transparent,'opaquePixels':opaque,'cornerRGBA':list(raw[:4])})
   elif raw!=held_frame:raise ValueError('Encoded image changed within a required SPEC frame hold')
   count+=1
  error=process.stderr.read().decode('utf8','replace');code=process.wait()
 finally:
  if process.poll() is None:process.kill();process.wait()
 if code:raise RuntimeError(error)
 if count!=expected['encodedFrames']:raise ValueError(f'Frame count {count} != {expected["encodedFrames"]}')
 return {'durationMs':actual_ms,'decodedFrames':count,'codec':'vp9','alphaMode':1,'sourceBoundarySamples':samples,'decoder':'libvpx-vp9','exactFrameHoldsVerified':True}


def config(kind):
 _,name=PETS[kind]
 return {
  'whisperPrompt':f'你是{name}，一位温柔、带点损友式幽默的桌面小伙伴。关心主人，反内卷，不说教。用20字以内的一句话说人话。',
  'memes':{},
  'pets':[{'name':name,'id':f'companion-{kind}','size':462,'balanceEnabled':False,'whisperEnabled':False,
   'workStatusEnabled':False,'fixedEnabled':True,'display':'desktop',
   'presentation':{'theme':kind,'pop':True,'cloud':True,'closeSeconds':8},
   'position':{'corner':'bottom-right','marginX':16,'marginY':16}}],
  'animations':{
   'idle':['idle'],'turn':[],'drag':['waiting'],'clicks':['waving','jumping'],
   'moves':{'default':{'minDist':40,'maxDist':90,'margin':20,'leadSec':0,'tailSec':0.22},'actions':[{'name':'running-left'}]},
   'categories':[{'id':'源动作预览','weight':0,'actions':['care','waving','jumping','failed','waiting','running','review']},
                 {'id':'向右跑原图（原地预览）','weight':0,'noMirror':True,'actions':['running-right']}],
   'events':{'balance':['idle']*6,'whisper':['care'],
             'workStatus':['review','running','review','waiting','jumping','failed']}},
  'animationWeights':{'idle':100,'turn':0,'move':0}}


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source-root',type=Path,required=True,help='Root containing the three selected source directories')
 parser.add_argument('--out',type=Path,default=Path(__file__).resolve().parents[1])
 parser.add_argument('--scale',type=float,default=1.5)
 parser.add_argument('--only',choices=list(PETS))
 parser.add_argument('--ffmpeg',default='ffmpeg');parser.add_argument('--ffprobe',default='ffprobe')
 parser.add_argument('--orange-idle',choices=['source','review'],default='review',help='Explicit source/review configuration choice; all source clips are retained')
 args=parser.parse_args()
 tick=math.gcd(*(duration for _,_,durations in ROWS for duration in durations))
 if tick!=10:raise ValueError('Unexpected SPEC timing base')
 qa=args.out/'qa'/'fywdy';qa.mkdir(parents=True,exist_ok=True)
 template=Path(__file__).with_name('preview-pet-packs.html')
 if template.exists():
  preview=args.out/'assets'/'characters'/'preview.html';preview.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(template,preview)
 reports=[]
 for kind,(source_id,name) in PETS.items():
  if args.only and kind!=args.only:continue
  atlas_path=args.source_root/source_id/'spritesheet.webp'
  with Image.open(atlas_path) as image:
   if image.size!=(1536,2288):raise ValueError(f'Wrong v2 source dimensions: {atlas_path}')
   atlas=image.convert('RGBA')
  metrics=[];contact=Image.new('RGBA',(640*3,384*3),'#e9edf2');draw=ImageDraw.Draw(contact)
  clips=[]
  for index,(action,row,durations) in enumerate(ROWS):
   tiles=[atlas.crop((column*192,row*208,(column+1)*192,(row+1)*208)) for column in range(len(durations))]
   for column,tile in enumerate(tiles):metrics.append({'action':action,'row':row,'column':column,**sample_metrics(tile)})
   frames=[canvas_frame(tile,args.scale) for tile in tiles]
   label_x=(index%3)*640;label_y=(index//3)*384
   contact.alpha_composite(frames[0],(label_x,label_y+24));draw.text((label_x+16,label_y+6),action,fill='#253449')
   preview=args.out/'assets'/'characters'/f'{kind}-{action}.png';preview.parent.mkdir(parents=True,exist_ok=True);frames[0].save(preview)
   midpoint=qa/f'{kind}-{action}-midpoint.png';frames[len(frames)//2].save(midpoint)
   file=args.out/'pet'/f'companion-{kind}-animation'/f'{action}.webm'
   encoded=encode(file,frames,durations,tick,args.ffmpeg)
   verified=validate(file,encoded,args.ffmpeg,args.ffprobe)
   clips.append({'kind':kind,'sourceId':source_id,'action':action,'row':row,'file':str(file.relative_to(args.out)),**encoded,'verified':verified})
   print(f'{kind}/{action}: {len(tiles)} source frames, {encoded["durationMs"]}ms, {encoded["encodedFrames"]} encoded frames, {encoded["elapsedSeconds"]}s CPU path',flush=True)
  animation_dir=args.out/'pet'/f'companion-{kind}-animation'
  shutil.copyfile(animation_dir/'waving.webm',animation_dir/'care.webm')
  if kind=='orange':
   shutil.copyfile(animation_dir/'idle.webm',animation_dir/'source-idle.webm')
   shutil.copyfile(animation_dir/'review.webm',animation_dir/'care.webm')
  pet_config=config(kind)
  if kind=='orange':
   pet_config['animations']['clicks']=['care']
   pet_config['animations']['events']['workStatus']=['review','running','review','waiting','care','review']
   pet_config['animations']['categories'][0]['id']='原始动作预览（跳跃、失败及原待机偏扁）'
   if args.orange_idle=='review':
    pet_config['animations']['idle']=['review']
    pet_config['animations']['events']['balance']=['review']*6
   pet_config['animations']['categories'][0]['actions'].append('source-idle')
  write_json(args.out/'pet'/f'companion-{kind}-config.json',pet_config)
  default_preview='review' if kind=='orange' and args.orange_idle=='review' else 'idle'
  shutil.copyfile(args.out/'assets'/'characters'/f'{kind}-{default_preview}.png',args.out/'assets'/'characters'/f'{kind}.png')
  write_json(qa/f'{kind}-source-metrics.json',{'sourceId':source_id,'canvas':[192,208],
   'note':'Boundary contact is a source-art clipping risk, not proof that adaptation cropped the image. Orange source scale/proportion discontinuity is preserved intentionally.',
   'frames':metrics,'sourceEdgeContactFrames':sum(bool(m['edgeContacts']) for m in metrics)})
  contact.save(qa/f'{kind}-actions-contact.png')
  write_json(qa/f'{kind}-timing-report.json',{'sourceId':source_id,'scale':args.scale,'placement':{'x':(640-round(192*args.scale))//2,'y':(360-round(208*args.scale))//2},'clips':clips})
  reports.extend(clips)
 all_reports=[]
 for timing_file in sorted(qa.glob('*-timing-report.json')):all_reports.extend(json.loads(timing_file.read_text())['clips'])
 write_json(qa/'last-run-report.json',{'frameHoldTickMs':tick,'resampling':'uniform LANCZOS','ffmpegThreads':1,'sequential':True,'clips':all_reports})
 write_json(args.out/'orange-idle-options.json',{'pendingUserChoice':False,'userSelected':'review','source':{'idle':['idle'],'sourceIdleFile':'source-idle.webm'},'review':{'idle':['review'],'sourceIdleFile':'source-idle.webm'},'note':'Source orange idle/jumping/failed include visible scale/proportion discontinuities. No anatomy correction or per-frame scaling has been applied.'})

if __name__=='__main__':main()
