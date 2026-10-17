#!/usr/bin/env python3
"""Remove ONLY photo background around already-photographed genuine cartons.

No AI, text generation, repainting, synthesis, false labels or perspective edits.
Source photos remain checked into the repository and are never overwritten.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images/catalog-pure-v20261017"
# Crop boxes are the exact previous approved frame selections. The alpha
# polygons follow the ORIGINAL full exterior of each true retail carton.
IMAGES = {
    "guilu-gao": {
        "source": "images/catalog-clean-studio-v20261016-v5/guilu-gao-main.webp",
        "frame": (0.19, 0.25, 0.80, 0.83),
        "outline": [(185,55), (647,91), (648,111), (530,774), (163,672), (47,226)],
        "file": "guilu-gao-main-framed.webp"
    },
    "royalherb-erzhenbao-64": {
        "source": "images/catalog-corrections-v20261016-v6/royalherb-erzhenbao-64-main.webp",
        "frame": (0.09, 0.23, 0.90, 0.79),
        "outline": [(18,24), (903,50), (825,783), (17,669)],
        "file": "royalherb-erzhenbao-64-main-framed.webp"
    }
}
manifest_file = OUT / "manifest.json"
manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
for pid, spec in IMAGES.items():
    source = ROOT / spec["source"]
    if not source.is_file():
        raise ValueError("Missing approved genuine source photo for " + pid)
    src = Image.open(source).convert("RGB")
    w, h = src.size
    frame = tuple(round(x * dim) for x, dim in zip(spec["frame"], (w,h,w,h)))
    img = src.crop(frame).convert("RGBA")
    if pid == "guilu-gao" and img.size != (685,814):
        raise ValueError(f"Unexpected source crop for {pid}: {img.size}")
    if pid == "royalherb-erzhenbao-64" and img.size != (909,786):
        raise ValueError(f"Unexpected source crop for {pid}: {img.size}")
    alpha = Image.new("L", img.size, 0)
    painter = ImageDraw.Draw(alpha)
    painter.polygon(spec["outline"], fill=255)
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))
    img.putalpha(alpha)
    if img.getchannel("A").getpixel((0,0)) != 0:
        raise ValueError("Photo background was not isolated")
    if img.getchannel("A").getpixel((img.width//2,img.height//2)) < 250:
        raise ValueError("Retail box was cut out")
    destination = OUT / spec["file"]
    img.save(destination, "WEBP", quality=100, method=6)
    entry = next((a for a in manifest["items"] if a.get("file")==f"images/catalog-pure-v20261017/{spec['file']}"), None)
    if entry is None:
        raise ValueError("Photo is not approved by the production manifest: " + pid)
    entry["sourceProcessing"] = ("Manual full-package exterior alpha mask on the preserved actual retailer/manufacturer "
                                 "photograph; only background pixels outside the true package outline removed. "
                                 "Do not reconstruct any product area.")
    entry["backgroundRemoved"] = True
    entry["aiProductRedraw"] = False
    entry["backgroundMethod"] = "precise polygon transparency; original retail pixels remain from photographed source"
manifest["version"] = "20261017-authentic-packages-alpha-only-v3"
manifest["mainPhotoProductionRule"] = ("Use only genuine complete box or sealed physical unit, with transparent image background; "
                                        "existing site ivory provides the stage. Never use full DM posters, AI-rendered carton, "
                                        "invented sides, forged backs, unapproved external product or source composition.")
manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print("PASS only backgrounds removed: " + ", ".join(IMAGES))
