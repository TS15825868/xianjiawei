#!/usr/bin/env python3
import json, math, os, shutil, subprocess, time, urllib.request
from pathlib import Path
import cv2
import numpy as np
from gradio_client import Client, handle_file

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'.wan-second-work-regular'; OUT=ROOT/'public/videos'
WORK.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
CHAR=WORK/'character.png'; urllib.request.urlretrieve(os.environ['CHARACTER_URL'],CHAR)
W,H,FPS=360,640,24
BG=(238,229,214); INK=(52,63,67); TOP=(232,222,196); APRON=(47,76,57); SKIN=(239,187,145); RED=(51,48,184); WOOD=(78,111,139)

def p(x,y): return int(x*W),int(y*H)
def limb(im,a,b,c,t=20):
    a=p(*a); b=p(*b); cv2.line(im,a,b,c,t,cv2.LINE_AA); cv2.circle(im,a,t//2,c,-1,cv2.LINE_AA); cv2.circle(im,b,t//2,c,-1,cv2.LINE_AA)
def human(im,cx,cy,al,ar,ll,lr,squat=0,turn=0):
    scale=1.0; head=(cx+.02*turn,cy-.22+.05*squat); neck=(cx,cy-.10+.05*squat); hip=(cx,cy+.17+.10*squat)
    sl=(cx-.10,cy-.08+.05*squat); sr=(cx+.10,cy-.08+.05*squat)
    limb(im,hip,ll[0],APRON,25); limb(im,ll[0],ll[1],INK,22); limb(im,hip,lr[0],APRON,25); limb(im,lr[0],lr[1],INK,22)
    cv2.ellipse(im,p(cx,cy+.04+.075*squat),(47,90),0,0,360,TOP,-1,cv2.LINE_AA); cv2.rectangle(im,p(cx-.11,cy-.02+.05*squat),p(cx+.11,cy+.18+.10*squat),APRON,-1)
    cv2.rectangle(im,p(cx-.025,cy+.015+.05*squat),p(cx+.025,cy+.11+.05*squat),RED,-1)
    limb(im,sl,al[0],TOP,20); limb(im,al[0],al[1],SKIN,17); limb(im,sr,ar[0],TOP,20); limb(im,ar[0],ar[1],SKIN,17)
    cv2.circle(im,p(*neck),22,SKIN,-1,cv2.LINE_AA); hx,hy=p(*head); cv2.circle(im,(hx,hy),58,SKIN,-1,cv2.LINE_AA); cv2.ellipse(im,(hx,hy-20),(61,44),0,180,360,INK,-1,cv2.LINE_AA)
    cv2.circle(im,(hx-18,hy-4),7,(15,15,15),-1); cv2.circle(im,(hx+18,hy-4),7,(15,15,15),-1); cv2.ellipse(im,(hx,hy+18),(14,7),0,0,180,(70,50,40),2)
def scene(kind):
    im=np.full((H,W,3),BG,np.uint8); cv2.rectangle(im,(0,int(.78*H)),(W,H),(164,125,85),-1)
    if kind=='door': cv2.rectangle(im,p(.73,.08),p(.98,.78),WOOD,10); cv2.line(im,p(.76,.1),p(.76,.76),WOOD,8)
    if kind in ('basket','wipe'):
        cv2.rectangle(im,p(.48,.57),p(.96,.64),WOOD,-1); cv2.rectangle(im,p(.52,.64),p(.57,.88),WOOD,-1); cv2.rectangle(im,p(.88,.64),p(.93,.88),WOOD,-1)
    return im
def stand(cx=.43,cy=.48):
    return dict(cx=cx,cy=cy,al=((cx-.15,cy+.02),(cx-.18,cy+.14)),ar=((cx+.15,cy+.02),(cx+.18,cy+.14)),ll=((cx-.08,cy+.30),(cx-.09,cy+.46)),lr=((cx+.08,cy+.30),(cx+.09,cy+.46)),squat=0,turn=0)
def door(t):
    d=stand(.42,.47); pull=max(0,min(1,(t-.35)*2.5)); d['ar']=((.55,.40),(.73-.19*pull,.35)); d['al']=((.31,.48),(.27,.60)); d['cx']=.42-.05*pull; d['turn']=.35*min(1,t*2); return d
def crouch(t):
    d=stand(.48,.46); q=math.sin(min(1,t/.7)*math.pi/2); d['squat']=.55*q; d['cy']=.46+.07*q; d['ar']=((.60,.52+.10*q),(.67,.66+.08*q)); d['al']=((.39,.53+.10*q),(.32,.67+.08*q)); d['ll']=((.40,.69+.05*q),(.34,.83)); d['lr']=((.56,.69+.05*q),(.63,.83)); return d
def wipe(t):
    d=stand(.38,.46); x=.58+.20*math.sin(t*math.pi*3); d['ar']=((.52,.50),(x,.58)); d['al']=((.28,.50),(.25,.62)); d['turn']=.25; return d
def walk(t):
    cx=.34+.28*t; d=stand(cx,.46); ph=math.sin(t*math.pi*5); d['al']=((cx-.14,.48),(cx-.18-.03*ph,.60)); d['ar']=((cx+.14,.48),(cx+.18+.03*ph,.60)); d['ll']=((cx-.07,.70),(cx-.10-.04*ph,.88)); d['lr']=((cx+.07,.70),(cx+.10+.04*ph,.88)); d['turn']=.45*t; return d
def driver(name,kind,fn,sec=4):
    path=WORK/f'{name}-driver.mp4'; vw=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),FPS,(W,H)); n=int(sec*FPS)
    for i in range(n):
        im=scene(kind); human(im,**fn(i/(n-1))); vw.write(im)
    vw.release(); return path

