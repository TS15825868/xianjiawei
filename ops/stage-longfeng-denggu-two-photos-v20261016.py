#!/usr/bin/env python3
"""龍鳳登古飲男方／女方真實外盒實拍去背待驗收；不生成包裝、不填未核對成分。"""
from __future__ import annotations
import hashlib,json
from pathlib import Path
from urllib.request import Request,urlopen
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from io import BytesIO

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"images/partner-products/longfeng-denggu-review-v20261016"
OUT.mkdir(parents=True,exist_ok=True)
BG="#F7F4ED"
SOURCES={
 "male-blue":("https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/a3ed3eca-9096-456a-8064-0ea90de2a853.jpg","男方","藍色"),
 "female-pink":("https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/0d01e4df-a921-4f7a-bb69-8038b4b10b67.jpg","女方","粉紅色"),
}
BLUE_BOX=[(120,412),(966,430),(869,1130),(174,1128)]
PINK_BOX=[(14,382),(1057,377),(984,1205),(175,1204)]
def image_pixels(source:bytes):
    im=Image.open(BytesIO(source)).convert("RGB")
    w,h=im.size
    if not 0.70 < w/h < 0.82 or min(w,h) < 900:raise ValueError("unverified packaging source dimensions")
    return np.asarray(im),w,h

def render(arr:np.ndarray,kind:str):
    h,w=arr.shape[:2]
    sx=w/1108; sy=h/1477
    poly=BLUE_BOX if kind=="male-blue" else PINK_BOX
    poly=np.array([(round(x*sx),round(y*sy)) for x,y in poly],np.int32)
    mask=np.zeros((h,w),np.uint8)
    cv2.fillPoly(mask,[poly],255)
    hsv=cv2.cvtColor(arr,cv2.COLOR_RGB2HSV)
    rope=np.zeros_like(mask)
    if kind=="male-blue":
        cv2.rectangle(rope,(round(280*sx),round(350*sy)),(round(830*sx),round(453*sy)),255,-1)
        hue=cv2.inRange(hsv,(90,95,70),(125,255,255))
    else:
        cv2.rectangle(rope,(round(320*sx),round(220*sy)),(round(850*sx),round(437*sy)),255,-1)
        hue=cv2.inRange(hsv,(148,100,70),(179,255,255))
    rope=cv2.bitwise_and(rope,hue)
    rope=cv2.morphologyEx(rope,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    mask=cv2.bitwise_or(mask,rope)
    mask=cv2.GaussianBlur(mask,(3,3),.6)
    ys,xs=np.where(mask>0)
    if len(xs)<200000:raise ValueError("segmentation empty or source mismatch")
    cut=Image.fromarray(np.dstack([arr,mask]),"RGBA").crop((int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1))
    width,height=1122,1402
    bg=Image.new("RGBA",(width,height),BG)
    factor=min(930/cut.width,920/cut.height)
    cut=cut.resize((round(cut.width*factor),round(cut.height*factor)),Image.Resampling.LANCZOS)
    x=(width-cut.width)//2; y=1080-cut.height
    shadow=Image.new("RGBA",bg.size,(0,0,0,0))
    ImageDraw.Draw(shadow).ellipse((x+35,1055,x+cut.width-35,1120),fill=(38,28,18,48))
    bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(25)))
    bg.alpha_composite(cut,(x,y))
    return bg.convert("RGB")

manifest={"version":"20261016-longfeng-denggu-original-photo-staging","status":"image-review-pending-unverified-label-facts","method":"actual source photo original pixels masked onto new simple background, not AI redrawn packaging","ingredientPolicy":"do not infer from the box front; customer will upload back label later","products":[]}
for kind,(url,variant,color) in SOURCES.items():
    data=urlopen(Request(url,headers={"User-Agent":"XianjiaweiPhotoAudit/1.0"}),timeout=35).read()
    if len(data)<100000 or len(data)>6_000_000:raise ValueError("unverified original photo size")
    arr,w,h=image_pixels(data)
    # 真實原照保留於獨立版本，去背情境圖不覆蓋舊圖
    (OUT/f"{kind}-source.jpg").write_bytes(data)
    dst=render(arr,kind)
    image_path=OUT/f"{kind}-main-candidate.webp"
    dst.save(image_path,"WEBP",quality=92,method=6)
    assert Image.open(image_path).size==(1122,1402)
    manifest["products"].append({"id":f"longfeng-denggu-{kind}","parentProduct":"longfeng-denggu","variant":variant,"packagingColor":color,"printedFrontCount":"12入","source":str((OUT/f"{kind}-source.jpg").relative_to(ROOT)),"sha256":hashlib.sha256(data).hexdigest(),"image":str(image_path.relative_to(ROOT)),"publicationStatus":"candidate-only-until-visible-photo-QA-and-label-facts-reviewed","ingredients":None,"usage":None,"shelfLife":None})
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Staged two independent original-photo packaging variants:",[p["variant"] for p in manifest["products"]])
