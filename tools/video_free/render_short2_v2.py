#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""仙加味第2支短影片｜免費程式動畫 v2

重點：
- 固定使用核准 full-body 小老闆像素，不重畫產品、不改角色身份。
- 將同一張 full-body 角色拆成頭、雙臂、身體、雙腿，以關節樞紐逐幀旋轉；
  不是整張靜態圖平移/縮放。
- 8個不同場景構圖，角色、夥伴、道具各自有動作。
- 沒有已核准童聲時輸出字幕 technical preview，禁止自動發布。
"""
from __future__ import annotations

import argparse, base64, io, math, subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT=Path(__file__).resolve().parents[2]
SPRITE=ROOT/'assets/reference/mascot-sprite-v20260816.txt'
W,H,FPS,DURATION=720,1280,24,30.0
FRAMES=int(FPS*DURATION)
CREAM='#F7F4ED'; NAVY='#142B4A'; GREEN='#394B36'; RED='#9B2B2B'; GOLD='#C8A45A'; WOOD='#765136'; WHITE='#FFFDF8'; INK='#223044'
FONTS=[
 '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
 '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
 '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
 '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
]
BOXES={
 'main':(8,35,196,425), 'deer':(430,235,501,315), 'turtle':(530,235,610,312)
}
FORBIDDEN=['台興山產','治療','改善疾病','預防疾病','保證功效','膠原蛋白','鈣質']
SUBS=[
 (0,3.6,'早安，今天一起準備開店。'),
 (3.6,7.3,'先把桌面整理好，讓一天慢慢開始。'),
 (7.3,10.9,'小鹿來巡店，小烏龜也沒有缺席。'),
 (10.9,14.7,'藥櫃、杯子、常用的小東西，一樣一樣放回位置。'),
 (14.7,18.5,'天氣還有點涼，先準備一杯溫熱的。'),
 (18.5,22.4,'仙加味的日常，不急著趕快，先把每件事做好。'),
 (22.4,26.2,'等等開門，也準備好聽大家聊聊今天需要什麼。'),
 (26.2,30.0,'店準備好了。早安，今天也一起照自己的節奏來。'),
]

@dataclass
class Scene:
 start:float; end:float; key:str; label:str
SCENES=[
 Scene(0,3.6,'door','準備開店'),
 Scene(3.6,7.3,'table','整理桌面'),
 Scene(7.3,10.9,'friends','夥伴報到'),
 Scene(10.9,14.7,'shelf','整理藥櫃'),
 Scene(14.7,18.5,'warm','準備溫熱飲'),
 Scene(18.5,22.4,'rhythm','照自己的節奏'),
 Scene(22.4,26.2,'counter','準備接待'),
 Scene(26.2,30.0,'open','今天開店了'),
]

def fnt(n,bold=True):
 for p in FONTS:
  if Path(p).exists(): return ImageFont.truetype(p,n)
 return ImageFont.load_default()

def rgba(hexv,a=255):
 hexv=hexv.lstrip('#'); return tuple(int(hexv[i:i+2],16) for i in (0,2,4))+(a,)

def load_assets():
 raw=base64.b64decode(SPRITE.read_text(encoding='utf-8').strip())
 sheet=Image.open(io.BytesIO(raw)).convert('RGBA')
 out={k:sheet.crop(v) for k,v in BOXES.items()}
 for k in ('main','deer','turtle'):
  b=out[k].getchannel('A').getbbox()
  if b: out[k]=out[k].crop(b)
 return out

def mask_polygon(size,pts):
 m=Image.new('L',size,0); ImageDraw.Draw(m).polygon(pts,fill=255); return m

def part_layer(src:Image.Image,mask:Image.Image):
 a=ImageChops.multiply(src.getchannel('A'),mask)
 out=src.copy(); out.putalpha(a); return out

def rotate_part(layer:Image.Image,angle:float,pivot:Tuple[float,float]):
 return layer.rotate(angle,resample=Image.Resampling.BICUBIC,center=pivot,expand=False)

def rig_parts(src:Image.Image)->Dict[str,Image.Image]:
 # 所有遮罩都只切核准角色原圖，沒有重畫角色。
 w,h=src.size
 # 以比例定義，避免原圖尺寸未來小幅改變即失效。
 head=mask_polygon((w,h),[(.13*w,0),(.88*w,0),(.96*w,.40*h),(.75*w,.48*h),(.28*w,.46*h),(.03*w,.35*h)])
 larm=mask_polygon((w,h),[(0,.22*h),(.45*w,.25*h),(.48*w,.62*h),(.05*w,.61*h)])
 rarm=mask_polygon((w,h),[(.55*w,.27*h),(w,.25*h),(w,.70*h),(.52*w,.68*h)])
 legs=mask_polygon((w,h),[(.18*w,.66*h),(.82*w,.66*h),(.94*w,h),(.08*w,h)])
 alpha=src.getchannel('A')
 union=Image.new('L',(w,h),0)
 for m in (head,larm,rarm,legs): union=ImageChops.lighter(union,m)
 torso=ImageChops.subtract(alpha,ImageChops.multiply(alpha,union))
 return {'head':part_layer(src,head),'larm':part_layer(src,larm),'rarm':part_layer(src,rarm),'legs':part_layer(src,legs),'torso':part_layer(src,torso)}

def articulated(src, t, scene_key):
 parts=rig_parts(src); w,h=src.size
 walk=math.sin(t*5.4); breathe=math.sin(t*2.1)
 head_a=2.2*breathe; la=3.0*math.sin(t*3.5); ra=-2.5*math.sin(t*3.0+1); leg=1.2*walk
 if scene_key=='door': la=-10+13*math.sin(t*5.2); head_a=3*math.sin(t*2.4)
 elif scene_key=='table': la=10*math.sin(t*6.1); ra=-8*math.sin(t*6.1+1.2); head_a=1.5*breathe
 elif scene_key=='friends': head_a=4*math.sin(t*2.7); la=-5+5*math.sin(t*2.4)
 elif scene_key=='shelf': la=-14+8*math.sin(t*3.2); ra=-5; head_a=-2
 elif scene_key=='warm': ra=-10+6*math.sin(t*2.0); head_a=2*breathe
 elif scene_key=='rhythm': la=4*math.sin(t*2.1); ra=-4*math.sin(t*2.2)
 elif scene_key=='counter': head_a=2.8*math.sin(t*2.5); la=-2
 elif scene_key=='open': la=-13+14*math.sin(t*5.0); head_a=3*math.sin(t*2.6)
 layers=[]
 layers.append(rotate_part(parts['legs'],leg,(.5*w,.77*h)))
 layers.append(parts['torso'])
 layers.append(rotate_part(parts['larm'],la,(.34*w,.35*h)))
 layers.append(rotate_part(parts['rarm'],ra,(.68*w,.37*h)))
 layers.append(rotate_part(parts['head'],head_a,(.50*w,.29*h)))
 out=Image.new('RGBA',(w,h),(0,0,0,0))
 for x in layers: out.alpha_composite(x)
 return out

def fit(im,maxw,maxh):
 out=im.copy(); out.thumbnail((maxw,maxh),Image.Resampling.LANCZOS); return out

def shadow(base,im,x,y,blur=9):
 a=im.getchannel('A'); sh=Image.new('RGBA',im.size,(25,18,12,0)); sh.putalpha(a.filter(ImageFilter.GaussianBlur(blur)).point(lambda p:int(p*.26)))
 base.alpha_composite(sh,(x+5,y+10)); base.alpha_composite(im,(x,y))

def gradient(bg, top, bottom):
 d=ImageDraw.Draw(bg)
 ta=rgba(top); ba=rgba(bottom)
 for y in range(H):
  q=y/(H-1); col=tuple(int(ta[i]*(1-q)+ba[i]*q) for i in range(3))+(255,)
  d.line((0,y,W,y),fill=col)

def header(base, label):
 d=ImageDraw.Draw(base)
 d.rounded_rectangle((32,35,W-32,126),28,fill=rgba(NAVY,242))
 d.text((58,80),'仙加味',font=fnt(38),fill=WHITE,anchor='lm')
 d.text((W-58,80),'補養，是一種節奏。',font=fnt(19),fill='#E9D39B',anchor='rm')
 d.rounded_rectangle((42,150,250,204),22,fill='#F1E4D4')
 d.text((146,177),label,font=fnt(22),fill=RED,anchor='mm')

def shop_drawers(d,x0,y0,cols=4,rows=3,cellw=112,cellh=102):
 d.rounded_rectangle((x0-18,y0-18,x0+cols*cellw+18,y0+rows*cellh+18),26,fill='#684831')
 for r in range(rows):
  for c in range(cols):
   x=x0+c*cellw; y=y0+r*cellh
   d.rounded_rectangle((x,y,x+cellw-18,y+cellh-18),12,fill='#875D3C',outline='#B88956',width=3)
   d.ellipse((x+45,y+38,x+55,y+48),fill='#D3AC66')

def scene_bg(key,t):
 base=Image.new('RGBA',(W,H),CREAM); d=ImageDraw.Draw(base)
 if key in ('door','open'):
  gradient(base,'#F9E7C8','#DDBF91'); d=ImageDraw.Draw(base)
  d.rectangle((0,690,W,H),fill='#C4A278')
  d.rounded_rectangle((84,242,636,925),30,fill='#F5EEE0',outline='#9A744B',width=8)
  d.rectangle((122,302,598,900),fill='#3A2A23')
  d.rounded_rectangle((190,198,530,300),20,fill=NAVY,outline=GOLD,width=4)
  d.text((360,249),'仙加味',font=fnt(44),fill=WHITE,anchor='mm')
  d.ellipse((40,730,150,920),fill='#54684C'); d.ellipse((566,730,676,920),fill='#54684C')
  if key=='open':
   d.rounded_rectangle((250,770,470,870),18,fill='#F7F0DF',outline=GOLD,width=4)
   d.text((360,812),'OPEN',font=fnt(34),fill=GREEN,anchor='mm')
 else:
  gradient(base,'#F8F3EA','#E2CDB1'); d=ImageDraw.Draw(base)
  if key in ('table','friends'):
   shop_drawers(d,48,250,5,3,125,110)
   d.rectangle((0,830,W,H),fill='#7A5132'); d.rectangle((0,830,W,856),fill='#A4774E')
   if key=='table':
    xx=100+int(200*(.5+.5*math.sin(t*4.2))); d.rounded_rectangle((xx,875,xx+210,925),15,fill='#E6D9C7')
   else:
    d.rounded_rectangle((460,680,650,770),18,fill='#F4EAD8',outline=GOLD,width=3); d.text((555,725),'早安',font=fnt(30),fill=GREEN,anchor='mm')
  elif key=='shelf':
   d.rounded_rectangle((365,230,685,845),26,fill='#6C4931')
   for r in range(5):
    d.line((390,320+r*100,658,320+r*100),fill='#B88857',width=6)
    for c in range(3):
     x=405+c*82; y=260+r*100
     d.rounded_rectangle((x,y,x+55,y+70),8,fill='#EFE0C9',outline='#A47B52',width=2)
   d.rectangle((0,900,W,H),fill='#826040')
  elif key=='warm':
   d.rectangle((0,780,W,H),fill='#805A3A')
   d.rounded_rectangle((420,670,600,790),28,fill='#F6F0E8',outline='#BBA887',width=4)
   for i in range(3):
    sy=630-int(15*math.sin(t*3.0+i)); d.arc((455+i*28,sy-85,515+i*28,sy+25),190,350,fill=WHITE,width=5)
   d.ellipse((80,220,350,490),fill='#E8D5B4'); d.text((215,345),'溫熱日常',font=fnt(34),fill=NAVY,anchor='mm')
  elif key=='rhythm':
   shop_drawers(d,250,260,3,3,130,118)
   d.ellipse((80,300,290,510),fill='#F1E3C9',outline=GOLD,width=5)
   d.line((185,330,185,402),fill=NAVY,width=8); d.line((185,402,240,438),fill=NAVY,width=8)
   d.rectangle((0,850,W,H),fill='#775335')
  elif key=='counter':
   shop_drawers(d,45,220,5,3,126,105)
   d.rectangle((0,770,W,H),fill='#704B31'); d.rectangle((0,770,W,798),fill='#A5784F')
   d.rounded_rectangle((430,655,650,748),18,fill='#F6EEDC',outline=GOLD,width=3)
   d.text((540,688),'LINE OA',font=fnt(25),fill=NAVY,anchor='mm'); d.text((540,720),'@762jybnm',font=fnt(18),fill=GREEN,anchor='mm')
 header(base,next(s.label for s in SCENES if s.key==key))
 return base

def current_scene(t):
 for s in SCENES:
  if s.start<=t<s.end:return s
 return SCENES[-1]

def companions(base,deer,turtle,t,key):
 d=fit(deer,105,118); u=fit(turtle,112,105)
 if key=='friends':
  dx=int(60+360*min(1,max(0,(t-7.3)/3.6))); ux=int(650-270*min(1,max(0,(t-7.3)/3.6)))
 else: dx,ux=500,598
 dy=780-int(10*abs(math.sin(t*3.1))); uy=795-int(7*abs(math.sin(t*2.5+.7)))
 shadow(base,d,dx,dy,4); shadow(base,u,ux,uy,4)

def subtitle(base,text):
 d=ImageDraw.Draw(base); ft=fnt(32); maxw=590; lines=[]; cur=''
 for ch in text:
  z=cur+ch
  if d.textbbox((0,0),z,font=ft)[2]<=maxw:cur=z
  else:lines.append(cur);cur=ch
 if cur:lines.append(cur)
 lines=lines[:3]; bh=36+48*len(lines); y0=H-248-bh
 ov=Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov); od.rounded_rectangle((45,y0,W-45,y0+bh),24,fill=(16,34,55,225))
 y=y0+18
 for line in lines: od.text((W//2,y),line,font=ft,fill=WHITE,anchor='ma'); y+=48
 base.alpha_composite(ov)

def sub_at(t):
 for a,b,s in SUBS:
  if a<=t<b:return s
 return ''

def render_frame(t,assets,parts_src):
 s=current_scene(t); base=scene_bg(s.key,t)
 char=articulated(parts_src,t,s.key)
 # Character framing varies by scene while keeping full-body source.
 settings={
  'door':(120,360,375,600),'table':(70,390,360,640),'friends':(105,380,370,650),'shelf':(45,380,330,620),
  'warm':(115,380,370,650),'rhythm':(315,390,330,610),'counter':(82,365,370,650),'open':(118,355,390,670)}
 x,y,mw,mh=settings[s.key]; char=fit(char,mw,mh)
 if s.key=='door': x+=int(34*math.sin(t*1.2))
 if s.key=='table': x+=int(14*math.sin(t*3.8))
 if s.key=='shelf': y+=int(7*math.sin(t*2.0))
 if s.key=='open': x+=int(8*math.sin(t*2.8))
 shadow(base,char,x,y,11)
 companions(base,assets['deer'],assets['turtle'],t,s.key)
 subtitle(base,sub_at(t))
 ImageDraw.Draw(base).text((W//2,H-68),'仙加味｜補養，是一種節奏。',font=fnt(22),fill='#F4E7CF',anchor='mm')
 # Soft crossfade veil at each scene boundary.
 edge=min(t-s.start,s.end-t)
 if edge<0.18:
  a=int(110*(1-edge/0.18)); veil=Image.new('RGBA',(W,H),(247,244,237,a)); base.alpha_composite(veil)
 return base.convert('RGB')

def validate_copy():
 joined='\n'.join(x[2] for x in SUBS)
 for bad in FORBIDDEN:
  if bad in joined: raise SystemExit('blocked public term: '+bad)

def render(out):
 validate_copy(); assets=load_assets(); main=assets['main']; out.parent.mkdir(parents=True,exist_ok=True)
 cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
 p=subprocess.Popen(cmd,stdin=subprocess.PIPE); assert p.stdin
 for i in range(FRAMES):p.stdin.write(render_frame(i/FPS,assets,main).tobytes())
 p.stdin.close();rc=p.wait()
 if rc:raise SystemExit(f'ffmpeg failed {rc}')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out',default='artifacts/short2-opening-shop-v2.mp4');args=ap.parse_args();out=ROOT/args.out;render(out);print('PASS articulated technical preview; DO NOT AUTO-PUBLISH:',out)
if __name__=='__main__':main()