CLIPS=[
 ('01_open_door','door',door,'Same established cute young Taiwanese herbal-shop boy opens a wooden shop door with both hands and turns naturally toward the morning light. Preserve identical face, short black hair, cream Chinese shirt, dark olive apron, red vertical Xian Jia Wei seal. Premium soft 3D chibi, full body, no products, no bottles, no boxes, no pouches, no text.'),
 ('02_crouch_help','basket',crouch,'Same established boy crouches naturally to receive a small folded cleaning cloth beside a wicker basket, then helps push the basket toward a wooden table. Premium soft 3D chibi, full body, no products, no text, natural child body mechanics.'),
 ('03_wipe_table','wipe',wipe,'Same established boy stands and wipes one corner of a wooden table left to right with a small cloth, then places a wicker basket neatly beside it. Warm morning herbal shop, premium soft 3D chibi, no products, no text.'),
 ('04_walk_inside','none',walk,'Same established boy naturally turns and walks deeper into the prepared herbal shop in warm morning light. Full body walking with real weight shift, premium soft 3D chibi, no products, no text, no waving, no writing, no drinking.')]

CANDIDATES=[
 'tddandroid/Wan2.2-Animate',
 'AZGD0/Wan2.2-Animate',
 'Hydra324/Wan2.2-Animate',
 'xinxin-1/Wan2.2-Animate',
 'neop3/Wan2.2-Animate-free',
 'Ejiro2424/Wan2.2-Animate-Demo']

def video_path(obj):
    if obj is None:return None
    if isinstance(obj,(list,tuple)):
        for x in obj:
            r=video_path(x)
            if r:return r
    if isinstance(obj,dict):
        for k in ('path','url','video','value','name'):
            if k in obj:
                r=video_path(obj[k])
                if r:return r
        for x in obj.values():
            r=video_path(x)
            if r:return r
    if isinstance(obj,str):
        s=obj.strip()
        if s.startswith('http://') or s.startswith('https://'):
            if any(z in s.lower() for z in ('.mp4','.webm','video')):
                dst=WORK/f'download-{int(time.time()*1000)}.mp4'; urllib.request.urlretrieve(s,dst); return dst
        pp=Path(s)
        if pp.exists() and pp.is_file(): return pp
    return None

def call_space(space,char,drv):
    print('TRY_SPACE',space,flush=True)
    c=Client(space,verbose=True)
    try:
        api=c.view_api(print_info=False,return_format='dict')
        print('API_DOC',space,json.dumps(api,ensure_ascii=False,default=str)[:12000],flush=True)
    except Exception as e: print('API_DOC_ERR',space,repr(e),flush=True)
    attempts=[
      ('/predict',(handle_file(str(char)),handle_file(str(drv)),'wan2.2-animate-move','wan-std')),
      (None,(handle_file(str(char)),handle_file(str(drv)),'wan2.2-animate-move','wan-std')),
      ('/animate',(handle_file(str(char)),handle_file(str(drv))))]
    errs=[]
    for ep,args in attempts:
        try:
            print('CALL',space,ep,len(args),flush=True)
            res=c.predict(*args,**({'api_name':ep} if ep else {}))
            print('RESULT',space,ep,repr(res)[:4000],flush=True)
            vp=video_path(res)
            if vp:return c,ep,vp
        except Exception as e:
            errs.append(f'{ep}:{type(e).__name__}:{e}')
            print('CALL_ERR',space,ep,repr(e),flush=True)
    raise RuntimeError(' | '.join(errs))

def call_same(c,ep,char,drv):
    # endpoint signature chosen from successful probe
    if ep=='/predict' or ep is None:
        args=(handle_file(str(char)),handle_file(str(drv)),'wan2.2-animate-move','wan-std')
    else: args=(handle_file(str(char)),handle_file(str(drv)))
    res=c.predict(*args,**({'api_name':ep} if ep else {})); vp=video_path(res)
    if not vp: raise RuntimeError(f'No video file in result {res!r}')
    return vp

def save(src,name):
    dst=OUT/f'second-wan-{name}.mp4'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-r','24','-c:v','libx264','-preset','veryfast','-crf','20','-an',str(dst)],check=True)
    print('SAVED',dst,flush=True); return dst

first=driver(CLIPS[0][0],CLIPS[0][1],CLIPS[0][2])
selected=None
for space in CANDIDATES:
    try:
        c,ep,vp=call_space(space,CHAR,first); save(vp,CLIPS[0][0]); selected=(space,c,ep); print('SELECTED_SPACE',space,ep,flush=True); break
    except Exception as e: print('SPACE_FAILED',space,repr(e),flush=True)
if not selected: raise SystemExit('No non-Zero Wan Animate space succeeded')
space,c,ep=selected
for name,kind,fn,prompt in CLIPS[1:]:
    drv=driver(name,kind,fn); print('GENERATE',name,'USING',space,flush=True); vp=call_same(c,ep,CHAR,drv); save(vp,name)
print('DONE_ALL',space,flush=True)
