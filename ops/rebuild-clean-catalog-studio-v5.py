#!/usr/bin/env python3
# 仙加味：保留實拍像素的商品主圖、詳細圖片換新；不生成、不修補包裝。
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from hashlib import sha256
import json, math, re

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"images/catalog-clean-studio-v20261016-v5"
OUT.mkdir(parents=True,exist_ok=True)
W,H=1122,1402
VER="20261016-real-pixel-clean-studio-main-and-detail-v5"
PUBLISH_DIR="images/catalog-clean-studio-v20261016-v5"
manifest={"version":VER,"method":"original physical-photo pixels, alpha clipping, equal-proportion rescale and simple clean background; never AI redraw packaging","items":[]}

def scenery():
    im=Image.new("RGB",(W,H))
    p=im.load()
    for y in range(H):
        t=y/(H-1)
        c=(int(250-7*t),int(248-9*t),int(243-10*t))
        for x in range(W):p[x,y]=c
    art=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(art)
    # 極淡遠山背景，不使用任何含字圖層。
    d.polygon([(0,535),(100,469),(167,505),(275,405),(368,498),(477,442),(588,535),(677,463),(828,510),(920,390),(1028,483),(1122,455),(1122,790),(0,790)],fill=(153,151,135,23))
    d.polygon([(0,650),(148,571),(252,614),(403,518),(514,610),(690,540),(842,635),(1000,527),(1122,565),(1122,841),(0,841)],fill=(163,155,131,17))
    art=art.filter(ImageFilter.GaussianBlur(27))
    im=Image.alpha_composite(im.convert("RGBA"),art)
    # 不使用舞台橢圓圈與漂浮感，保留乾淨淡山霧背景
    return im

BG=scenery()
def read(rel):
    f=ROOT/rel
    if not f.is_file():raise FileNotFoundError(rel)
    im=Image.open(f).convert("RGBA")
    return im,sha256(f.read_bytes()).hexdigest()

def polygon_crop(source, pts):
    mask=Image.new("L",source.size,0)
    ImageDraw.Draw(mask).polygon(pts,fill=255)
    source=source.copy()
    source.putalpha(mask.filter(ImageFilter.GaussianBlur(0.65)))
    bb=source.getchannel("A").getbbox()
    if not bb:raise ValueError("empty polygon")
    return source.crop(bb)

def alpha_crop(rel):
    im,sh=read(rel)
    if im.getchannel("A").getextrema()[0]>=245:
        raise ValueError("非去背實物來源，不能直接替換："+rel)
    bb=im.getchannel("A").getbbox()
    if not bb:raise ValueError("空白透明商品："+rel)
    return im.crop(bb),sh

def output(name,subject,source,kind,maxw=780,maxh=750):
    subject=subject.convert("RGBA")
    bbox=subject.getchannel("A").getbbox()
    if not bbox:raise ValueError("empty subject")
    subject=subject.crop(bbox)
    ratio=min(maxw/subject.width,maxh/subject.height)
    w,h=round(subject.width*ratio),round(subject.height*ratio)
    subject=subject.resize((w,h),Image.Resampling.LANCZOS)
    xx=(W-w)//2; bottom=1125; yy=bottom-h
    if yy<135:raise ValueError("裁切商品尺寸異常 "+name)
    scene=BG.copy()
    shadow=Image.new("RGBA",(W,H),(0,0,0,0))
    ImageDraw.Draw(shadow).ellipse((xx+25,bottom-14,xx+w-25,bottom+14),fill=(55,48,41,36))
    scene.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(21)))
    scene.alpha_composite(subject,(xx,yy))
    path=OUT/(name+".webp")
    scene.convert("RGB").save(path,"WEBP",quality=91,method=6)
    with Image.open(path) as chk:assert chk.size==(W,H)
    manifest["items"].append({"file":str(path.relative_to(ROOT)),"kind":kind,"source":source})
    return str(path.relative_to(ROOT))

