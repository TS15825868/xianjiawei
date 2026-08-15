#!/usr/bin/env python3
import base64, io, json, math, os, random, re, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'images/posts/rebuild-v20260816'
OUT.mkdir(parents=True,exist_ok=True)
W,H=1080,1350
CREAM='#F7F4ED'; NAVY='#1E3A5F'; GREEN='#2F4F3A'; RED='#B61D1D'; GOLD='#D4AF37'; INK='#253247'; SOFT='#EEE6D8'; WHITE='#FFFDFC'
MANIFEST_URL='https://raw.githubusercontent.com/TS15825868/xianjiawei-internal/main/audits/full-rebuild-manifest-current.json'
SPRITE_B64=(ROOT/'assets/reference/mascot-sprite-v20260816.txt').read_text(encoding='utf-8').strip()
SPRITE=Image.open(io.BytesIO(base64.b64decode(SPRITE_B64))).convert('RGBA')
SPRITE_BOXES={
 'main':(8,35,8+188,35+390),
 'wave':(235,25,235+150,25+145),
 'tray':(405,25,405+175,25+150),
 'thumb':(245,215,245+150,215+133),
 'deer':(430,235,430+71,235+80),
 'turtle':(530,235,530+80,235+77),
}
POSES={k:SPRITE.crop(v) for k,v in SPRITE_BOXES.items()}

FONT_SERIF='/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'
FONT_SANS='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_SANS_B='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'

def font(path,size):
    return ImageFont.truetype(path,size)

def wrap_text(draw,text,fnt,maxw,max_lines=3):
    text=str(text or '').strip()
    if not text:return []
    lines=[]; cur=''
    for ch in text:
        test=cur+ch
        if draw.textbbox((0,0),test,font=fnt)[2] <= maxw:
            cur=test
        else:
            if cur: lines.append(cur)
            cur=ch
            if len(lines)>=max_lines: break
    if cur and len(lines)<max_lines: lines.append(cur)
    if len(''.join(lines)) < len(text) and lines:
        while draw.textbbox((0,0),lines[-1]+'…',font=fnt)[2]>maxw and lines[-1]: lines[-1]=lines[-1][:-1]
        lines[-1]+='…'
    return lines

def rounded(draw,box,r,fill,outline=None,width=1): draw.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=width)

def shadow_paste(base,im,xy,shadow=18,offset=(0,10),opacity=80):
    im=im.convert('RGBA')
    sh=Image.new('RGBA',im.size,(0,0,0,0)); alpha=im.getchannel('A').filter(ImageFilter.GaussianBlur(shadow))
    sh.putalpha(alpha.point(lambda p:p*opacity//255))
    dark=Image.new('RGBA',im.size,(20,20,20,0)); dark.putalpha(sh.getchannel('A'))
    base.alpha_composite(dark,(xy[0]+offset[0],xy[1]+offset[1]))
    base.alpha_composite(im,xy)

def fit_rgba(im,maxw,maxh):
    im=im.copy(); im.thumbnail((maxw,maxh),Image.Resampling.LANCZOS); return im

def flood_cutout(img_rgb,box,tol=52,keep=1,feather=1.0):
    x1,y1,x2,y2=box; crop=img_rgb[y1:y2,x1:x2].copy(); h,w=crop.shape[:2]
    border=np.concatenate([crop[:12].reshape(-1,3),crop[-12:].reshape(-1,3),crop[:,:12].reshape(-1,3),crop[:,-12:].reshape(-1,3)])
    bmax=border.max(axis=1); bmin=border.min(axis=1); samples=border[(bmax>180)&((bmax-bmin)<80)]
    bg=np.median(samples if len(samples)>100 else border,axis=0)
    dist=np.linalg.norm(crop.astype(np.float32)-bg[None,None,:],axis=2)
    bgcand=((dist<tol)&(crop.mean(axis=2)>130)).astype(np.uint8)
    bgcand|=((crop.min(axis=2)>225)&((crop.max(axis=2)-crop.min(axis=2))<35)).astype(np.uint8)
    ff=np.zeros((h,w),np.uint8); from collections import deque; q=deque()
    for x in range(w):
        if bgcand[0,x]:ff[0,x]=1;q.append((0,x))
        if bgcand[h-1,x] and not ff[h-1,x]:ff[h-1,x]=1;q.append((h-1,x))
    for y in range(h):
        if bgcand[y,0] and not ff[y,0]:ff[y,0]=1;q.append((y,0))
        if bgcand[y,w-1] and not ff[y,w-1]:ff[y,w-1]=1;q.append((y,w-1))
    while q:
        y,x=q.popleft()
        for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=yy<h and 0<=xx<w and bgcand[yy,xx] and not ff[yy,xx]:ff[yy,xx]=1;q.append((yy,xx))
    fg=(1-ff).astype(np.uint8); fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((3,3),np.uint8),iterations=1); fg=cv2.morphologyEx(fg,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8),iterations=2)
    num,lab,stats,_=cv2.connectedComponentsWithStats(fg,8); comps=sorted([(stats[i,cv2.CC_STAT_AREA],i) for i in range(1,num)],reverse=True)[:keep]
    mask=np.zeros_like(fg)
    for _,i in comps:mask[lab==i]=255
    if feather:mask=cv2.GaussianBlur(mask,(0,0),feather)
    return Image.fromarray(np.dstack([crop,mask]))

