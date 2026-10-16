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

# 詳細頁：全部從原廠透明去背來源 / 原始實拍裁切，不產生AI產品像素。
def detail_scene(img,slug,width=860,height=815):
    img=img.convert("RGBA")
    bbox=img.getchannel("A").getbbox()
    if not bbox:raise ValueError("空白詳細圖："+slug)
    img=img.crop(bbox)
    scale=min(width/img.width,height/img.height)
    img=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))),Image.Resampling.LANCZOS)
    canvas=BASE.copy()
    x=(canvas.width-img.width)//2
    y=1070-img.height
    shadow=Image.new("RGBA",canvas.size,(0,0,0,0))
    ImageDraw.Draw(shadow).ellipse((x+25,1046,x+img.width-25,1110),fill=(25,25,25,55))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    canvas.alpha_composite(img,(x,y))
    f=OUT/(slug+"-detail.webp")
    canvas.convert("RGB").save(f,"WEBP",quality=92,method=6)
    return str(f.relative_to(ROOT))

def crop_photo(relpath,poly):
    im=Image.open(ROOT/relpath).convert("RGBA")
    w,h=im.size
    mask=Image.new("L",im.size,0)
    ImageDraw.Draw(mask).polygon([(round(w*x),round(h*y)) for x,y in poly],fill=255)
    im.putalpha(mask.filter(ImageFilter.GaussianBlur(.7)))
    return im

detail={}
detail["guilu-gao"]=detail_scene(gao,"guilu-gao-box-jar",970,860)
gjar=crop_photo("images/product-main/gao-packaging-v20261016/box-jar-original.jpg",
    [(0.53,.29),(0.552,.214),(0.62,.182),(0.70,.201),(0.749,.268),(0.753,.72),(0.696,.766),(0.55,.752),(0.514,.673),(0.512,.40)])
detail["guilu-gao-jar"]=detail_scene(gjar,"guilu-gao-sealed-100g-jar",720,800)
for pid,source,ww,hh,note in MAP:
    if pid=="royalherb-erzhenbao-64":
        img,_=actual_er_zhen_box()
    else:
        img,_=cutout(source)
    detail[pid]=detail_scene(img,pid, min(900,ww+100),min(850,hh+90))

tea_map={
    "rose-fruit":"tea-rose-fruit",
    "leisure":"tea-danshen-leisure",
    "wudahan":"tea-wudahan",
    "fiber":"tea-danshen-lotus",
    "white":"tea-white-danshen",
    "refresh":"tea-danshen-refresh"
}
for name,stem in tea_map.items():
    front="images/partner-products/site-hero-v20261016/"+stem+"-front-cutout.webp"
    im,_=cutout(front)
    detail["tea-"+name]=detail_scene(im,"tea-"+name+"-package",800,780)
    source="images/partner-products/"+stem+"-label-source.jpg"
    # 雙面標示完整保存文字原像素，僅去除店內雜亂背景
    panel=crop_photo(source,[(.013,.09),(.45,.12),(.982,.053),(.988,.936),(.478,.932),(.013,.888)])
    detail["tea-"+name+"-label"]=detail_scene(panel,"tea-"+name+"-label",950,755)
siwu=crop_photo("images/partner-products/jinan-siwuyin-label.jpg",
    [(.012,.01),(.975,.01),(.949,.872),(.135,.904),(.049,.79)])
detail["siwu-label"]=detail_scene(siwu,"jinan-siwuyin-label",880,850)
vitality=crop_photo("images/partner-products/jinan-vitality-jar-original.jpg",
    [(.02,.421),(.08,.38),(.37,.38),(.458,.438),(.465,.63),(.473,.80),(.42,.848),(.15,.847),(.035,.798)])
detail["guilu-vitality-jar"]=detail_scene(vitality,"guilu-vitality-sealed-jar",690,770)
four=crop_photo("images/partner-products/supplements-v20261016/four-treasures-tray-back.jpg",
    [(.005,.57),(.43,.177),(.908,.275),(.954,.51),(.52,.896),(.02,.795)])
detail["four-treasures-inner"]=detail_scene(four,"four-treasures-actual-pieces",920,830)
# 二珍寶內托部分實拍被手遮住，不能AI創造遮住的部分；
# 公開詳細頁僅使用真盒去背展示，原始托盤保留核對來源。
detail["er-zhen-bao-inner"]=detail["royalherb-erzhenbao-64"]
manifest["detailImages"]=detail
manifest["notes"]=["所有輸出使用原實拍像素，沒有重新生成產品","龜鹿膏盒罐同張實拍近似等高","鹿茸粉不呈現內容物","二珍寶內托原照有手部遮擋不假裝完整"]
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Generated",len(manifest["products"]),"main images and",len(detail),"detail images")