# 龜鹿膏盒與罐來自同張原廠實拍；詳細頁不得把罐子縮成小罐。
gaoph="images/product-main/gao-packaging-v20261016/box-jar-original.jpg"
shot,_=read(gaoph)
gw,gh=shot.size
def geom(coords):return [(round(x*gw/1400),round(y*gh/789)) for x,y in coords]
box=polygon_crop(shot,geom([(356,185),(446,83),(740,107),(740,146),(665,548),(440,520),(356,202)]))
jar=polygon_crop(shot,geom([(759,202),(787,171),(847,148),(948,150),(1014,173),(1040,200),(1042,245),(1029,270),(1023,331),(997,561),(948,607),(792,593),(746,548),(745,343),(735,297),(745,243)]))
# Combine unscaled source pixels, preserving all original relative size and position.
mix=Image.new("RGBA",shot.size,(0,0,0,0))
box_mask=Image.new("L",shot.size,0);ImageDraw.Draw(box_mask).polygon(geom([(356,185),(446,83),(740,107),(740,146),(665,548),(440,520),(356,202)]),fill=255)
mix.paste(shot,(0,0),box_mask.filter(ImageFilter.GaussianBlur(.7)))
jar_mask=Image.new("L",shot.size,0);ImageDraw.Draw(jar_mask).polygon(geom([(759,202),(787,171),(847,148),(948,150),(1014,173),(1040,200),(1042,245),(1029,270),(1023,331),(997,561),(948,607),(792,593),(746,548),(745,343),(735,297),(745,243)]),fill=255)
mix.paste(shot,(0,0),jar_mask.filter(ImageFilter.GaussianBlur(.7)))
mains={"guilu-gao":output("guilu-gao-main",box,gaoph,"box-primary",650,720)}
details={"guilu-gao":[output("guilu-gao-box-jar-detail",mix,gaoph,"box-and-jar-original-relative-scale",880,770)]}

# 原廠透明去背商品照；只等比縮放，絕不重畫字、容器、提繩。
PRODUCTS={
 "guilu-drink-30":("images/product-cutout-review/guilu-drink-30.png",420,520,580,690),
 "guilu-drink-180":("images/product-cutout-review/guilu-drink-180.png",570,760,690,875),
 "luerong-fen":("images/product-cutout-review/luerong-fen.png",490,690,620,820),
 "jinan-sisheng-siwuyin":("images/partner-products/cutouts-v20261016/jinan-siwuyin-front-cutout.webp",730,760,820,845),
 "danshen-tea-collection":("images/partner-products/site-hero-v20261016/tea-rose-fruit-front-cutout.webp",700,770,800,850),
 "guilu-vitality":("images/partner-products/cutouts-v20261016/jinan-vitality-front-cutout.webp",730,755,850,860),
 "uboss-sizhenbao":("images/partner-products/site-hero-v20261016/four-treasures-front-cutout.webp",770,690,880,780),
 "royalherb-erzhenbao-64":("images/partner-products/site-hero-v20261016/er-zhen-bao-royalherb-original-cutout.webp",770,700,900,840)
}
for id,(src,wm,hm,wd,hd) in PRODUCTS.items():
    im,_=alpha_crop(src)
    mains[id]=output(id+"-main",im,src,"real-exterior",wm,hm)
    if id in ["guilu-drink-30","guilu-drink-180","luerong-fen"]:
        details[id]=[output(id+"-closed-detail",im,src,"sealed-original-container-only",wd,hd)]
# 盒子主圖與內裝圖分開；不重複把內裝擺成主圖。
TEA={
 "rose-fruit":"tea-rose-fruit-front",
 "leisure":"tea-danshen-leisure-front",
 "wudahan":"tea-wudahan-front",
 "fiber":"tea-danshen-lotus-front",
 "white":"tea-white-danshen-front",
 "refresh":"tea-danshen-refresh-front",
}
for id,stem in TEA.items():
    src=f"images/partner-products/site-hero-v20261016/{stem}-cutout.webp"
    obj,_=alpha_crop(src)
    details.setdefault("danshen-tea-collection",[]).append(output("tea-"+id+"-box-detail",obj,src,"manufacturer-original-tea-box",795,830))

