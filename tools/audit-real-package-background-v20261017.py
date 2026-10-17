#!/usr/bin/env python3
"""Verify genuine original package as the ONLY current website product hero.

Do not lock a historical product count, frozen SKU version or historical prices.
Read latest approved master catalogs. Genuine product pixels must not be AI-redrawn.
"""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
own=json.loads((ROOT/"public-product-master.json").read_text(encoding="utf-8"))["products"]
partner=json.loads((ROOT/"partner-catalog.json").read_text(encoding="utf-8"))["products"]
own_media=json.loads((ROOT/"data/product-media-authority.json").read_text(encoding="utf-8"))["products"]
source_manifest=json.loads((ROOT/"images/catalog-pure-v20261017/manifest.json").read_text(encoding="utf-8"))
manifest_sources={x.get("file"):x.get("source") for x in source_manifest.get("items",[])}
items=[(p["id"],own_media[p["id"]]["mainImage"]) for p in own]
items += [(p["id"],p["image"]) for p in partner if p.get("public") is True]
# All six grouped tea products need the same genuine unmodified, background-free packs.
items += [(v["id"],v["image"]) for p in partner if p.get("public") is True
          for v in p.get("variants", [])]
errors=[]
for pid,name in items:
    filename=name.split("?",1)[0].lstrip("/")
    photo=ROOT/filename
    if not photo.is_file():
        errors.append(f"{pid}: main image missing {filename}");continue
    if filename.startswith("images/catalog-pure-v20261017/"):
        raw=manifest_sources.get(filename)
        if not raw or not (ROOT/raw).is_file():
            errors.append(f"{pid}: genuine original photo provenance missing");continue
        img=Image.open(photo)
        if img.mode != "RGBA":
            errors.append(f"{pid}: existing photo stage contains an opaque scenic/ivory background");continue
        alpha=img.getchannel("A")
        lo,hi=alpha.getextrema()
        if lo!=0 or hi!=255:
            errors.append(f"{pid}: main package photo not fully isolated from its photographed backdrop")
        if img.width < 330 or img.height < 330:
            errors.append(f"{pid}: image unexpectedly tiny")
        if not img.getbbox():
            errors.append(f"{pid}: completely transparent product")
if errors:
    raise SystemExit("FAIL real-package cutout audit:\n"+"\n".join(errors))
print(f"PASS: all {len(items)} current approved public product hero photos use genuine, traced, transparent package-only assets")
