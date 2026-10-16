#!/usr/bin/env python3
"""仙加味商品真實照片主圖：只切割原始實拍像素，絕不生成或改寫包裝文字。"""
from __future__ import annotations
from pathlib import Path
from io import BytesIO
from urllib.request import Request, urlopen
import json, hashlib
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"images/catalog-clean-v20261016"
OUT.mkdir(parents=True,exist_ok=True)
ORIGINAL_BG=Image.open(ROOT/"images/partner-products/scenes-v20261016/neutral-pedestal-background.webp").convert("RGBA")
# 丟棄舊版複雜背景，採95%暖米白＋淡山霧，無亂物品
BASE=Image.blend(ORIGINAL_BG,Image.new("RGBA",ORIGINAL_BG.size,"#F7F4ED"),0.95)
if BASE.size != (1122,1402):
    raise ValueError("未經確認的背景尺寸；停止發布")
BATCH="20261016-clean-real-photo-products-v4"

# 最新使用者提供：龜鹿膏外盒正面實拍。僅裁切原有盒面像素。
GAO_BOX_PHOTO="https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/329983d2-3f8e-40a4-8ebd-403e37d18c32.jpg"
ER_ZHEN_BOX_PHOTO="https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/f4b0e9c5-8824-46b8-a6fa-285fe8f0895e.jpg"
def actual_gao_box():
    req=Request(GAO_BOX_PHOTO,headers={"User-Agent":"Xianjiawei-real-photo-publisher/1.0"})
    with urlopen(req,timeout=35) as r: raw=r.read(4_000_000)
    if len(raw)<80000 or len(raw)>3_999_999:
        raise ValueError("原始實拍下載大小異常")
    src=Image.open(BytesIO(raw)).convert("RGBA")
    if src.size!=(1536,864):
        raise ValueError("原始外盒尺寸不符，不可生成替代包裝")
    # 新上傳的正面外盒照：頂面＋正面，採實際輪廓去背，不繪畫標籤。
    contour=[(456,211),(540,128),(853,131),(886,212),(852,676),(501,675),(455,224)]
    mask=Image.new("L",src.size,0)
    ImageDraw.Draw(mask).polygon(contour,fill=255)
    src.putalpha(mask.filter(ImageFilter.GaussianBlur(0.6)))
    return src.crop((425,89,911,700)),hashlib.sha256(raw).hexdigest()

def actual_er_zhen_box():
    # 新上傳 IMG_9999 實拍原始完整紫色禮盒（沒有橘色塊）；
    # 主圖只呈現真盒，內裝留給詳細頁，不得 AI 補字。
    req=Request(ER_ZHEN_BOX_PHOTO,headers={"User-Agent":"Xianjiawei-real-photo-publisher/1.0"})
    with urlopen(req,timeout=35) as resp: raw=resp.read(4_000_000)
    if len(raw)<80000 or len(raw)>3_999_999: raise ValueError("二珍寶原始盒裝下載大小異常")
    src=Image.open(BytesIO(raw)).convert("RGBA")
    if src.size!=(1536,1152): raise ValueError("二珍寶原始盒裝尺寸不符")
    pts=[(225,105),(1402,139),(1306,1077),(208,982)]
    mask=Image.new("L",src.size,0)
    ImageDraw.Draw(mask).polygon(pts,fill=255)
    src.putalpha(mask.filter(ImageFilter.GaussianBlur(0.65)))
    return src.crop((195,85,1415,1090)),hashlib.sha256(raw).hexdigest()

def cutout(relpath):
    path=ROOT/relpath
    if not path.exists():raise FileNotFoundError(str(path))
    im=Image.open(path).convert("RGBA")
    alpha=im.getchannel("A")
    if alpha.getextrema()[0] >= 250:
        raise ValueError("非透明實拍裁切檔，停止發布："+relpath)
    bbox=alpha.getbbox()
    if not bbox:raise ValueError("空白商品："+relpath)
    return im.crop(bbox),hashlib.sha256(path.read_bytes()).hexdigest()