# 標示原照：將真實標示區裁成近景，保持像素原文，不做 OCR 重打或 AI 補字。
TEA_LABELS={
 "rose-fruit":"tea-rose-fruit-label-source.jpg",
 "leisure":"tea-danshen-leisure-label-source.jpg",
 "wudahan":"tea-wudahan-label-source.jpg",
 "fiber":"tea-danshen-lotus-label-source.jpg",
 "white":"tea-white-danshen-label-source.jpg",
 "refresh":"tea-danshen-refresh-label-source.jpg"
}
for id,filename in TEA_LABELS.items():
    src="images/partner-products/"+filename
    photo,_=read(src)
    w,h=photo.size
    # 手機兩盒合照右側為原廠背面，裁除零售背景；不篡改印字。
    crop=photo.crop((int(w*.49),int(h*.065),int(w*.985),int(h*.96)))
    details["danshen-tea-collection"].append(output("tea-"+id+"-label-detail",crop,src,"unaltered-original-label-pixel-crop",660,860))

# 詳細頁實物原照：托盤與瓶罐皆從實拍圖裁出；有人手遮擋時絕不填補。
def source_photo_detail(name,src,crop_frac,kind):
    im,_=read(src)
    w,h=im.size
    x0,y0,x1,y1=crop_frac
    cr=im.crop((round(w*x0),round(h*y0),round(w*x1),round(h*y1)))
    return output(name,cr,src,kind,810,850)

details["guilu-vitality"]=[
 source_photo_detail("vitality-real-jar-detail","images/partner-products/jinan-vitality-jar-original.jpg",(.04,.04,.96,.94),"factory-jar-exterior"),
 source_photo_detail("vitality-real-back-detail","images/partner-products/jinan-vitality-label-original.jpg",(.06,.17,.89,.93),"factory-label-no-text-redraw"),
]
details["jinan-sisheng-siwuyin"]=[
 source_photo_detail("siwuyin-real-label-detail","images/partner-products/jinan-siwuyin-label.jpg",(.07,.12,.93,.94),"factory-original-label"),
]
details["uboss-sizhenbao"]=[
 source_photo_detail("sizhenbao-sealed-tray-detail","images/partner-products/supplements-v20261016/four-treasures-sealed-tray.jpg",(.055,.15,.985,.94),"genuine-sealed-eight-square-tray"),
 source_photo_detail("sizhenbao-tray-back-detail","images/partner-products/supplements-v20261016/four-treasures-tray-back.jpg",(.04,.14,.96,.96),"genuine-tray-back"),
]
details["royalherb-erzhenbao-64"]=[
 source_photo_detail("erzhenbao-sealed-tray-detail","images/partner-products/supplements-v20261016/erzhenbao-tray-light.jpg",(.04,.09,.96,.89),"genuine-sealed-tray-no-AI"),
]

# 內部宣稱或價格原照不在主圖，公開頁只展示如實裁切的產品圖。
manifest["main"]=mains
manifest["detail"]=details
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
assert len(mains)==9
assert all(details.get(id) for id in mains)

# 來源圖片保留原檔；舊版不覆蓋，不讓舊主圖回流。下方僅調整網頁的媒體引用。
def replace_in(path,func):
    f=ROOT/path
    if not f.exists():raise FileNotFoundError(path)
    orig=f.read_text(encoding="utf-8")
    result=func(orig)
    if result!=orig:f.write_text(result,encoding="utf-8")

OLD="images/catalog-clean-v20261016/"
NEW=PUBLISH_DIR+"/"
oldver="20261016-original-pixel-clean-main-and-detail-v4"
def common(s):
    return s.replace(OLD,NEW).replace(oldver,VER)

