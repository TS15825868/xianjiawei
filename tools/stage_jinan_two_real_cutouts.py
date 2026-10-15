#!/usr/bin/env python3
"""Clean two Jinan product images with source-photo pixels only, review before release."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageChops
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"images/partner-products"
DEST=SOURCE/"cutouts-v20261016"
DEST.mkdir(parents=True,exist_ok=True)
REVIEW=ROOT/"images/partner-product-design-review"
REVIEW.mkdir(parents=True,exist_ok=True)

def save_image(im,name):
    im.thumbnail((900,900),Image.Resampling.LANCZOS)
    if im.mode!="RGBA" or im.getchannel("A").getextrema()!=(0,255):
        raise ValueError(f"Not a real alpha cutout: {name}")
    namepath=DEST/name
    im.save(namepath,"WEBP",lossless=True,method=6,exact=True)
    checked=Image.open(namepath)
    if checked.mode!="RGBA" or checked.getchannel("A").getextrema()!=(0,255):
        raise ValueError(f"Lossless cutout alpha corrupted: {name}")
    return namepath, im

def strip_background_siwuyin():
    file=SOURCE/"jinan-siwuyin-front.jpg"
    im=ImageOps.exif_transpose(Image.open(file)).convert("RGBA")
    w,h=im.size
    if not 1.15 < w/h < 1.55:
        raise ValueError(f"Unexpected four-herb package dimensions {w}x{h}")
    # Polygon traces the visible real bag only. The supplier photograph already
    # crops its upper handle and bottom edge; no new pixels are synthesized.
    vertices=[(142,0),(1354,0),(1360,70),(1264,1108),(171,1108),(142,75)]
    mask=Image.new("L",(w,h),0)
    pts=[(round(x*w/1477),round(y*h/1108)) for x,y in vertices]
    ImageDraw.Draw(mask).polygon(pts,fill=255)
    # one-pixel edge feather, RGB never altered
    mask=mask.filter(ImageFilter.GaussianBlur(0.5))
    im.putalpha(mask)
    box=mask.getbbox()
    im=im.crop(box)
    out,cut=save_image(im,"jinan-siwuyin-front-cutout.webp")
    return {"id":"jinan-sisheng-siwuyin","file":str(out.relative_to(ROOT)),
      "sourceFile":str(file.relative_to(ROOT)),"sourceSha256":hashlib.sha256(file.read_bytes()).hexdigest(),
      "sourceDimensions":[w,h],"sourcePixelsPreserved":True,"partialHandleInOriginal":True,
      "notice":"Photo itself cuts off the upper bag handles; crop limitations remain visible."},cut

def strip_background_vitality():
    physical=SOURCE/"jinan-vitality-front-original.jpg"
    # Segmentation provided a good silhouette for the actual box and cord,
    # except isolated shop-colour contamination in the first top rows.
    # Reuse only that unchanged-pixel candidate; scrub those top rows.
    intermediate=REVIEW/"guilu-vitality-cutout.png"
    im=Image.open(intermediate).convert("RGBA")
    w,h=im.size
    if not 0.8<w/h<1.3:
        raise ValueError(f"Unexpected candidate dimensions {w}x{h}")
    rgba=im.load()
    # Keep only verified burgundy-coloured physical rope pixels ABOVE the lid.
    # All lower pixels retain original rembg alpha unchanged.
    top=round(44*h/685)
    for y in range(top):
        for x in range(w):
            r,g,b,a=rgba[x,y]
            rope=(150*w/668<x<585*w/668 and r>=70 and
                  r>g*1.70 and r>b*1.43 and g<100 and b<130)
            if not rope:
                rgba[x,y]=(r,g,b,0)
    alpha=im.getchannel("A")
    box=alpha.getbbox()
    if not box: raise ValueError("No vitality foreground after cleanup")
    im=im.crop(box)
    out,cut=save_image(im,"jinan-vitality-front-cutout.webp")
    return {"id":"guilu-vitality","file":str(out.relative_to(ROOT)),
      "sourceFile":str(physical.relative_to(ROOT)),"sourceSha256":hashlib.sha256(physical.read_bytes()).hexdigest(),
      "sourcePixelsPreserved":True,"intermediateMatteFile":str(intermediate.relative_to(ROOT)),
      "notice":"Source-photo segmentation kept; store clutter removed from upper rows using cord-only hue mask."},cut

def main():
    records=[]
    sheet=Image.new("RGB",(1200,670),(247,244,237))
    for i,fn in enumerate((strip_background_siwuyin,strip_background_vitality)):
        info,photo=fn()
        records.append(info)
        thumb=photo.copy()
        thumb.thumbnail((530,565),Image.Resampling.LANCZOS)
        x=i*600+(600-thumb.width)//2;y=(590-thumb.height)//2+15
        sheet.paste(thumb,(x,y),thumb)
    sheet.save(REVIEW/"jinan-two-cutouts-review-20261016.jpg",quality=92,optimize=True)
    (DEST/"manifest.json").write_text(json.dumps({
        "version":"2026-10-16-jinan-two-source-photo-cutouts",
        "status":"review_only_not_live",
        "humanImageReviewRequired":True,
        "noAIPackageRedraw":True,
        "products":records
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"created":len(records),"photos":[r["file"] for r in records]},ensure_ascii=False))
if __name__=="__main__":
    main()
