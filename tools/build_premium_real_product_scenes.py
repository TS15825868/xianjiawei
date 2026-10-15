#!/usr/bin/env python3
"""Review-only premium Hanfang scenes with REAL cutout product photos.

No product generation, font alteration, label rewriting, cropping of key
packaging, fake bottle reconstruction, or background from the source shoot.
The approved transparent photo pixels are preserved and only uniformly scaled.
"""
from __future__ import annotations
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageEnhance

ROOT=Path(__file__).resolve().parents[1]
LANDSCAPE=ROOT/"images/brand/world-landscape-v20261008.webp"
OUT=ROOT/"images/product-background-review-v20261016"
SIZE=1100
# Render ONLY currently approved public cards and their grouped tea variants.
# The list is derived each run: retired or private products never get reused.
TONES = {
    "guilu-drink-180":"cool",
    "jinan-sisheng-siwuyin":"cool",
    "guilu-vitality":"cool",
    "jianfeng-wudahan-tea":"cool",
    "jianfeng-refresh-tea":"cool",
}
OWN_APPROVED_CUTOUT = {
    "guilu-gao":"images/product-cutout-review/guilu-gao.png",
    "guilu-drink-30":"images/product-cutout-review/guilu-drink-30.png",
    "guilu-drink-180":"images/product-cutout-review/guilu-drink-180.png",
    "luerong-fen":"images/product-cutout-review/luerong-fen.png",
}
def products_to_render():
    own=json.loads((ROOT/"public-product-master.json").read_text(encoding="utf-8"))["products"]
    data=json.loads((ROOT/"data.json").read_text(encoding="utf-8"))["products"]
    by_id={p["id"]:p for p in data}
    partners=json.loads((ROOT/"partner-catalog.json").read_text(encoding="utf-8"))["products"]
    approved=[p for p in partners if p.get("public") is True]
    items=[]
    for p in own:
        if p["id"] not in by_id:
            raise ValueError("Active product without official image data: "+p["id"])
        source=OWN_APPROVED_CUTOUT.get(p["id"],by_id[p["id"]]["image"].split("?",1)[0])
        items.append((p["id"],source,TONES.get(p["id"],"warm")))
    for p in approved:
        items.append((p["id"],p["image"].split("?",1)[0],TONES.get(p["id"],"warm")))
    groups={p["id"]:p for p in approved if p.get("variants")}
    grouped_cover={g["image"].split("?",1)[0] for g in groups.values()}
    for p in partners:
        if p.get("public") is not True and p.get("groupedIn") in groups:
            # A group card can stand in for one identical photographed variant.
            # Every other actual package gets its own current-source scene.
            source=p["image"].split("?",1)[0]
            if source not in grouped_cover:
                items.append((p["id"],source,TONES.get(p["id"],"warm")))
    ids=[x[0] for x in items]
    if len(ids)!=len(set(ids)):
        raise ValueError("Duplicate public/variant product media identifiers")
    import re
    index=(ROOT/"products.html").read_text(encoding="utf-8")
    fallback=set(re.findall(r'data-fallback-product="([^"]+)"',index))
    expected={p["id"] for p in own+approved}
    if fallback!=expected:
        raise ValueError("Public catalog list changed; refuse to add removed/hidden products")
    return items, len(expected)

PALETTES={
 "warm":(250,246,237),
 "cool":(236,244,240),
}

def background(tone):
    source=ImageOps.fit(Image.open(LANDSCAPE).convert("RGB"),(SIZE,SIZE),method=Image.Resampling.LANCZOS,centering=(.50,.54))
    source=ImageEnhance.Color(source).enhance(.85)
    source=ImageEnhance.Contrast(source).enhance(1.04)
    wash=Image.new("RGBA",(SIZE,SIZE))
    painter=ImageDraw.Draw(wash)
    r,g,b=PALETTES[tone]
    for y in range(SIZE):
        alpha=int(44+50*math.exp(-((y-465)/350)**2))
        painter.line((0,y,SIZE,y),fill=(r,g,b,alpha))
    source=Image.alpha_composite(source.convert("RGBA"),wash)
    # A nuanced central key light integrates the source photographs in-scene.
    glow=Image.new("RGBA",(SIZE,SIZE))
    painter=ImageDraw.Draw(glow)
    painter.ellipse((240,160,860,900),fill=(255,250,237,88))
    glow=glow.filter(ImageFilter.GaussianBlur(110))
    source=Image.alpha_composite(source,glow)
    strokes=Image.new("RGBA",(SIZE,SIZE))
    d=ImageDraw.Draw(strokes)
    gold=(173,133,69,160)
    d.rounded_rectangle((38,38,SIZE-38,SIZE-38),radius=33,outline=gold,width=3)
    d.rounded_rectangle((51,51,SIZE-51,SIZE-51),radius=26,outline=(255,249,232,120),width=2)
    for corner_x,corner_y,direction_x,direction_y in [(64,64,1,1),(SIZE-64,64,-1,1),(64,SIZE-64,1,-1),(SIZE-64,SIZE-64,-1,-1)]:
        d.line([(corner_x,corner_y+direction_y*60),(corner_x,corner_y),(corner_x+direction_x*60,corner_y)],fill=(170,127,66,124),width=3)
        d.ellipse((corner_x-6,corner_y-6,corner_x+6,corner_y+6),fill=(183,146,85,125))
    # Soft stone podium; matte behind actual product, not an altered package.
    d.ellipse((175,880,925,1015),fill=(67,56,41,29),outline=(156,117,66,63),width=3)
    d.arc((170,884,930,1000),0,180,fill=(238,221,179,124),width=5)
    return Image.alpha_composite(source,strokes)