page_by_id={
 "guilu-gao":"product-guilu-gao.html",
 "guilu-drink-30":"product-guilu-drink-30cc.html",
 "guilu-drink-180":"product-guilu-drink-180cc.html",
 "luerong-fen":"product-luerong-fen.html",
 "jinan-sisheng-siwuyin":"product-jinan-siwuyin.html",
 "guilu-vitality":"product-guilu-vitality.html",
 "uboss-sizhenbao":"product-four-treasures.html",
 "royalherb-erzhenbao-64":"product-er-zhen-bao.html",
 "danshen-tea-collection":"product-danshen-tea.html"
}
old_gallery={
 "product-guilu-gao.html":{"images/product-main/gao-packaging-v20261016/box-jar-scene.webp":details["guilu-gao"][0]},
 "product-guilu-drink-30cc.html":{"images/guilu-drink-30cc-glass.jpg":details["guilu-drink-30"][0]},
 "product-guilu-drink-180cc.html":{"images/guilu-drink-180cc.jpg":details["guilu-drink-180"][0]},
 "product-jinan-siwuyin.html":{"images/partner-products/scenes-v20261016/siwu-label-scene.webp":details["jinan-sisheng-siwuyin"][0]},
 "product-guilu-vitality.html":{"images/partner-products/scenes-v20261016/vitality-jar-scene.webp":details["guilu-vitality"][0],"images/partner-products/scenes-v20261016/vitality-label-scene.webp":details["guilu-vitality"][1]},
 "product-four-treasures.html":{"images/partner-products/supplements-v20261016/four-treasures-sealed-tray.jpg":details["uboss-sizhenbao"][0],"images/partner-products/supplements-v20261016/four-treasures-tray-back.jpg":details["uboss-sizhenbao"][1]},
 "product-er-zhen-bao.html":{"images/partner-products/supplements-v20261016/erzhenbao-tray-light.jpg":details["royalherb-erzhenbao-64"][0]}
}
for page,oldmap in old_gallery.items():
    def rewrite(s):
        s=common(s)
        for a,b in oldmap.items():
                s=s.replace(a,b)
        if page=="product-guilu-gao.html":
            s=re.sub(r'<a href="images/product-main/gao-packaging-v20261016/box-jar-original\.jpg" target="_blank" rel="noopener">查看未去背原始照片</a>',"原始實拍保留供包裝尺寸核對",s)
        return s
    replace_in(page,rewrite)

# 鹿茸粉只展示實體罐，不顯示粉末；補足詳細頁罐裝近景。
def luerong(s):
    s=common(s)
    if details["luerong-fen"][0] in s:return s
    anchor='<section class="section" id="complete-info">'
    assert anchor in s
    detail=details["luerong-fen"][0]
    gallery=(f'<section class="section product-packaging-gallery" aria-label="鹿茸粉75g密封罐實拍">'
             f'<div class="section-heading"><p class="eyebrow">包裝實物</p><h2>75g密封罐外觀</h2>'
             f'<p>以原罐實物照片呈現，未開罐、不展示粉末。</p></div>'
             f'<figure class="card"><a href="{detail}" target="_blank" rel="noopener"><img src="{detail}"'
             f' alt="鹿茸粉75g原罐密封外觀細節，未展示粉末" loading="lazy" decoding="async"'
             f' style="display:block;width:100%;max-width:660px;height:auto;object-fit:contain;margin:auto;border-radius:12px"></a></figure></section>')
    return s.replace(anchor,gallery+anchor)
replace_in("product-luerong-fen.html",luerong)