def product_cutouts():
    base=ROOT/'images/products-v3'
    specs={
      'drink30':('guilu-drink-30.jpg',(245,690,555,1080),50,1),
      'drink180':('guilu-drink-180.jpg',(250,320,850,1170),50,1),
      'gao':('guilu-gao.jpg',(240,360,890,940),52,2),
      'jiao':('guilu-jiao.jpg',(120,320,1000,1000),55,2),
      'tangkuai':('guilu-tangkuai.jpg',(150,320,1000,960),55,2),
      'luerong':('luerong-fen.jpg',(260,350,850,940),55,1),
    }
    out={}
    for k,(fn,box,tol,keep) in specs.items():
        arr=np.array(Image.open(base/fn).convert('RGB')); out[k]=flood_cutout(arr,box,tol,keep)
    return out
PRODS=product_cutouts()

SCENE_ACCENTS={
 'work_break':('#E7EFE8','#CADBCB'),'wanhua_street':('#F3E4D2','#D6B38A'),'heritage_workbench':('#EFE1D2','#C69A6A'),'craft_simmer':('#E9E0D0','#B98A5B'),
 'hot_outdoor':('#F7E9C7','#E6C56F'),'rainy_window':('#E2EBF3','#9CB6C8'),'temperature_outdoor':('#EEE6D8','#B6A37D'),'four_seasons':('#F3EAD7','#B7C9A8'),
 'storage_shelf':('#EEF0E6','#BAC6AA'),'storage_general':('#EEF0E6','#BAC6AA'),'trial_table':('#F5E7E1','#D7A79B'),'line_consult':('#E4EEE9','#9CBFAA'),
 'outdoor_bag':('#E8EFE2','#A8C290'),'home_cooking':('#F0E5D7','#C89D72'),'warm_drink':('#F5E8D7','#D6A86D'),'made_to_order':('#EEE8DE','#BCA58A'),
 'package_detail':('#F1E9DD','#CDB89D'),'ingredient_info':('#E8E9D8','#A9AD78'),'compare_choose':('#ECE7DC','#B7A58A'),'family_table':('#F0E4D6','#C6956C'),
 'brand_culture':('#E9E5D6','#A7A176'),'home_drink':('#EEE7DE','#C0A68A'),'small_jar_daily':('#E9EEE8','#A6B9A4'),'gao_daily':('#F1E3D9','#C99A7C'),
 'jiao_daily':('#ECE8EE','#B4A7BA'),'luerong_daily':('#ECE8DB','#B6A57A'),'tangkuai_daily':('#E5E9ED','#9DACBD'),'daily_life':('#EEE9DE','#C4B596')}

