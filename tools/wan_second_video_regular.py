#!/usr/bin/env python3
import html, json, math, os, re, subprocess, time, urllib.request
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
    head=(cx+.02*turn,cy-.22+.05*squat); neck=(cx,cy-.10+.05*squat); hip=(cx,cy+.17+.10*squat)
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
 ('01_open_door','door',door),('02_crouch_help','basket',crouch),('03_wipe_table','wipe',wipe),('04_walk_inside','none',walk)]

def extract_video_url(text):
    if text is None:return None
    s=html.unescape(str(text)).replace('\\/','/')
    urls=re.findall(r'https?://[^\s\"\'<>]+',s)
    for u in urls:
        clean=u.rstrip(').,;')
        if '.mp4' in clean.lower() or '.webm' in clean.lower(): return clean
    # Some UIs expose href paths via /file= or proxy URLs
    m=re.search(r'(?:href|src)=[\"\']([^\"\']+(?:\.mp4|\.webm)[^\"\']*)',s,re.I)
    if m:
        u=m.group(1)
        if u.startswith('http'):return u
    return None

def download(url,name):
    src=WORK/f'{name}-raw.mp4'; print('DOWNLOAD',url,flush=True); urllib.request.urlretrieve(url,src)
    dst=OUT/f'second-wan-{name}.mp4'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-r','24','-c:v','libx264','-preset','veryfast','-crf','20','-an',str(dst)],check=True)
    print('SAVED',dst,flush=True); return dst

def refresh_until_video(c,name,timeout=900):
    deadline=time.time()+timeout; seen=''
    while time.time()<deadline:
        for ep in ('/refresh_jobs','/refresh_jobs_1'):
            try:
                r=c.predict(api_name=ep); txt=str(r)
                if txt!=seen:
                    print('REFRESH',name,ep,txt[:5000],flush=True); seen=txt
                url=extract_video_url(txt)
                if url:return url
                low=txt.lower()
                if any(x in low for x in ('failed','error','hata','başarısız')) and not any(x in low for x in ('no error','0 error')):
                    # keep the other refresh endpoint a chance; fail after one cycle if both report errors
                    pass
            except Exception as e: print('REFRESH_ERR',name,ep,repr(e),flush=True)
        time.sleep(5)
    raise TimeoutError(f'No completed video URL for {name}')

def submit_neop3(c,name,drv):
    print('SUBMIT_JOB',name,flush=True)
    r=c.predict(handle_file(str(CHAR)),handle_file(str(drv)),'wan2.2-animate-move','wan-std',api_name='/submit_job')
    print('SUBMIT_RESULT',name,repr(r)[:7000],flush=True)
    direct=extract_video_url(r)
    if direct:return direct
    return refresh_until_video(c,name)

# Dedicated free async Space: this is a real queue, not the broken /predict clones.
space='neop3/Wan2.2-Animate-free'
print('CONNECT',space,flush=True)
c=Client(space,verbose=True)
try:
    print('API_DOC',json.dumps(c.view_api(print_info=False,return_format='dict'),ensure_ascii=False,default=str)[:15000],flush=True)
except Exception as e: print('API_DOC_ERR',repr(e),flush=True)

for name,kind,fn in CLIPS:
    drv=driver(name,kind,fn)
    url=submit_neop3(c,name,drv)
    download(url,name)
print('DONE_ALL',space,flush=True)