def composite(img,goal_width,goal_height,filename):
    scale=min(goal_width/img.width,goal_height/img.height)
    img=img.resize((max(1,int(img.width*scale)),max(1,int(img.height*scale))),Image.Resampling.LANCZOS)
    x=(BASE.width-img.width)//2
    # 在實際石台上放置，不改原包裝比例
    baseline=1064
    y=baseline-img.height
    if y<100:raise ValueError("商品過大，超出安全構圖")
    canv=BASE.copy()
    sh=Image.new("RGBA",BASE.size,(0,0,0,0))
    ImageDraw.Draw(sh).ellipse((x+25,baseline-27,x+img.width-25,baseline+37),fill=(26,24,21,96))
    canv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(23)))
    canv.alpha_composite(img,(x,y))
    dest=OUT/(filename+"-main.webp")
    canv.convert("RGB").save(dest,"WEBP",quality=92,method=6)
    chk=Image.open(dest)
    if chk.size!=(1122,1402): raise AssertionError(str(dest))
    return str(dest.relative_to(ROOT))

def actual_box_and_jar():
    """新主圖真實外盒及100g罐同框，保留原本近似等高的比例。"""
    path=ROOT/"images/product-main/gao-packaging-v20261016/box-jar-original.jpg"
    src=Image.open(path).convert("RGBA")
    w,h=src.size
    mask=Image.new("L",(w,h),0)
    polygons=[
      [(0.255,0.246),(0.325,0.109),(0.535,0.137),(0.543,0.228),(0.504,0.693),(0.31,0.665),(0.255,0.263)],
      [(0.52,0.273),(0.551,0.207),(0.62,0.182),(0.703,0.198),(0.745,0.268),(0.744,0.403),(0.755,0.69),(0.685,0.77),(0.545,0.752),(0.518,0.645),(0.512,0.404)]
    ]
    draw=ImageDraw.Draw(mask)
    for pts in polygons:
        draw.polygon([(round(x*w),round(y*h)) for x,y in pts],fill=255)
    src.putalpha(mask.filter(ImageFilter.GaussianBlur(.75)))
    return src.crop(src.getchannel("A").getbbox()),hashlib.sha256(path.read_bytes()).hexdigest()

MAP=[
  ("guilu-drink-30","images/product-cutout-review/guilu-drink-30.png",430,495,"30cc玻璃裸罐，沒有外盒"),
  ("guilu-drink-180","images/product-cutout-review/guilu-drink-180.png",510,760,"180cc正式鋁袋"),
  ("luerong-fen","images/product-cutout-review/luerong-fen.png",455,720,"原廠75g密封白罐，禁止粉末入鏡"),
  ("jinan-sisheng-siwuyin","images/partner-products/cutouts-v20261016/jinan-siwuyin-front-cutout.webp",760,710,"完整原廠粉紅盒"),
  ("danshen-tea-collection","images/partner-products/site-hero-v20261016/tea-rose-fruit-front-cutout.webp",700,760,"六款系列的真實代表包裝，不捏造六包"),
  ("guilu-vitality","images/partner-products/cutouts-v20261016/jinan-vitality-front-cutout.webp",755,795,"原廠12入禮盒，非單罐主圖"),
  ("uboss-sizhenbao","images/partner-products/site-hero-v20261016/four-treasures-front-cutout.webp",750,720,"原廠四珍寶紅盒"),
  ("royalherb-erzhenbao-64","images/partner-products/site-hero-v20261016/er-zhen-bao-royalherb-original-cutout.webp",750,760,"原廠二珍寶紫盒"),
]
manifest={"batch":BATCH,"sourcePriority":"real actual-package original pixels only; no AI-generated product","status":"ready-for-page-link-verification","products":[]}
gao,sha=actual_box_and_jar()
path=composite(gao,880,790,"guilu-gao")
manifest["products"].append({"id":"guilu-gao","mainImage":path,"source":"user supplied 2026-10-16 front package photograph","sha256":sha,"display":"原實拍盒子為主，100g罐與盒近似等高；同框實際比例不單獨縮放"})
for pid,source,ww,hh,note in MAP:
    if pid=="royalherb-erzhenbao-64":
        cut,sha=actual_er_zhen_box()
        source="user supplied actual IMG_9999 original complete purple carton"
        note="二珍寶原廠紫色外盒完整呈現；實體膏塊僅在詳細頁"
    else:
        cut,sha=cutout(source)
    path=composite(cut,ww,hh,pid)
    manifest["products"].append({"id":pid,"mainImage":path,"source":source,"sha256":sha,"display":note})
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("GENERATED",len(manifest["products"]),"real-product hero photos")
