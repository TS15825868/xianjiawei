#!/usr/bin/env python3
"""Use original photographed cartons. No new package pixels, no invented labels."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
import re

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images/catalog-pure-v20261017"
OUT.mkdir(parents=True, exist_ok=True)
MAPPING = {
    "guilu-gao": ("images/catalog-clean-studio-v20261016-v5/guilu-gao-main.webp", (0.19, 0.25, 0.80, 0.83)),
    "royalherb-erzhenbao-64": ("images/catalog-corrections-v20261016-v6/royalherb-erzhenbao-64-main.webp", (0.09, 0.23, 0.90, 0.79))
}
replacements = {}

for product, (src, frame) in MAPPING.items():
    photo = Image.open(ROOT / src).convert("RGB")
    w, h = photo.size
    crop = tuple(round(d * scale) for d, scale in zip((w, h, w, h), frame))
    # The photographed original carton is fully within the box below, with a small safety margin.
    clipped = photo.crop(crop)
    out = OUT / (product + "-main-framed.webp")
    clipped.save(out, "WEBP", quality=94, method=6)
    replacements[f"images/catalog-pure-v20261017/{product}-main.webp"] = str(out.relative_to(ROOT)).replace("\\", "/")

# Four Treasures: existing real-object cutout mistakenly includes a plastic bag behind
# the outer carton; make pixels above the straight top carton edge transparent.
source = ROOT / "images/partner-product-design-review/uboss-sizhenbao-cutout.png"
box = Image.open(source).convert("RGBA")
w, h = box.size
a = box.getchannel("A")
# Original outer box top sits at about 23% of file height.
# Keep the carton itself including its true red top printed edge.
edge_left = int(h * 0.230)
edge_right = int(h * 0.224)
d = ImageDraw.Draw(a)
d.polygon([(0,0),(w,0),(w,edge_right),(0,edge_left)], fill=0)
box.putalpha(a)
bbox = box.getchannel("A").getbbox()
if bbox is None:
    raise RuntimeError("Original red box photo is unexpectedly empty")
box = box.crop((max(0, bbox[0]-4), max(0,bbox[1]-4), min(w,bbox[2]+4), min(h,bbox[3]+4)))
out = OUT / "uboss-sizhenbao-main-framed.webp"
box.save(out, "WEBP", quality=96, method=6)
replacements["images/catalog-pure-v20261017/uboss-sizhenbao-main.png"] = str(out.relative_to(ROOT)).replace("\\","/")

# Keep each retail object tightly framed, leave the CSS to apply the existing cream
# page background. Preserve old photo sources as audit/rollback candidates.
manifest_path = OUT / "manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
for item in manifest["items"]:
    if item["file"] in replacements:
        old = item["file"]
        item["originalMainBeforeFraming"] = old
        item["file"] = replacements[old]
        item["sourcePreserved"] = True
        item["sourceProcessing"] = "No new product-pixel painting. Crop existing ivory space, or alpha-mask photographed incidental plastic bag above true carton edge."
        if "uboss-sizhenbao" in old:
            item["source"] = "images/partner-products/four-treasures-front.jpg"
            item["intermediateSource"] = "images/partner-product-design-review/uboss-sizhenbao-cutout.png"
manifest["version"] = "20261017-clean-full-boxes-v2"
manifest["boxPhotoSourceReview"] = {
    "uboss-sizhenbao": "Previously supplied real red box IMG_9834(3).jpeg visually verified; this export generated from the matching existing GitHub original",
    "royalherb-erzhenbao-64": "Previously supplied real purple box IMG_9999.jpeg visually verified; prior verified GitHub original crop used",
    "guilu-gao": "Use the already approved genuine complete carton, not a carton-plus-jar montage"
}
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n", encoding="utf-8")

# Update exactly linked primary photos, not detailed label, inner trays or non-main content.
paths = [*ROOT.glob("*.html"),*ROOT.glob("*.js"),*ROOT.glob("*.json"),*ROOT.glob("data/*.json")]
modified=[]
for path in paths:
    old = path.read_text(encoding="utf-8")
    new=old
    for before, after in replacements.items():
        new = new.replace(before, after)
    if new != old:
        path.write_text(new, encoding="utf-8")
        modified.append(path.name)

# Audit new sources and verify all three truly have the intended output.
audit_file = ROOT / "tools/audit-pure-product-hero.cjs"
audit = audit_file.read_text(encoding="utf-8")
audit = audit.replace('"guilu-gao":["product-guilu-gao.html","webp"]',
                      '"guilu-gao":["product-guilu-gao.html","webp"]')
audit = audit.replace('"uboss-sizhenbao":["product-four-treasures.html","png"]',
                      '"uboss-sizhenbao":["product-four-treasures.html","webp"]')
audit = audit.replace('const expected="images/catalog-pure-v20261017/"+id+"-main."+ext;',
 '''const expected="images/catalog-pure-v20261017/"+id+(["guilu-gao","uboss-sizhenbao","royalherb-erzhenbao-64"].includes(id)?"-main-framed.webp":"-main."+ext);''')
audit_file.write_text(audit,encoding="utf-8")

css = ROOT / "site.css"
with css.open("a",encoding="utf-8") as f:
    f.write("""
/* Complete retail carton main-photo controls - authentic primary image only. */
body[data-page="products"] .product-card[data-product-id="uboss-sizhenbao"] .product-card__img,
body[data-page="products"] .product-card[data-product-id="royalherb-erzhenbao-64"] .product-card__img,
body[data-page="products"] .product-card[data-product-id="guilu-gao"] .product-card__img {
 aspect-ratio: 1 / 1!important;
}
.product-detail-hero__media img[src*="main-framed.webp"],
.product-modal .modal-gallery__item:first-child img[src*="main-framed.webp"] {
 aspect-ratio: 1 / 1!important;
 object-fit: contain!important;
}
""")
print(json.dumps({"images":[str(x.name) for x in OUT.glob("*main-framed.webp")],"updated":modified},ensure_ascii=False))
