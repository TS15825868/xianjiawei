#!/usr/bin/env python3
"""Publish real photographed product CONTENT only: isolate the photographed foreground.

No generative repaint, source-photo rewriting, background imagery, price changes
or change to product publication state. Existing approved carton heroes stay intact.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import cv2
import numpy as np
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"images/catalog-real-contents-v20261017"
OUT.mkdir(parents=True,exist_ok=True)

def original_source(path):
    path=ROOT/path
    if not path.is_file(): raise RuntimeError("Missing genuine photographic original: "+str(path))
    return path,hashlib.sha256(path.read_bytes()).hexdigest()

def rose_teabag():
    src,sha=original_source("images/partner-products/scenes-v20261016/rose-teabag-original.jpg")
    im=Image.open(src).convert("RGB")
    if im.size!=(1050,1400): raise RuntimeError("Rose-teabag actual photo framing changed")
    allowed=Image.new("L",im.size,0)
    ImageDraw.Draw(allowed).polygon([
      (308,758),(319,693),(336,611),(351,543),(386,489),
      (436,415),(491,346),(551,274),(643,192),(672,223),
      (702,280),(721,349),(728,401),(743,454),(783,525),(812,601)
    ],fill=255)
    hsv=cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2HSV)
    candidate=((np.asarray(allowed)>0)&(hsv[:,:,1]<100)&(hsv[:,:,2]>66)).astype("uint8")*255
    candidate=cv2.morphologyEx(candidate,cv2.MORPH_CLOSE,np.ones((23,23),dtype="uint8"))
    contours,_=cv2.findContours(candidate,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    if not contours: raise RuntimeError("No genuine teabag mask")
    clean=np.zeros_like(candidate)
    cv2.drawContours(clean,[max(contours,key=cv2.contourArea)],-1,255,-1)
    clean=cv2.GaussianBlur(clean,(5,5),0.6)
    bg=Image.fromarray(clean)
    bbox=bg.getbbox()
    if not bbox: raise RuntimeError("Empty genuine rose teabag")
    rgba=im.convert("RGBA")
    rgba.putalpha(bg)
    padx=30
    rgba=rgba.crop((max(0,bbox[0]-padx),max(0,bbox[1]-padx),
                    min(im.width,bbox[2]+padx),min(im.height,bbox[3]+padx)))
    out=OUT/"rose-fruit-real-teabag-mesh.webp"
    rgba.save(out,"WEBP",quality=94,method=6)
    return out,src,sha

def four_sealed_tray():
    src,sha=original_source("images/partner-products/supplements-v20261016/four-treasures-sealed-tray.jpg")
    img=Image.open(src).convert("RGBA")
    if img.size!=(1050,1400): raise RuntimeError("Four-treasure actual photo framing changed")
    a=Image.new("L",img.size,0)
    ImageDraw.Draw(a).polygon([(83,232),(629,218),(1047,1054),(280,1305)],fill=255)
    a=a.filter(ImageFilter.GaussianBlur(.75))
    img.putalpha(a)
    b=a.getbbox()
    if not b: raise RuntimeError("Empty actual four treasure photo")
    img=img.crop((max(0,b[0]-30),max(0,b[1]-30),
                  min(img.width,b[2]+30),min(img.height,b[3]+30)))
    out=OUT/"four-treasures-sealed-eight-real.webp"
    img.save(out,"WEBP",quality=94,method=6)
    return out,src,sha

def img_block(path,name,description):
    return (
       '<figure class="card" style="background:#F7F4ED">'
       '<a class="product-photo-original" href="'+path+'" target="_blank" rel="noopener">'
       '<span class="product-photo-frame" style="background:#F7F4ED">'
       '<img src="'+path+'" alt="'+name+'" loading="lazy" decoding="async" '
       'style="display:block;width:100%;height:auto;max-height:660px;object-fit:contain;background:#F7F4ED">'
       '</span></a><figcaption class="source-note">'+description+'</figcaption></figure>'
    )

def update_site(four_path,rose_path):
    # We never change current photo main URLs for public product cards.
    p=ROOT/"partner-catalog.json"
    data=json.loads(p.read_text(encoding="utf-8"))
    four=next(x for x in data["products"] if x["id"]=="uboss-sizhenbao")
    tea=next(x for x in data["products"] if x["id"]=="danshen-tea-collection")
    if not four.get("public") or not tea.get("public"): raise RuntimeError("Publication state has changed")
    rose=next(x for x in tea["variants"] if x["id"]=="jianfeng-rose-fruit-tea")
    for parent,image in ((four,four_path),(rose,rose_path)):
        parent.setdefault("detailImages",[])
        if image not in parent["detailImages"]:
            parent["detailImages"].append(image)
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    page=ROOT/"product-four-treasures.html"
    s=page.read_text(encoding="utf-8")
    landmark='<section class="section product-supplement-gallery">'
    if s.count(landmark)!=1: raise RuntimeError("Four treasure content section structure changed")
    i=s.index(landmark)
    # Do not overwrite existing manufacturer sealed/tray images.
    anchor='<div class="grid grid-2">'
    k=s.index(anchor,i)+len(anchor)
    if four_path not in s:
        s=s[:k]+img_block(four_path,
           "四珍寶原廠密封膏塊八格分盤去背實拍",
           "真正原始密封分盤照片，僅去除拍攝環境；每盤八格。")+s[k:]
    page.write_text(s,encoding="utf-8")

    page=ROOT/"product-danshen-tea.html"
    s=page.read_text(encoding="utf-8")
    anchor='<details class="product-label-details"><summary>展開玫瑰果茶背面標示'
    if s.count(anchor)!=1: raise RuntimeError("Rose-fruit variant details moved")
    if rose_path not in s:
        s=s.replace(anchor,
           '<div class="product-contents-photo" style="margin:14px 0;background:#F7F4ED">'+
           '<a href="'+rose_path+'" target="_blank" rel="noopener">'+
           '<img src="'+rose_path+'" loading="lazy" decoding="async" '+
           'alt="臺灣丹參玫瑰果茶三角茶包，直接從原始實拍照片去背" '+
           'style="display:block;width:100%;height:auto;max-height:360px;object-fit:contain;background:#F7F4ED">'+
           '</a><p class="source-note">僅玫瑰果茶的實際三角茶包，不與其他五款共用。</p></div>'+anchor)
    s=s.replace("原廠真實包裝正反面山水情境展示圖","完整原廠外盒正面去背實拍")
    page.write_text(s,encoding="utf-8")

def main():
    rose,rosesrc,rosehash=rose_teabag()
    four,foursrc,fourhash=four_sealed_tray()
    for im in (rose,four):
        p=Image.open(im)
        if p.mode!="RGBA" or p.getchannel("A").getextrema()!=(0,255):
            raise RuntimeError("Not a true isolated original foreground: "+str(im))
        if min(p.size)<350: raise RuntimeError("Product photo too small")
    rose_path=str(rose.relative_to(ROOT))
    four_path=str(four.relative_to(ROOT))
    update_site(four_path,rose_path)
    (OUT/"manifest.json").write_text(json.dumps({
        "version":"20261017-photographic-contents-only",
        "items":[{"file":rose_path,"source":str(rosesrc.relative_to(ROOT)),
                  "sha256":rosehash,"scope":"rose-fruit variant only"},
                 {"file":four_path,"source":str(foursrc.relative_to(ROOT)),
                  "sha256":fourhash,"scope":"four-treasures sealed inner tray"}],
        "rules":["Real photo pixels only; background stripped, package and content unmodified",
                 "Never use rose tea bag for the other five SKUs",
                 "Retain real packaging hero separate from contents gallery",
                 "Do not infer or invent any unphotographed contents"]
      },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS two genuine contents photos added; all existing public carton images preserved")

if __name__=="__main__":
    main()
