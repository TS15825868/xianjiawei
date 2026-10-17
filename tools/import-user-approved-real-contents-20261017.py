#!/usr/bin/env python3
"""Publish owner-selected full retail carton and actual photographed contents.

The RGB pixels inside a carefully traced polygon originate from actual product photographs; never generative repainting. Source ZIPs are NOT committed because
rear carton photos contain price stickers and unapproved copy.
"""
from __future__ import annotations
from pathlib import Path
from io import BytesIO
import argparse, hashlib, json, zipfile
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from pillow_heif import register_heif_opener
register_heif_opener()

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"images/catalog-user-original-v20261017"
OUT.mkdir(parents=True, exist_ok=True)

def in_zip(zipname, endswith):
    with zipfile.ZipFile(zipname) as z:
        matches=[n for n in z.namelist()
            if not n.startswith("__MACOSX/") and n.lower().endswith(endswith.lower())]
        if len(matches)!=1:
            raise RuntimeError("Expected exactly one source "+endswith+
                " (found "+str(len(matches))+")")
        raw=z.read(matches[0])
    im=ImageOps.exif_transpose(Image.open(BytesIO(raw))).convert("RGBA")
    im.load()
    return im, {"originalFilename":matches[0].rsplit("/",1)[-1],
                "originalSha256":hashlib.sha256(raw).hexdigest(),"originalImageSize":list(im.size)}

def traced_cutout(im, ref, poly, dest, strokes=None, maxside=1800):
    w,h=im.size
    sx,sy=w/ref[0],h/ref[1]
    alpha=Image.new("L",im.size,0)
    draw=ImageDraw.Draw(alpha)
    draw.polygon([(round(x*sx),round(y*sy)) for x,y in poly],fill=255)
    for line,width in (strokes or []):
        draw.line([(round(x*sx),round(y*sy)) for x,y in line],
            fill=255,width=max(2,round(width*sx)),joint="curve")
    alpha=alpha.filter(ImageFilter.GaussianBlur(max(.5,.6*sx)))
    im=im.copy(); im.putalpha(alpha)
    bbox=alpha.getbbox()
    if bbox is None:
        raise RuntimeError("empty product mask: "+dest)
    pad=max(15,round(min(im.size)*.018))
    im=im.crop((max(0,bbox[0]-pad),max(0,bbox[1]-pad),
                min(w,bbox[2]+pad),min(h,bbox[3]+pad)))
    if max(im.size)>maxside:
        im.thumbnail((maxside,maxside),Image.Resampling.LANCZOS)
    if im.getchannel("A").getextrema()!=(0,255):
        raise RuntimeError("cutout is not transparent: "+dest)
    if im.width<350 or im.height<320:
        raise RuntimeError("unsafe resized product size: "+dest)
    p=OUT/dest
    im.save(p,"WEBP",quality=94,method=6)
    return str(p.relative_to(ROOT))

def replace_section(html_path, heading, new_html):
    path=ROOT/html_path
    raw=path.read_text(encoding="utf-8")
    start=raw.index('<section class="section product-supplement-gallery">')
    end=raw.index("</section>",start)+len("</section>")
    original=raw[start:end]
    if heading not in original:
        raise RuntimeError("gallery identity mismatch "+html_path)
    path.write_text(raw[:start]+new_html+raw[end:],encoding="utf-8")

def figure(src, description, caption):
    return ('<figure class="card"><a class="product-photo-original" href="'+src+
        '" target="_blank" rel="noopener"><span class="product-photo-frame" '+
        'style="background:#F7F4ED"><img src="'+src+'" alt="'+description+
        '" loading="lazy" decoding="async" style="width:100%;height:auto;object-fit:contain;'+
        'max-height:650px;background:#F7F4ED"></span></a><figcaption class="source-note">'+
        caption+'</figcaption></figure>')

