#!/usr/bin/env python3
"""Make branded-neutral scenic *backgrounds* behind original photo pixels only.

Public selection is data-driven from current approved masters. Product boxes,
bottles, seals, writing, labels, and photographed shadows are NEVER generated,
retouched, or relabeled. New public items enter only after master approval.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "images" / "catalog-neutral-scenes-v20261016"
SCENE = ROOT / "images" / "brand" / "world-landscape-v20261008.webp"
SIZE = 1000
GOLD = (167, 132, 79, 150)
PUBLIC_ROOTS = (
    ROOT / "images" / "product-main",
    ROOT / "images" / "partner-products",
)

def load(filename):
    return json.loads((ROOT / filename).read_text(encoding="utf-8"))

def safe_photo(relative):
    plain = relative.split("?", 1)[0]
    path = (ROOT / plain).resolve()
    if not any(path.is_relative_to(base.resolve()) for base in PUBLIC_ROOTS):
        raise ValueError("Product photo outside approved asset library: " + plain)
    if not path.is_file() or path.suffix.lower() not in {".webp", ".png"}:
        raise ValueError("Need actual transparent physical product photo: " + plain)
    return path

def active_images():
    own = load("public-product-master.json")["products"]
    own_media = load("data.json")["products"]
    own_lookup = {p["id"]: p for p in own_media}
    partner = load("partner-catalog.json")["products"]
    out = []
    for p in own:
        entry = own_lookup.get(p["id"])
        if not entry:
            raise ValueError("Approved self product missing its media: " + p["id"])
        out.append({"id": p["id"], "name": p["name"], "path": entry["image"], "role": "public-card"})
    public = [p for p in partner if p.get("public") is True]
    for p in public:
        out.append({"id": p["id"], "name": p["name"], "path": p["image"], "role": "public-card"})
    public_groups = {p["id"] for p in public if p.get("variants")}
    for p in partner:
        if p.get("public") is not True and p.get("groupedIn") in public_groups:
            out.append({"id": p["id"], "name": p["name"], "path": p["image"], "role": "grouped-tea-detail"})
    if len({item["id"] for item in out}) != len(out):
        raise ValueError("Product identifier duplicate")
    if len([p for p in out if p["role"] == "public-card"]) != len(own) + len(public):
        raise ValueError("Actual public card count mismatch")
    return out, len(own), len(public)

def background():
    # Reuse the already-approved scenery, which has no new text or branding.
    original = Image.open(SCENE).convert("RGB")
    canvas = ImageOps.fit(original, (SIZE, SIZE), Image.Resampling.LANCZOS, centering=(.53, .47)).convert("RGBA")
    canvas = Image.alpha_composite(canvas, Image.new("RGBA", (SIZE, SIZE), (251, 248, 240, 105)))
    ink = ImageDraw.Draw(canvas)
    ink.rounded_rectangle((33,33,967,967),radius=32,outline=GOLD,width=3)
    ink.rounded_rectangle((43,43,957,957),radius=30,outline=(255,252,244,90),width=2)
    # Soft platform shadow only; NO manufacturer/retailer name printed here.
    return canvas

def build(item):
    path = safe_photo(item["path"])
    photo = ImageOps.exif_transpose(Image.open(path)).convert("RGBA")
    alpha = photo.getchannel("A")
    if alpha.getextrema()[0] > 20 or alpha.getextrema()[1] < 250:
        raise ValueError(f"Not a transparent cutout: {item['id']}")
    bbox = alpha.point(lambda a: 255 if a >= 20 else 0).getbbox()
    if not bbox:
        raise ValueError(f"Empty foreground: {item['id']}")
    photo = photo.crop(bbox)
    # Individual presentation bounds preserve true object proportions.
    # Small 30cc jars are intentionally NOT inflated to large bottles.
    heights = {
        "guilu-drink-30": 530,
        "guilu-drink-180": 665,
        "guilu-gao": 670,
        "luerong-fen": 630,
    }
    max_h = heights.get(item["id"], 660)
    photo.thumbnail((750, max_h), Image.Resampling.LANCZOS)
    px = (SIZE - photo.width)//2
    py = max(100, 810 - photo.height)
    layer = Image.new("RGBA", (SIZE, SIZE))
    shade = Image.new("RGBA", photo.size, (35, 34, 33, 0))
    shade.putalpha(photo.getchannel("A").point(lambda a: round(a * 0.22)))
    layer.alpha_composite(shade, (px + 12, py + 20))
    layer = layer.filter(ImageFilter.GaussianBlur(17))
    result = Image.alpha_composite(background(), layer)
    result.alpha_composite(photo, (px, py))
    return result.convert("RGB"), path, photo.size

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    approved, own_count, partner_count = active_images()
    records=[]
    previews=[]
    for p in approved:
        img, source, size = build(p)
        target=OUTPUT / (p["id"] + ".webp")
        img.save(target, "WEBP", quality=93, method=6)
        records.append({
            "id":p["id"],"name":p["name"],"role":p["role"],
            "image":str(target.relative_to(ROOT)),
            "source":str(source.relative_to(ROOT)),
            "sourceSha256":hashlib.sha256(source.read_bytes()).hexdigest(),
            "outputDimensions":[SIZE,SIZE],
            "transformedForegroundDimensions":list(size),
            "productOriginalPixelsOnly":True,
            "artificialBrandLettering":False,
            "publicationStatus":"visual-review-only",
        })
        mini=img.copy()
        mini.thumbnail((300,300),Image.Resampling.LANCZOS)
        previews.append(mini)
    cols=4
    rows=(len(previews)+cols-1)//cols
    contact=Image.new("RGB",(cols*300,rows*300),(247,244,237))
    for i,mini in enumerate(previews):
        contact.paste(mini,((i%cols)*300,(i//cols)*300))
    contact.save(OUTPUT/"contact-sheet.jpg",quality=90,optimize=True)
    (OUTPUT/"manifest.json").write_text(json.dumps({
       "schemaVersion":1,
       "basis":"current GitHub main official public master plus public partner catalog",
       "status":"review-only-not-replacing-live-product-source",
       "publicOwnCount":own_count, "publicPartnerCount":partner_count,
       "publicCardCount":own_count+partner_count,
       "groupedVariantCount":len(records)-own_count-partner_count,
       "prohibitUnapprovedOrRetiredProducts":True,
       "background":"images/brand/world-landscape-v20261008.webp",
       "backgroundAddsBrandText":False,
       "sourcePackageAltered":False,
       "images":records,
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS scene artwork:",len(records),"of which public cards:",own_count+partner_count)

if __name__ == "__main__":
    main()
