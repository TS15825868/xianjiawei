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
def background(tone="cream"):
    path=ROOT/"images/brand/world-landscape-v20261008.webp"
    if path.exists():
        base=ImageOps.fit(Image.open(path).convert("RGBA"),(SIZE,SIZE))
        base=Image.alpha_composite(base,Image.new("RGBA",(SIZE,SIZE),(*({"cream":(247,244,237),"warm":(242,231,215),"cool":(221,231,235)}[tone]),196)))
    else:
        base=Image.new("RGBA",(SIZE,SIZE),(*({"cream":(247,244,237),"warm":(242,231,215),"cool":(221,231,235)}[tone]),255))
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

def tone_for_product(cutout):
    """Pick a background whose luminance separates from actual source product pixels."""
    sample=cutout.copy()
    sample.thumbnail((150,150))
    data=[(r,g,b) for r,g,b,a in sample.getdata() if a>=230]
    if len(data)<60:
        raise ValueError("not enough opaque product pixels to assess contrast")
    luminance=sorted(0.2126*r+0.7152*g+0.0722*b for r,g,b in data)
    mid=luminance[len(luminance)//2]
    # Very light packages need a visibly darker cool backdrop;
    # dark products need light warm/cream backdrops.
    if mid>=174: return "cool",round(mid,1)
    if mid<=100: return "cream",round(mid,1)
    return "warm",round(mid,1)

def make(original,session):
    rgb=ImageOps.exif_transpose(original).convert("RGBA")
    w,h=rgb.size
    if min(w,h)<250: raise ValueError("image too small")
    bg_removed=remove(rgb,session=session).convert("RGBA")
    alpha=bg_removed.getchannel("A")
    hard=alpha.point(lambda a:255 if a>=70 else 0)
    box=hard.getbbox()
    if box is None: raise ValueError("empty cutout")
    coverage=sum(hard.histogram()[1:])/(w*h)
    if not 0.025<coverage<0.88:
        raise ValueError(f"alpha segmentation rejected: coverage {coverage:.3f}")
    histogram=alpha.histogram()
    opaque=sum(histogram[236:]) / max(1,sum(histogram[11:]))
    if opaque < 0.82:
        raise ValueError(f"alpha edge/detail quality rejected: opaque fraction {opaque:.3f}")
    # Source pixels from the EXACT original photo, never redraw words/packaging.
    cutout=rgb.copy()
    cutout.putalpha(alpha)
    margin=4
    cutout=cutout.crop((max(0,box[0]-margin),max(0,box[1]-margin),
                       min(w,box[2]+margin),min(h,box[3]+margin)))
    cutout.thumbnail((720,685),Image.Resampling.LANCZOS)
    tone,product_luminance=tone_for_product(cutout)
    x=(SIZE-cutout.width)//2
    y=max(128,847-cutout.height)
    dark=Image.new("RGBA",cutout.size,(24,31,34,0))
    dark.putalpha(cutout.getchannel("A").point(lambda a:int(a*0.21)))
    shadow=Image.new("RGBA",(SIZE,SIZE))
    shadow.alpha_composite(dark,(x+8,y+18))
    shadow=shadow.filter(ImageFilter.GaussianBlur(19))
    image=Image.alpha_composite(background(tone).copy(),shadow)
    image.alpha_composite(cutout,(x,y))
    return image.convert("RGB"),cutout,{"width":w,"height":h,
       "alpha_coverage":round(coverage,4),"opaque_fraction":round(opaque,4),"foreground_box":box,
       "scaled_size":[cutout.width,cutout.height],
       "background_tone":tone,"product_median_luminance":product_luminance}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    # Remove stale first-pass previews if their updated cutout does not pass quality gates.
    for stale in OUT.glob("*.png"): stale.unlink()
    if (OUT/"contact-sheet.jpg").exists(): (OUT/"contact-sheet.jpg").unlink()
    current=sources()
    session=new_session("isnet-general-use")
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
            # Existing visual inspection found unrelated shop scenery in the
            # vitality drink foreground; segmentation metrics cannot detect it.
            # Keep it quarantined even if a later model passes numeric checks.
            needs_cleanup = name == "guilu-vitality"
            record.update({"status":("needs_manual_cleanup" if needs_cleanup else "pending_visual_review"),
              "quality_note":("Previously observed unrelated objects retained above the original product; inspect and clean the real photo without repainting packaging." if needs_cleanup else "Manual product-edge and original-label review required"),
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
               "transparent background cutouts must be reviewed before use",
               "product stays sharp; only backdrop/shadow may be softened",
               "background tone selected to separate actual product color",
               "label legibility and original product edge quality require human review"],
      "items":manifest},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    ok=sum(x["status"]=="pending_visual_review" for x in manifest)
    print(f"review previews: {ok}/{len(manifest)}")
    if not ok: raise SystemExit("all cutouts rejected - source photos unchanged")

if __name__=="__main__":
    main()
