#!/usr/bin/env python3
import os, math, subprocess, urllib.request
from pathlib import Path
import cv2
import numpy as np
from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.wan-second-work'
OUT = ROOT / 'public/videos'
WORK.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

CHARACTER_URL = os.environ['CHARACTER_URL']
CHAR = WORK / 'character.png'
urllib.request.urlretrieve(CHARACTER_URL, CHAR)

W, H, FPS = 360, 640, 24
BG = (238, 229, 214)
INK = (52, 63, 67)
TOP = (232, 222, 196)
APRON = (47, 76, 57)
SKIN = (239, 187, 145)
RED = (51, 48, 184)
WOOD = (78, 111, 139)

def pxy(x, y): return int(x*W), int(y*H)

def limb(img, a, b, color, thick=22):
    a=pxy(*a); b=pxy(*b)
    cv2.line(img, a, b, color, thick, cv2.LINE_AA)
    cv2.circle(img, a, thick//2, color, -1, cv2.LINE_AA)
    cv2.circle(img, b, thick//2, color, -1, cv2.LINE_AA)

def person(img, cx, cy, scale, arm_l, arm_r, leg_l, leg_r, squat=0.0, turn=0.0):
    # human-like cartoon mannequin used ONLY as motion driver
    head=(cx+0.02*turn, cy-0.22*scale+0.05*squat)
    neck=(cx, cy-0.10*scale+0.05*squat)
    hip=(cx, cy+0.17*scale+0.10*squat)
    sh_l=(cx-0.10*scale, cy-0.08*scale+0.05*squat)
    sh_r=(cx+0.10*scale, cy-0.08*scale+0.05*squat)
    # legs first
    limb(img, hip, leg_l[0], APRON, int(25*scale))
    limb(img, leg_l[0], leg_l[1], INK, int(22*scale))
    limb(img, hip, leg_r[0], APRON, int(25*scale))
    limb(img, leg_r[0], leg_r[1], INK, int(22*scale))
    # torso
    x1,y1=pxy(cx-0.13*scale, cy-0.10*scale+0.05*squat)
    x2,y2=pxy(cx+0.13*scale, cy+0.18*scale+0.10*squat)
    cv2.ellipse(img, ((x1+x2)//2,(y1+y2)//2), ((x2-x1)//2,(y2-y1)//2), 0,0,360, TOP,-1,cv2.LINE_AA)
    ax1,ay1=pxy(cx-0.11*scale,cy-0.02*scale+0.05*squat)
    ax2,ay2=pxy(cx+0.11*scale,cy+0.18*scale+0.10*squat)
    cv2.rectangle(img,(ax1,ay1),(ax2,ay2),APRON,-1)
    # red vertical chest mark (shape only; final video prompt preserves real mark)
    rx1,ry1=pxy(cx-0.025*scale,cy+0.015*scale+0.05*squat)
    rx2,ry2=pxy(cx+0.025*scale,cy+0.11*scale+0.05*squat)
    cv2.rectangle(img,(rx1,ry1),(rx2,ry2),RED,-1)
    # arms
    limb(img, sh_l, arm_l[0], TOP, int(20*scale)); limb(img, arm_l[0], arm_l[1], SKIN, int(17*scale))
    limb(img, sh_r, arm_r[0], TOP, int(20*scale)); limb(img, arm_r[0], arm_r[1], SKIN, int(17*scale))
    # neck/head/hair
    cv2.circle(img, pxy(*neck), int(22*scale), SKIN,-1,cv2.LINE_AA)
    cv2.circle(img, pxy(*head), int(58*scale), SKIN,-1,cv2.LINE_AA)
    hx,hy=pxy(*head)
    cv2.ellipse(img,(hx,hy-int(20*scale)),(int(60*scale),int(42*scale)),0,180,360,INK,-1,cv2.LINE_AA)
    # face cues
    off=int(18*scale)
    cv2.circle(img,(hx-off,hy-int(4*scale)),int(7*scale),(20,20,20),-1)
    cv2.circle(img,(hx+off,hy-int(4*scale)),int(7*scale),(20,20,20),-1)
    cv2.ellipse(img,(hx,hy+int(18*scale)),(int(14*scale),int(7*scale)),0,0,180,(80,60,50),2)

def base_scene(kind):
    img=np.full((H,W,3),BG,np.uint8)
    # floor
    cv2.rectangle(img,(0,int(H*0.78)),(W,H),(164,125,85),-1)
    # simple environment cues for motion source only
    if kind=='door':
        cv2.rectangle(img,(int(W*0.73),int(H*0.08)),(int(W*0.98),int(H*0.78)),WOOD,10)
        cv2.line(img,(int(W*0.76),int(H*0.10)),(int(W*0.76),int(H*0.76)),WOOD,8)
    if kind in ('wipe','basket'):
        cv2.rectangle(img,(int(W*0.48),int(H*0.57)),(int(W*0.96),int(H*0.64)),WOOD,-1)
        cv2.rectangle(img,(int(W*0.52),int(H*0.64)),(int(W*0.57),int(H*0.88)),WOOD,-1)
        cv2.rectangle(img,(int(W*0.88),int(H*0.64)),(int(W*0.93),int(H*0.88)),WOOD,-1)
    return img

def write_clip(name, kind, posefn, seconds=4.0):
    path=WORK/f'{name}.mp4'
    vw=cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*'mp4v'), FPS, (W,H))
    for i in range(int(seconds*FPS)):
        t=i/(seconds*FPS-1)
        img=base_scene(kind)
        args=posefn(t)
        person(img, **args)
        vw.write(img)
    vw.release()
    return path

def standing(cx=.43,cy=.48):
    return dict(cx=cx,cy=cy,scale=1.0,
      arm_l=(((cx-.15),cy+.02),((cx-.18),cy+.14)),
      arm_r=(((cx+.15),cy+.02),((cx+.18),cy+.14)),
      leg_l=(((cx-.08),cy+.30),((cx-.09),cy+.46)),
      leg_r=(((cx+.08),cy+.30),((cx+.09),cy+.46)),squat=0,turn=0)

def pose_door(t):
    d=standing(.42,.47)
    reach=min(1,t*2.2)
    pull=max(0,min(1,(t-.40)*2.8))
    handx=.73-.18*pull
    d['arm_r']=((.55,.40), (handx,.35))
    d['arm_l']=((.31,.48),(.27,.60))
    d['cx']=.42-.05*pull; d['turn']=.35*reach
    return d

def pose_squat(t):
    d=standing(.48,.46)
    q=math.sin(min(1,t/.65)*math.pi/2)
    if t>.70: q=max(.75,1-(t-.70)*.6)
    d['squat']=.60*q
    d['cy']=.46+.07*q
    d['arm_r']=((.60,.52+.10*q),(.67,.66+.08*q))
    d['arm_l']=((.39,.53+.10*q),(.32,.67+.08*q))
    d['leg_l']=((.40,.69+.05*q),(.34,.83))
    d['leg_r']=((.56,.69+.05*q),(.63,.83))
    return d

def pose_wipe(t):
    d=standing(.38,.46)
    x=.58+.20*math.sin(t*math.pi*3)
    d['arm_r']=((.52,.50),(x,.58))
    d['arm_l']=((.28,.50),(.25,.62))
    d['turn']=.25
    return d

def pose_walk(t):
    cx=.34+.28*t
    d=standing(cx,.46)
    phase=math.sin(t*math.pi*5)
    d['arm_l']=((cx-.14,.48),(cx-.18-.03*phase,.60))
    d['arm_r']=((cx+.14,.48),(cx+.18+.03*phase,.60))
    d['leg_l']=((cx-.07,.70),(cx-.10-.04*phase,.88))
    d['leg_r']=((cx+.07,.70),(cx+.10+.04*phase,.88))
    d['turn']=.45*t
    return d

clips=[
 ('01_open_door','door',pose_door,'the same cute young Taiwanese herbal-shop boy opens a wooden shop door in warm morning light, full body, premium soft 3D chibi animation, cream Chinese-style shirt, dark olive green apron, red vertical Xian Jia Wei seal, no products, no text, natural child body mechanics'),
 ('02_crouch_help','basket',pose_squat,'the same cute young Taiwanese herbal-shop boy crouches naturally to pick up a small folded cleaning cloth beside a wicker basket, warm premium herbal shop, full body soft 3D chibi animation, no products, no text'),
 ('03_wipe_table','wipe',pose_wipe,'the same cute young Taiwanese herbal-shop boy stands and wipes a wooden table from side to side with a small cloth, warm morning herbal shop, full body soft 3D chibi animation, no products, no text, natural movement'),
 ('04_walk_inside','none',pose_walk,'the same cute young Taiwanese herbal-shop boy finishes preparing the shop, turns and walks deeper into the warm wooden herbal shop, full body soft 3D chibi animation, morning light, no products, no text, natural walking')]

client=Client('hugging-apps/wan2-2-animate-2-14b', verbose=True)
neg='blurry, deformed, extra limbs, extra fingers, duplicate person, fused body, text, watermark, product package, bottle, box, pouch, low quality'
results=[]
for idx,(name,kind,pose,prompt) in enumerate(clips):
    drv=write_clip(name+'_driver',kind,pose,4.0)
    print('GENERATE',name,flush=True)
    result=client.predict(handle_file(str(CHAR)),handle_file(str(drv)),prompt,4.0,560,320,6,1.0,5.0,neg,100+idx,api_name='/animate')
    src=Path(result)
    dst=OUT/f'second-wan-{name}.mp4'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-r','24','-c:v','libx264','-preset','veryfast','-crf','20','-an',str(dst)],check=True)
    results.append(dst)
print('DONE',*[str(x) for x in results],sep='\n',flush=True)