def draw_scene(draw,scene,rng,y0=440):
    a,b=SCENE_ACCENTS.get(scene,SCENE_ACCENTS['daily_life'])
    rounded(draw,(38,y0,1042,1280),42,WHITE,outline='#E2D8C9',width=3)
    draw.rectangle((55,y0+18,1025,1260),fill=a)
    # softly varied large shapes
    for i in range(5):
        x=rng.randint(80,940); y=rng.randint(y0+80,1180); r=rng.randint(28,70); draw.ellipse((x-r,y-r,x+r,y+r),fill=b)
    if scene=='work_break':
        draw.rectangle((610,780,960,1000),fill='#D8C2A2'); draw.rectangle((665,650,900,790),fill='#D6DBE2'); draw.rectangle((690,675,875,760),fill='#EEF3F5'); draw.rectangle((790,1000,820,1130),fill='#9A7A5A');
    elif scene=='wanhua_street':
        for x in (90,335,790):draw.rectangle((x,y0+150,x+200,1040),fill='#C98565');
        for x in (190,540,900):draw.ellipse((x,y0+95,x+80,y0+175),fill='#B61D1D'); draw.line((x+40,y0+40,x+40,y0+95),fill=GOLD,width=5)
        draw.polygon([(55,1120),(1025,1120),(930,1260),(140,1260)],fill='#D8C7B4')
    elif scene in ('heritage_workbench','ingredient_info'):
        draw.rectangle((620,y0+140,980,980),fill='#7B5A3A');
        for yy in (y0+240,y0+390,y0+540):draw.rectangle((645,yy,955,yy+20),fill='#B78C61')
        for x in (670,770,870):draw.rounded_rectangle((x,y0+180,x+55,y0+260),10,fill='#D9C8A6')
        draw.rectangle((530,1030,980,1160),fill='#A77A50')
    elif scene in ('craft_simmer','home_cooking'):
        draw.ellipse((650,820,980,1080),fill='#8F6A4A'); draw.rectangle((700,790,930,860),fill='#AA8767');
        for dx in (0,55,110):draw.arc((750+dx,650,850+dx,820),180,350,fill='#FFFFFF',width=7)
        draw.rectangle((590,1080,980,1160),fill='#A77A50')
    elif scene=='hot_outdoor':
        draw.ellipse((825,y0+80,945,y0+200),fill='#E5B94D'); draw.rectangle((80,930,1000,1140),fill='#C9D7A9');
        for x in (130,330,820):draw.rectangle((x,690,x+30,980),fill='#8B6C4F'); draw.ellipse((x-75,610,x+110,760),fill='#6F8E5D')
    elif scene=='rainy_window':
        draw.rounded_rectangle((610,y0+120,970,880),30,fill='#CAD9E5',outline='#7A94A8',width=8)
        for x in range(650,950,70): draw.line((x,y0+150,x-25,y0+260),fill='#FFFFFF',width=6)
        draw.arc((690,920,900,1080),180,360,fill=NAVY,width=12); draw.line((795,1000,795,1110),fill=NAVY,width=10)
    elif scene=='temperature_outdoor':
        draw.ellipse((800,y0+90,900,y0+190),fill='#E5B94D'); draw.ellipse((680,y0+120,820,y0+200),fill='#D7E0E8'); draw.rectangle((760,850,800,1110),fill='#9C826A'); draw.arc((680,820,880,980),180,360,fill=GREEN,width=18)
    elif scene=='four_seasons':
        cols=['#A7C68A','#E4C65B','#C98455','#A9BAC9'];
        for i,c in enumerate(cols):draw.ellipse((600+i%2*190,650+i//2*220,760+i%2*190,810+i//2*220),fill=c)
    elif scene in ('storage_shelf','storage_general'):
        draw.rectangle((620,650,980,1100),fill='#D7D4C7');
        for yy in (760,900,1040):draw.rectangle((640,yy,960,yy+18),fill='#A99E8B')
        for x in (670,770,870):draw.rounded_rectangle((x,690,x+55,755),8,fill='#F6F2E9')
    elif scene=='trial_table':
        draw.rectangle((560,1020,980,1145),fill='#A87952'); draw.rectangle((730,740,940,930),fill='#C39B73'); draw.line((835,740,835,930),fill='#9D7756',width=5)
    elif scene=='line_consult':
        draw.rounded_rectangle((650,680,970,1040),35,fill='#FFFFFF',outline='#A8C8B5',width=6); draw.rounded_rectangle((700,760,890,830),25,fill='#DDEDE4'); draw.rounded_rectangle((740,860,940,930),25,fill='#F3E7DA')
    elif scene=='outdoor_bag':
        draw.ellipse((760,620,930,790),fill='#7C9B66'); draw.rectangle((835,760,860,1040),fill='#8A6B4C'); draw.rounded_rectangle((650,930,930,1160),30,fill='#E5D9C4',outline=NAVY,width=8)
    elif scene=='warm_drink':
        draw.ellipse((650,880,940,1040),fill='#C79E72'); draw.rounded_rectangle((720,790,870,930),24,fill='#F4EEE4',outline='#BDA88E',width=5)
        for dx in (0,45):draw.arc((730+dx,650,830+dx,820),180,355,fill='#FFFFFF',width=7)
    elif scene=='made_to_order':
        draw.rounded_rectangle((650,720,920,920),20,fill='#D1B390'); draw.line((785,720,785,920),fill='#A27C56',width=6); draw.rectangle((680,960,930,1120),fill='#F5F1EA');
        for i in range(4):draw.ellipse((710+i*50,1000,730+i*50,1020),fill=RED)
    elif scene=='package_detail':
        draw.rectangle((650,710,930,1040),fill='#EEE2D2'); draw.line((610,730,610,1020),fill=GOLD,width=5); draw.line((590,730,630,730),fill=GOLD,width=5); draw.line((590,1020,630,1020),fill=GOLD,width=5)
    elif scene=='compare_choose':
        draw.line((760,650,760,1120),fill='#C9B9A3',width=6); draw.polygon([(620,820),(700,760),(700,800),(820,800),(820,840),(700,840),(700,880)],fill=GREEN)
    elif scene=='family_table':
        draw.ellipse((590,930,970,1110),fill='#A77A50');
        for x in (650,760,870):draw.ellipse((x,850,x+80,910),fill='#F3E6D2')
    elif scene in ('brand_culture','daily_life'):
        for x in (680,800,920):draw.line((x,730,x-40,1030),fill=GREEN,width=12); draw.ellipse((x-60,760,x,820),fill='#7F9C70'); draw.ellipse((x-20,850,x+40,910),fill='#91AA80')
    elif scene in ('home_drink','small_jar_daily','gao_daily','jiao_daily','luerong_daily','tangkuai_daily'):
        draw.rounded_rectangle((610,720,960,1060),28,fill='#E7DED0'); draw.rectangle((690,1010,900,1130),fill='#A77A50')
    # floor
    draw.rectangle((55,1160,1025,1260),fill='#D8C7B4')

def render(post):
    rng=random.Random(post['id'])
    base=Image.new('RGBA',(W,H),CREAM); draw=ImageDraw.Draw(base)
    # brand bar
    rounded(draw,(55,45,1025,120),32,NAVY); draw.text((90,66),'仙加味',font=font(FONT_SERIF,34),fill=WHITE); draw.text((900,65),'補養・日常',font=font(FONT_SANS_B,24),fill='#F2D99D',anchor='ra')
    rounded(draw,(65,155,300,208),24,'#EFE3D7'); draw.text((90,166),post['category'] or '日常內容',font=font(FONT_SANS_B,23),fill=RED)
    title_f=font(FONT_SERIF,52); lines=wrap_text(draw,post['title'],title_f,920,3); y=235
    for line in lines: draw.text((70,y),line,font=title_f,fill=NAVY); y+=68
    head=(post.get('headline') or '').strip().rstrip('。')
    if head and head.replace('。','')!=post['title'].replace('。',''):
        hf=font(FONT_SANS,25); for_lines=wrap_text(draw,head,hf,900,2)
        for line in for_lines:draw.text((75,y+4),line,font=hf,fill='#5A6778'); y+=36
    scene=post.get('scene') or 'daily_life'; draw_scene(draw,scene,rng,440)
    # mascot
    pose=POSES.get(post.get('mascot_pose','main'),POSES['main']).copy()
    if post.get('mascot_pose')=='main': pose=fit_rgba(pose,390,590); px,py=95,600
    else: pose=fit_rgba(pose,390,360); px,py=95,735
    shadow_paste(base,pose,(px,py),shadow=12,offset=(5,10),opacity=90)
    # companions separate
    deer=fit_rgba(POSES['deer'],95,110); turtle=fit_rgba(POSES['turtle'],105,105)
    shadow_paste(base,deer,(110,1110),shadow=5,offset=(2,5),opacity=55); shadow_paste(base,turtle,(250,1125),shadow=5,offset=(2,5),opacity=55)
    # products
    products=list(post.get('products') or [])
    if scene=='trial_table' and 'drink30' not in products: products=['drink30','drink30','drink30']
    if products:
        area_x0=560; area_x1=1005; n=len(products); gap=12; slot=(area_x1-area_x0-gap*(n-1))//max(1,n)
        for i,k in enumerate(products):
            src=PRODS.get(k)
            if not src:continue
            if k=='drink30': mh=190 if n<=2 else 135
            elif k=='drink180': mh=330 if n<=2 else 230
            elif k in ('gao','tangkuai','jiao'): mh=300 if n<=2 else 205
            else: mh=270 if n<=2 else 200
            im=fit_rgba(src,slot,mh)
            x=area_x0+i*(slot+gap)+(slot-im.width)//2; yy=1120-im.height
            shadow_paste(base,im,(x,yy),shadow=10,offset=(4,8),opacity=70)
    # footer
    draw.text((70,1300),'補養，是一種節奏。',font=font(FONT_SERIF,24),fill=GREEN)
    draw.text((1000,1300),f"{post['order']:02d}/77",font=font(FONT_SANS,18),fill='#8A8F94',anchor='ra')
    out=OUT/f"{post['id']}.webp"; base.convert('RGB').save(out,'WEBP',quality=88,method=6)
    return out

def main():
    with urllib.request.urlopen(MANIFEST_URL,timeout=30) as r: manifest=json.load(r)
    posts=manifest.get('posts',[])
    if len(posts)!=77:raise SystemExit(f'expected 77 posts, got {len(posts)}')
    files=[render(p) for p in posts]
    # contact sheet for visual audit
    thumbs=[]
    for p in files:
        im=Image.open(p).convert('RGB'); im.thumbnail((180,225)); thumbs.append(im.copy())
    cols=7; rows=math.ceil(len(thumbs)/cols); sheet=Image.new('RGB',(cols*190,rows*235),'#DDD7CC')
    for i,im in enumerate(thumbs):sheet.paste(im,((i%cols)*190+5,(i//cols)*235+5))
    sheet.save(OUT/'_contact-sheet.webp','WEBP',quality=82,method=6)
    (OUT/'manifest.json').write_text(json.dumps({'version':manifest.get('version'),'count':len(files),'files':[p.name for p in files]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if len(set(p.name for p in files))!=77:raise SystemExit('duplicate output filename')
    print(f'PASS generated {len(files)} unique post visuals from approved mascot sprite and formal product artwork')
if __name__=='__main__':main()
