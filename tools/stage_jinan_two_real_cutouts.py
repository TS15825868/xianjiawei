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
    # Use the COMPLETE original supplier photo, not the previous rembg mask;
    # that intermediate mask contained shop clutter above the handle.
    physical=SOURCE/"jinan-vitality-front-original.jpg"
    im=ImageOps.exif_transpose(Image.open(physical)).convert("RGBA")
    w,h=im.size
    if not 0.45 < w/h < 0.7:
        raise ValueError(f"Unexpected vitality photo dimensions {w}x{h}")
    # Package edges traced at the source's photographed geometry.
    # Keep original glass/box artwork and dimensions; strip tabletop/photo set.
    ref_w,ref_h=864,1536
    body=[(0,176),(145,172),(300,174),(545,165),(719,187),
          (864,233),(864,322),(736,864),(93,964),(0,355)]
    pts=[(round(x*w/ref_w),round(y*h/ref_h)) for x,y in body]
    mask=Image.new("L",(w,h),0)
    d=ImageDraw.Draw(mask)
    d.polygon(pts,fill=255)
    # In the original photo, the burgundy carrying cord arches above the box.
    # Preserve its original pixels by a tight spatial AND burgundy-hue gate.
    ribbon_gate=Image.new("1",(w,h),0)
    rope_points=[(120,182),(144,140),(198,115),(303,111),
                 (430,133),(552,129),(650,153),(742,193),
                 (780,258),(729,243),(711,201),(616,171),
                 (517,153),(418,153),(300,147),(194,153),(144,192)]
    ImageDraw.Draw(ribbon_gate).polygon([(round(x*w/ref_w),round(y*h/ref_h)) for x,y in rope_points],fill=1)
    rgba=im.load()
    for y in range(min(h,round(185*h/ref_h))):
        for x in range(w):
            if not ribbon_gate.getpixel((x,y)): continue
            r,g,b,a=rgba[x,y]
            if r>=70 and r>g*1.55 and r>b*1.35 and g<120 and b<135:
                d.point((x,y),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(0.55))
    box=mask.getbbox()
    if not box: raise ValueError("Missing vitality foreground")
    im.putalpha(mask)
    im=im.crop(box)
    out,cut=save_image(im,"jinan-vitality-front-cutout.webp")
    return {"id":"guilu-vitality","file":str(out.relative_to(ROOT)),
      "sourceFile":str(physical.relative_to(ROOT)),"sourceSha256":hashlib.sha256(physical.read_bytes()).hexdigest(),
      "sourceDimensions":[w,h],"sourcePixelsPreserved":True,
      "notice":"Manual original-photo silhouette and cord-color mask; no background model or AI packaging."},cut

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