def render(pid,source_path,tone):
    source=ROOT/source_path
    if not source.is_file():
        raise ValueError("missing authoritative cutout "+source_path)
    original=Image.open(source)
    is_cutout = original.has_transparency_data
    im=ImageOps.exif_transpose(original).convert("RGBA")
    alpha=im.getchannel("A")
    if is_cutout and alpha.getextrema()!=(0,255):
        raise ValueError("unverified alpha for "+source_path)
    fg=alpha.point(lambda x: 255 if x>=26 else 0).getbbox()
    if fg is None: raise ValueError("missing actual product silhouette: "+pid)
    # The exterior is trimmed to alpha only, preserving the whole product.
    cut=im.crop((max(0,fg[0]-2),max(0,fg[1]-2),min(im.width,fg[2]+2),min(im.height,fg[3]+2)))
    cut.thumbnail((790,810),Image.Resampling.LANCZOS)
    x=(SIZE-cut.width)//2
    y=925-cut.height
    if y<45: raise ValueError("product exceeds design safe area "+pid)
    frame=background(tone)
    matte=cut.getchannel("A")
    shadow=Image.new("RGBA",cut.size,(26,34,27,0))
    shadow.putalpha(matte.point(lambda a:round(a*.23)))
    layer=Image.new("RGBA",(SIZE,SIZE))
    layer.alpha_composite(shadow,(x+10,y+22))
    layer=layer.filter(ImageFilter.GaussianBlur(20))
    frame=Image.alpha_composite(frame,layer)
    frame.alpha_composite(cut,(x,y))
    out=OUT/(pid+".webp")
    frame.convert("RGB").save(out,"WEBP",quality=93,method=6)
    return {"id":pid,"source":source_path,"sourceSHA256":hashlib.sha256(source.read_bytes()).hexdigest(),
            "output":str(out.relative_to(ROOT)),"sourceMode":original.mode,
            "sourceWholeProductPreserved":True,"productRedrawn":False,
            "sourceAspectRatioPreserved":True,
            "compositionMode":"transparent-cutout" if is_cutout else "full-original-photograph",
            "requiresBackgroundCleanup":not is_cutout,
            "reviewStatus":"candidate-only" if is_cutout else "candidate-only-needs-background-cleanup"}

def main():
    if not LANDSCAPE.is_file(): raise ValueError("missing approved background image")
    OUT.mkdir(parents=True,exist_ok=True)
    products, public_card_count=products_to_render()
    results=[]
    old_manifest=OUT/"manifest.json"
    previous=json.loads(old_manifest.read_text(encoding="utf-8")) if old_manifest.is_file() else {}
    existing={p["id"]:p for p in previous.get("products",[])}
    contact=Image.new("RGB",(4*320,math.ceil(len(products)/4)*357),(247,244,237))
    pen=ImageDraw.Draw(contact)
    for i,(pid,source,tone) in enumerate(products):
        old=existing.get(pid,{})
        digest=hashlib.sha256((ROOT/source).read_bytes()).hexdigest()
        if (old.get("source")==source and old.get("sourceSHA256")==digest
                and old.get("output") and (ROOT/old["output"]).is_file()):
            record=dict(old)
            record["reusedExistingCandidate"]=True
        else:
            record=render(pid,source,tone)
        results.append(record)
        pic=Image.open(ROOT/record["output"]).convert("RGB")
        contact.paste(pic.resize((306,306),Image.Resampling.LANCZOS),((i%4)*320+7,(i//4)*357+7))
        pen.text(((i%4)*320+12,(i//4)*357+318),pid,fill=(34,48,58))
        print("REVIEW:",pid)
    contact.save(OUT/"contact-sheet.jpg",quality=91,optimize=True)
    (OUT/"manifest.json").write_text(json.dumps({
        "schemaVersion":1,"reviewStatus":"candidate-only-not-linked-to-live-catalog",
        "brand":"仙加味","design":"Real photographed product over approved premium mountain/botanical landscape",
        "strictRule":"Never replace authentic packaging, label, manufacturer, or legal product display with generated text",
        "sceneCount":len(results),"publicCardCount":public_card_count,
        "extraGroupedVariantSceneCount":len(results)-public_card_count,
        "additionalBrandLetteringOnImages":False,
        "sourceProductPixelsUnaltered":True,
        "generationSuccessIsNotVisualApproval":True,
        "needsBackgroundCleanup":[r["id"] for r in results if r.get("requiresBackgroundCleanup")],
        "products":results
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS:",len(results),"real-photo scenic review candidates; public src attributes untouched")

if __name__=="__main__":main()

