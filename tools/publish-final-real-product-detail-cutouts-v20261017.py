#!/usr/bin/env python3
"""Use ONLY actual photographed product-label pixels for clean public detail images.

This is deterministic alpha masking/cropping, NOT generative product redraw.
Do not alter already approved genuine main photos or unapproved ERP media.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json, hashlib

ROOT=Path(__file__).resolve().parents[1]
SRC="images/catalog-clean-studio-v20261016-v5/"
DST="images/catalog-user-detail-cutouts-v20261017/"
OUT=ROOT/DST
OUT.mkdir(parents=True,exist_ok=True)

# Polygons follow actual edges of the photographed package/label in approved
# 1122x1402 current-main source photos; interior original pixels stay identical.
IMAGES={
"tea-rose-fruit-label-detail.webp":("tea-rose-fruit-original-back.webp",[(247,355),(854,289),(864,1078),(252,995)]),
"tea-leisure-label-detail.webp":("tea-leisure-original-back.webp",[(253,341),(857,261),(862,1019),(250,959)]),
"tea-wudahan-label-detail.webp":("tea-wudahan-original-back.webp",[(251,320),(856,264),(862,1022),(250,968)]),
"tea-fiber-label-detail.webp":("tea-fiber-original-back.webp",[(253,346),(854,257),(863,1016),(248,961)]),
"tea-white-label-detail.webp":("tea-white-original-back.webp",[(253,333),(854,307),(858,1047),(248,968)]),
"tea-refresh-label-detail.webp":("tea-refresh-original-back.webp",[(251,305),(855,269),(859,1034),(250,975)]),
"siwuyin-real-label-detail.webp":("siwuyin-original-back.webp",[(222,269),(877,269),(875,522),(811,1006),(267,973),(224,744)]),
"vitality-real-back-detail.webp":("vitality-original-label-closeup.webp",[(363,328),(787,328),(714,824),(417,822)]),
}
details={}
history=[]
for src,(dest,polygon) in IMAGES.items():
    source=ROOT/SRC/src
    if not source.is_file():raise RuntimeError("Source photo missing: "+str(source))
    orig=Image.open(source).convert("RGBA")
    if orig.size!=(1122,1402):raise RuntimeError("Approved photo dimensions changed: "+src)
    alpha=Image.new("L",orig.size,0)
    ImageDraw.Draw(alpha).polygon(polygon,fill=255)
    alpha=alpha.filter(ImageFilter.GaussianBlur(.58))
    box=alpha.getbbox()
    if box is None:raise RuntimeError("Empty mask: "+src)
    pad=10
    crop=(max(0,box[0]-pad),max(0,box[1]-pad),min(orig.width,box[2]+pad),min(orig.height,box[3]+pad))
    orig.putalpha(alpha)
    image=orig.crop(crop)
    if image.getchannel("A").getextrema()!=(0,255):raise RuntimeError("No transparent background: "+src)
    image.save(OUT/dest,"WEBP",quality=98,method=6)
    detail_src=SRC+src
    detail_dest=DST+dest
    details[detail_src]=detail_dest
    history.append({"file":detail_dest,"originalPhotoSource":detail_src,
       "sourceSHA256":hashlib.sha256(source.read_bytes()).hexdigest(),
       "outputSHA256":hashlib.sha256((OUT/dest).read_bytes()).hexdigest(),
       "processing":"manual original-photo geometry crop and exterior alpha only","noArtificialLabels":True})
manifest={"version":"20261017-official-final-back-label-original-only-v1",
          "visualRule":"Original retail package pixel values retained; product itself never AI generated, painted or geometrically invented",
          "approvedDetailAssets":history}
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
# Update both THUMBNAIL and lightbox links: tapping must not show the older
# messy shooting background after the new clean gallery is rendered.
pages=["product-danshen-tea.html","product-jinan-siwuyin.html","product-guilu-vitality.html"]
all_old_link_replacements={
"images/partner-products/tea-rose-fruit-label-source.jpg":details[SRC+"tea-rose-fruit-label-detail.webp"],
"images/partner-products/tea-danshen-leisure-label-source.jpg":details[SRC+"tea-leisure-label-detail.webp"],
"images/partner-products/tea-wudahan-label-source.jpg":details[SRC+"tea-wudahan-label-detail.webp"],
"images/partner-products/tea-danshen-lotus-label-source.jpg":details[SRC+"tea-fiber-label-detail.webp"],
"images/partner-products/tea-white-danshen-label-source.jpg":details[SRC+"tea-white-label-detail.webp"],
"images/partner-products/tea-danshen-refresh-label-source.jpg":details[SRC+"tea-refresh-label-detail.webp"],
"images/partner-products/jinan-siwuyin-label.jpg":details[SRC+"siwuyin-real-label-detail.webp"],
"images/partner-products/jinan-vitality-label-original.jpg":details[SRC+"vitality-real-back-detail.webp"],
}
for page in pages:
    path=ROOT/page
    s=path.read_text(encoding="utf-8")
    changed=0
    for source,target in {**details,**all_old_link_replacements}.items():
        if source not in s:continue
        # Detail image src and each source-linked zoom control use same true cutout.
        count=s.count(source)
        s=s.replace(source,target)
        changed+=count
    if changed==0:raise RuntimeError("No photo refs replaced in "+page)
    path.write_text(s,encoding="utf-8")
    print("PASS page",page,"references",changed)
# Update only approved current partner products and the six real tea variants.
# Keep historical sourceFiles/originalDetailImages as immutable provenance.
catalog_file=ROOT/"partner-catalog.json"
catalog=json.loads(catalog_file.read_text(encoding="utf-8"))
for p in catalog["products"]:
    if p.get("public") is not True:continue
    if p["id"] in {"jinan-sisheng-siwuyin","danshen-tea-collection","guilu-vitality"}:
        p["detailImages"]=[details.get(u,u) for u in p.get("detailImages",[])]
    for v in p.get("variants",[]):
        v["detailImages"]=[details.get(u,u) for u in v.get("detailImages",[])]
# Tea collection detail album is different from individual tea variant cards.
# The new six label originals must appear once per tea SKU, not 6 shared labels.
if len(next(p for p in catalog["products"] if p["id"]=="danshen-tea-collection")["variants"])!=6:
    raise RuntimeError("Tea collection no longer matches six approved variants")
catalog["version"]="20261017-final-real-packaging-and-detail-photo-v2"
catalog_file.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("PASS 8 true real-label cutouts, 3 public product pages and one source-traced partner catalog")