def run(new_zip):
    two,meta_two=in_zip(new_zip,"IMG_0002.HEIC")
    two_path=traced_cutout(two,(675,900),[(101,79),(299,80),(305,77),
        (315,71),(386,77),(394,86),(616,104),(529,448),(541,783),
        (35,708),(164,411),(100,96)],
        "royalherb-erzhenbao-open-box-content.webp")
    four,meta_four=in_zip(new_zip,"IMG_9832.heic")
    four_path=traced_cutout(four,(675,900),[(0,510),(324,170),
        (614,246),(345,767),(0,526)],
        "uboss-sizhenbao-unwrapped-blocks-content.webp")
    rose,meta_rose=in_zip(new_zip,"IMG_9970.JPG")
    rose_path=traced_cutout(rose,(675,900),[(149,435),(185,274),
        (207,225),(314,164),(356,211),(487,411),(342,438),(149,439)],
        "jianfeng-rose-fruit-teabag-content.webp",
        strokes=[([(395,268),(441,274),(490,294),(534,338),
                 (561,382),(559,401),(539,421),(498,460),(475,500)],4)])
    # The hanging rectangular tag is a separate photographic foreground,
    # not generated geometry: composite only its original image pixels.
    mask=Image.new("L",rose.size,0)
    sd=ImageDraw.Draw(mask)
    sx,sy=rose.width/675,rose.height/900
    sd.polygon([(round(x*sx),round(y*sy)) for x,y in [(419,501),(522,477),
                    (565,573),(444,605)]],fill=255)
    sd.line([(round(x*sx),round(y*sy)) for x,y in [(395,268),(441,274),
        (490,294),(534,338),(561,382),(559,401),(539,421),
        (498,460),(475,500)]],fill=255,width=max(3,round(4*sx)),joint="curve")
    # The separate tag is present in the owner original. Keep only source pixels.
    # (Primary mask already includes entire tea bag and cord.)
    tag=rose.copy()
    existing=Image.open(ROOT/rose_path).convert("RGBA")
    # Tag is included via second pass from original on its full coordinate canvas:
    remask=Image.new("L",rose.size,0)
    dd=ImageDraw.Draw(remask)
    for polygon in [[(149,435),(185,274),(207,225),(314,164),
                     (356,211),(487,411),(342,438),(149,439)],
                    [(419,501),(522,477),(565,573),(444,605)]]:
        dd.polygon([(round(x*sx),round(y*sy)) for x,y in polygon],fill=255)
    dd.line([(round(x*sx),round(y*sy)) for x,y in [(395,268),(441,274),
        (490,294),(534,338),(561,382),(559,401),(539,421),
        (498,460),(475,500)]],fill=255,width=max(3,round(4*sx)),joint="curve")
    remask=remask.filter(ImageFilter.GaussianBlur(max(.5,.55*sx)))
    rose.putalpha(remask)
    box=remask.getbbox();pad=max(15,round(min(rose.size)*.018))
    rose=rose.crop((max(0,box[0]-pad),max(0,box[1]-pad),
        min(rose.width,box[2]+pad),min(rose.height,box[3]+pad)))
    rose.thumbnail((1800,1800),Image.Resampling.LANCZOS)
    rose.save(ROOT/rose_path,"WEBP",quality=94,method=6)

    partner_file=ROOT/"partner-catalog.json"
    partners=json.loads(partner_file.read_text(encoding="utf-8"))
    group={p["id"]:p for p in partners["products"]}
    if not all(x in group and group[x].get("public") for x in
               ["royalherb-erzhenbao-64","uboss-sizhenbao","danshen-tea-collection"]):
        raise RuntimeError("Approved public product states changed; refuse blind update")
    group["royalherb-erzhenbao-64"]["detailImages"]=[two_path]
    group["uboss-sizhenbao"]["detailImages"]=[four_path]
    variants=group["danshen-tea-collection"]["variants"]
    rose_variant=next(v for v in variants if v["id"]=="jianfeng-rose-fruit-tea")
    rose_variant["detailImages"]=[i for i in rose_variant["detailImages"] if i!=rose_path]+[rose_path]
    partner_file.write_text(json.dumps(partners,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    two_gallery=('<section class="section product-supplement-gallery"><div class="section-heading">'+
        '<h2>二珍寶完整開盒與真實內盤</h2><p>直接使用原廠實物開盒照片，只去除拍攝環境，'+
        '保持盒蓋、膏塊分盤及密封外觀；整盒規格為600g±15g、64塊。</p></div>'+
        '<div class="grid grid-2">'+figure(two_path,
        '二珍寶原始實拍開盒照片去背，紫色外盒與兩個密封內盤完整可見',
        '原廠開盒與密封分盤實物照片；透明背景，沒有重畫內容物。')+
        '</div></section>')
    replace_section("product-er-zhen-bao.html","二珍寶盒內分盤實拍",two_gallery)
    four_gallery=('<section class="section product-supplement-gallery"><div class="section-heading">'+
        '<h2>四珍寶膏塊實物照片</h2><p>實際拆封膏塊與分盤的原始照片去背，保留真實'+
        '外觀與個別膏塊比例；整盒規格仍為600g±15g、64塊。</p></div>'+
        '<div class="grid grid-2">'+figure(four_path,
        '四珍寶真實實物膏塊八塊與原廠內盤透明背景照片',
        '四珍寶膏塊實物及單盤8塊展示；整盒64塊，沒有 AI 重畫。')+
        '</div></section>')
    replace_section("product-four-treasures.html","四珍寶盒內分盤實拍",four_gallery)
    tea_file=ROOT/"product-danshen-tea.html"
    tea=tea_file.read_text(encoding="utf-8")
    old='<details class="product-label-details"><summary>展開玫瑰果茶背面標示'
    new=( '<figure class="card" style="margin:16px 0;background:#F7F4ED">'+
        '<a href="'+rose_path+'" target="_blank" rel="noopener">'+
        '<img src="'+rose_path+'" alt="臺灣丹參玫瑰果茶三角茶包與吊牌真實實拍，僅去除背景" '+
        'loading="lazy" decoding="async" style="max-height:360px;width:100%;'+
        'height:auto;object-fit:contain;background:#F7F4ED"></a>'+
        '<figcaption class="source-note">玫瑰果茶的三角茶包實物；只代表本款，'+
        '不混用到其他五款。</figcaption></figure>'+old)
    if tea.count(old)!=1:
        raise RuntimeError("Tea rose insertion point moved unexpectedly")
    tea=tea.replace(old,new)
    tea=tea.replace("原廠真實包裝正反面山水情境展示圖","原廠真實包裝完整外盒去背主圖")
    tea_file.write_text(tea,encoding="utf-8")

    metadata={"revision":"20261017-owner-real-contents-v1",
        "sources":{"royalherb-open-box":meta_two,"uboss-open-blocks":meta_four,
           "rose-fruit-tea-bag":meta_rose},
        "published":{"royalherb-open-box":two_path,"uboss-unwrapped-blocks":four_path,
           "rose-fruit-bag":rose_path},
        "restrictions":["Do not publish unredacted two/four-treasure back pictures: factory boxes carry price stickers.",
            "Do not use rose-fruit tea bag photo for any of other five tea varieties.",
            "Never infer unphotographed packaging components by AI.",
            "Owner-approved scenic two-treasure reference is not an original factory camera photograph.",
            "Old room-environment supplement photos remain archived but are no longer rendered in these galleries."]}
    (OUT/"source-integrity.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS updated authentic content assets",list(metadata["published"]))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--new-products",required=True)
    a=ap.parse_args()
    run(a.new_products)