tea_old_stems=["tea-rose-fruit-front","tea-danshen-leisure-front","tea-wudahan-front","tea-danshen-lotus-front","tea-white-danshen-front","tea-danshen-refresh-front"]
def tea_page(s):
    s=common(s)
    for (id,stem) in TEA.items():
        old="images/partner-products/scenes-v20261016/"+stem+"-scene.webp"
        new=PUBLISH_DIR+"/tea-"+id+"-box-detail.webp"
        s=s.replace(old,new)
        label="images/partner-products/"+TEA_LABELS[id]
        # 詳細頁顯示清爽裁切後的實際標示；原始檔仍在專案儲存，不修改。
        s=s.replace(label,PUBLISH_DIR+"/tea-"+id+"-label-detail.webp")
    return s
replace_in("product-danshen-tea.html",tea_page)

# 其餘獨立商品頁、首頁、目錄、JS 展示來源一起使用新圖片。
for p in ["index.html","products.html","site.js","site-product-data-authority.js"]:
    replace_in(p,common)
for p in ["product-guilu-gao.html","product-guilu-drink-30cc.html","product-guilu-drink-180cc.html","product-luerong-fen.html",
          "product-jinan-siwuyin.html","product-guilu-vitality.html","product-four-treasures.html","product-er-zhen-bao.html","product-danshen-tea.html"]:
    replace_in(p,common)

# 圖片權威：商品主圖和詳細頁分流，杜絕舊 DM 當主圖。
authority=ROOT/"site-product-media-authority.js"
s=authority.read_text(encoding="utf-8")
for id in ["guilu-gao","guilu-drink-30","guilu-drink-180","luerong-fen"]:
    old=f'"mainImage": "images/catalog-clean-v20261016/{id}-main.webp"'
    new=f'"mainImage": "{mains[id]}"'
    assert old in s,id
    s=s.replace(old,new)
    block=r'("'+re.escape(id)+r'":\s*\{.*?"detailImages":\s*)\[[^\]]*\]'
    s,n=re.subn(block,lambda m:m.group(1)+json.dumps(details[id],ensure_ascii=False,indent=8),s,count=1,flags=re.S)
    assert n==1,id
s=s.replace(oldver,VER).replace("只允許 images/dm-final/","以真實實物照片的新背景圖為主；DM另行保留，不得混為單品主圖")
authority.write_text(s,encoding="utf-8")

for p in ["catalog-public.json","data.json","partner-catalog.json"]:
    f=ROOT/p
    d=json.loads(f.read_text(encoding="utf-8"))
    def repl(t):
        if isinstance(t,str):return common(t)
        if isinstance(t,list):return [repl(x) for x in t]
        if isinstance(t,dict):return {k:repl(v) for k,v in t.items()}
        return t
    d=repl(d)
    if p=="catalog-public.json":
        d["productImageVersion"]=VER
        for item in d.get("products",[]):
            id=item.get("id")
            if id in details:
                item["detailImages"]=[("https://ts15825868.github.io/xianjiawei/"+x) for x in details[id]]
                item["imagePolicy"]="主圖顯示真實外包裝；詳細頁顯示真實罐／袋／內裝與標示；只去背合成，禁止AI重畫商品"
    if p=="data.json":
        for item in d.get("products",[]):
            id=item.get("id")
            if id in details:item["detailImages"]=details[id]
    if p=="partner-catalog.json":
        for item in d.get("products",[]):
            id=item.get("id")
            if id in details:
                item["detailImages"]=details[id]
        d["version"]=VER
    f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

# 嚴格阻擋無效連結與舊圖回流：每個公開主圖／詳細圖均為真實生成檔。
for id,p in mains.items():
    assert (ROOT/p).is_file(),p
    for dp in details[id]:assert (ROOT/dp).is_file(),dp
    page=(ROOT/page_by_id[id]).read_text(encoding="utf-8")
    assert p in page,(id,"main image not linked")
    assert all(img in page for img in details[id]),(id,"detail images not linked")
    assert OLD not in page,(id,"old catalog still linked")
assert "powder" not in ",".join(details["luerong-fen"])
print("REAL PHOTO CLEAN CATALOG",len(mains),"mains;",sum(len(v) for v in details.values()),"details")
