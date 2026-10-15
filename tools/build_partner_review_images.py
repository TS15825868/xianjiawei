#!/usr/bin/env python3
"""Create REVIEW-ONLY product composites from existing partner real photos.
No AI-generated packaging, no synthetic labeling, no modification of source RGB.
Only alpha extraction and backdrop are produced; publication needs review.
"""
from __future__ import annotations
import hashlib
import json
import math
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from rembg import new_session, remove

ROOT=Path(__file__).resolve().parents[1]
ORIGINALS=(ROOT/"images/partner-products").resolve()
OUT=ROOT/"images/partner-product-design-review"
SIZE=1000

def sources():
    catalog=json.loads((ROOT/"partner-catalog.json").read_text(encoding="utf-8"))
    items=[]
    seen=set()
    for p in catalog["products"]:
        if p.get("public") is not True: continue
        pid=str(p.get("id",""))
        photo=str(p.get("image",""))
        if not pid or not photo or pid in seen: continue
        if any(not(ch.isascii() and (ch.isalnum() or ch=="-")) for ch in pid):
            raise ValueError("unexpected product id "+pid)
        seen.add(pid)
        items.append({"id":pid,"name":p.get("name",pid),"image":photo})
    # One catalog card, six independently photographed tea variants.
    photographed={p["image"] for p in items}
    for name in ["tea-danshen-leisure","tea-danshen-lotus",
                 "tea-danshen-refresh","tea-rose-fruit",
                 "tea-white-danshen","tea-wudahan"]:
        photo="images/partner-products/"+name+"-front.webp"
        if photo not in photographed:
            items.append({"id":name,"name":"丹參茶包系列・原廠款式","image":photo})
    return items

def source_image(relative):
    path=(ROOT/relative).resolve()
    if not path.is_relative_to(ORIGINALS) or not path.is_file():
        raise ValueError("missing/unsafe physical photo "+relative)
    if path.suffix.lower() not in (".png",".jpg",".jpeg",".webp",".avif"):
        raise ValueError("not a supported physical photo "+relative)
    return path

@lru_cache(maxsize=1)
def background():
    path=ROOT/"images/brand/world-landscape-v20261008.webp"
    if path.exists():
        base=ImageOps.fit(Image.open(path).convert("RGBA"),(SIZE,SIZE))
        base=Image.alpha_composite(base,Image.new("RGBA",(SIZE,SIZE),(247,244,237,146)))
    else:
        base=Image.new("RGBA",(SIZE,SIZE),(247,244,237,255))
    wash=Image.new("RGBA",(SIZE,SIZE))
    d=ImageDraw.Draw(wash)
    # Restrained brand gold/blue-gray scenery; no AI product objects.
    d.polygon([(0,650),(180,530),(300,600),(485,440),(680,620),(850,490),
               (1000,580),(1000,850),(0,850)],fill=(80,105,128,18))
    d.ellipse((280,837,720,910),fill=(28,42,49,15))
    d.line([(160,885),(840,885)],fill=(180,144,82,110),width=2)
    for k,alpha in [(32,100),(42,46)]:
        d.rounded_rectangle((k,k,SIZE-k,SIZE-k),radius=25,
                            outline=(180,144,82,alpha),width=2)
    wash=wash.filter(ImageFilter.GaussianBlur(3))
    return Image.alpha_composite(base,wash)

def make(original,session):
    rgb=ImageOps.exif_transpose(original).convert("RGBA")
    w,h=rgb.size
    if min(w,h)<250: raise ValueError("image too small")
    bg_removed=remove(rgb,session=session).convert("RGBA")
    alpha=bg_removed.getchannel("A")
    hard=alpha.point(lambda a:255 if a>=70 else 0)
    box=hard.getbbox()
    if box is None: raise ValueError("empty cutout")
    coverage=sum(hard.histogram()[1:])/(255*w*h)
    if not 0.025<coverage<0.88:
        raise ValueError(f"alpha segmentation rejected: coverage {coverage:.3f}")
    # Source pixels from the EXACT original photo, never redraw words/packaging.
    cutout=rgb.copy()
    cutout.putalpha(alpha)
    margin=4
    cutout=cutout.crop((max(0,box[0]-margin),max(0,box[1]-margin),
                       min(w,box[2]+margin),min(h,box[3]+margin)))
    cutout.thumbnail((720,685),Image.Resampling.LANCZOS)
    x=(SIZE-cutout.width)//2
    y=max(128,847-cutout.height)
    dark=Image.new("RGBA",cutout.size,(24,31,34,0))
    dark.putalpha(cutout.getchannel("A").point(lambda a:int(a*0.21)))
    shadow=Image.new("RGBA",(SIZE,SIZE))
    shadow.alpha_composite(dark,(x+8,y+18))
    shadow=shadow.filter(ImageFilter.GaussianBlur(19))
    image=Image.alpha_composite(background().copy(),shadow)
    image.alpha_composite(cutout,(x,y))
    return image.convert("RGB"),cutout,{"width":w,"height":h,
       "alpha_coverage":round(coverage,4),"foreground_box":box,
       "scaled_size":[cutout.width,cutout.height]}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    current=sources()
    session=new_session("u2netp")
    manifest=[]
    thumbnails=[]
    for item in current:
        record=dict(item)
        try:
            photo=source_image(item["image"])
            full,cut,metrics=make(Image.open(photo),session)
            name=item["id"]
            full.save(OUT/(name+".png"),optimize=True)
            cut.save(OUT/(name+"-cutout.png"),optimize=True)
            record.update({"status":"pending_visual_review",
              "sha256_original":hashlib.sha256(photo.read_bytes()).hexdigest(),
              "main_preview":"images/partner-product-design-review/"+name+".png",
              "cutout":"images/partner-product-design-review/"+name+"-cutout.png",
              **metrics})
            thumbnails.append((name,full))
        except Exception as error:
            record.update({"status":"failed_quality_gate","reason":str(error)})
        manifest.append(record)
        print(record["id"],record["status"],record.get("reason",""))
    if thumbnails:
        tw=330
        cols=3
        sheet=Image.new("RGB",(cols*tw,math.ceil(len(thumbnails)/cols)*(tw+40)),
                        (247,244,237))
        pen=ImageDraw.Draw(sheet)
        for i,(name,img) in enumerate(thumbnails):
            xx=i%cols*tw; yy=i//cols*(tw+40)
            sheet.paste(img.resize((tw-12,tw-12),Image.Resampling.LANCZOS),
                        (xx+6,yy+6))
            pen.text((xx+8,yy+tw),name[:35],fill=(30,45,62))
        sheet.save(OUT/"contact-sheet.jpg",quality=91,optimize=True)
    (OUT/"manifest.json").write_text(json.dumps({
      "schema_version":1,"publication_status":"review_only_not_live",
      "rules":["original physical product pixels retained",
               "no packaging redraw, no fake text, no distortion",
               "transparent background cutouts must be reviewed before use"],
      "items":manifest},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    ok=sum(x["status"]=="pending_visual_review" for x in manifest)
    print(f"review previews: {ok}/{len(manifest)}")
    if not ok: raise SystemExit("all cutouts rejected - source photos unchanged")

if __name__=="__main__":
    main()
