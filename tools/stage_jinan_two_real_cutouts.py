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
    source=REVIEW/"guilu-vitality-cutout.png"
    physical=SOURCE/"jinan-vitality-front-original.jpg"
    im=Image.open(source).convert("RGBA")
    w,h=im.size
    if not 0.8 < w/h < 1.3:
        raise ValueError(f"Unexpected vitality matte dimensions {w}x{h}")
    orig_alpha=im.getchannel("A")
    hard=Image.new("L",(w,h),0)
    draw=ImageDraw.Draw(hard)
    # body/lid silhouette on existing rembg foreground; shadows/studio objects
    # beyond source product are excluded. Coordinates scale with matte crop.
    coords=[(0,82),(115,69),(220,64),(350,63),(500,72),(620,104),
           (668,126),(668,485),(565,600),(91,685),(0,385)]
    draw.polygon([(int(x*w/668),int(y*h/685)) for x,y in coords],fill=255)
    # Recover dark burgundy rope pixels ABOVE the actual lid only. This is a
    # selective alpha operation on original photograph pixels, not painting.
    pix=im.load()
    top=int(105*h/685)
    for y in range(top):
      for x in range(w):
        if orig_alpha.getpixel((x,y))<70: continue
        r,g,b,a=pix[x,y]
        xx=x*668/w; yy=y*685/h
        is_rope=(130<xx<595 and yy<100 and r>=64 and r>g*1.75 and r>b*1.44 and g<112 and b<125)
        if is_rope: draw.point((x,y),fill=255)
    finished=ImageChops.multiply(orig_alpha,hard)
    im.putalpha(finished)
    # Keep all true source product bytes beneath alpha; no content painting.
    bounds=finished.getbbox()
    if not bounds: raise ValueError("Empty vitality photo matte")
    im=im.crop(bounds)
    out,cut=save_image(im,"jinan-vitality-front-cutout.webp")
    return {"id":"guilu-vitality","file":str(out.relative_to(ROOT)),
      "sourceFile":str(physical.relative_to(ROOT)),"sourceSha256":hashlib.sha256(physical.read_bytes()).hexdigest(),
      "intermediateMatteFile":str(source.relative_to(ROOT)),"sourcePixelsPreserved":True,
      "notice":"Earlier foreground segmentation artefacts above burgundy rope are manually masked; must visually inspect."},cut

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
