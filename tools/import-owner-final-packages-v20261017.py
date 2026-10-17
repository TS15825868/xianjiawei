#!/usr/bin/env python3
"""仙加味 2026-10-17 使用者指定產品實拍主圖上線工具。
保留真實包裝像素；去除相連的白色攝影背景；其他丹參茶僅矯正既有實拍角度。
不得重畫、補寫或憑空產生原廠產品資訊。
"""
from pathlib import Path
import hashlib
import io
import json
import re
import urllib.request

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "ops/owner-approved-nine-packages-20261017.json").read_text(encoding="utf-8"))
OUTDIR = ROOT / "images/catalog-owner-final-v20261017"
OUTDIR.mkdir(parents=True, exist_ok=True)
VERSION = "20261017-owner-approved-photo-main-v4"
OLD_VERSION = "20261017-pure-product-v1"
REPLACEMENTS = {}
REPORT = {"version": VERSION, "photoOriginals": {}, "fiveTeaRectifications": [], "updatedFiles": []}

def download_original(url, expected_sha):
    req = urllib.request.Request(url, headers={"User-Agent": "Xianjiawei-photo-import/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        data = response.read(4 * 1024 * 1024)
    sha = hashlib.sha256(data).hexdigest()
    if sha != expected_sha:
        raise ValueError("Uploaded JPEG SHA256 mismatch: {} != {}".format(sha,expected_sha))
    return data

def real_package_cutout(jpeg):
    photo = np.array(Image.open(io.BytesIO(jpeg)).convert("RGB"))
    h, w = photo.shape[:2]
    if min(h, w) < 900:
        raise ValueError("Source photo too small to publish")
    minchannel = photo.min(axis=2).astype(np.int16)
    maxchannel = photo.max(axis=2).astype(np.int16)
    near_white = ((minchannel > 235) & ((maxchannel - minchannel) < 20)).astype(np.uint8)
    _count, labels, _stats, _centroids = cv2.connectedComponentsWithStats(near_white, connectivity=8)
    boundary = np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    background = np.isin(labels, np.unique(boundary)).astype(np.uint8)
    alpha = (1 - background) * 255
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (3,3), 0.5)
    if float(np.mean(alpha < 8)) < 0.15:
        raise ValueError("Background was not reliably separated from product")
    rgba = np.dstack([photo,alpha]).astype(np.uint8)
    return Image.fromarray(rgba,"RGBA")

def write_main(photo, dest):
    dest.parent.mkdir(parents=True,exist_ok=True)
    photo.save(dest, "WEBP", quality=92, method=6)
    out = Image.open(dest)
    assert out.mode == "RGBA" and out.getbbox() is not None
    assert out.getbbox()[0] >= 0 and out.getbbox()[2] <= out.width
    return hashlib.sha256(dest.read_bytes()).hexdigest()

for product_id, info in CONFIG["photos"].items():
    data = download_original(info["url"], info["sha256"])
    dest = OUTDIR / (product_id + "-main.webp")
    image = real_package_cutout(data)
    published_sha = write_main(image,dest)
    old = info["from"]
    new = dest.relative_to(ROOT).as_posix()
    REPLACEMENTS[old] = new
    REPORT["photoOriginals"][product_id] = {
        "sourceSha256": info["sha256"], "image": new,
        "publishedSha256": published_sha,
        "method": "owner-provided photographed package, background-only white flood segmentation"
    }
    print("IMPORTED:",product_id,new,"size",dest.stat().st_size,flush=True)

# Existing original fronts: rectify actual photographed plane only, no new packaging graphics.
# Four source corners are normalized to image coordinates, in clockwise order.
TEA_CORNERS = {
    "tea-leisure": [[.005,.005],[.99,.082],[.996,.947],[.002,.995]],
    "tea-wudahan": [[.005,.006],[.995,.055],[.996,.954],[.003,.998]],
    "tea-fiber": [[.008,.007],[.988,.075],[.994,.993],[.003,.996]],
    "tea-white": [[.006,.006],[.995,.040],[.993,.987],[.004,.995]],
    "tea-refresh": [[.052,.006],[.998,.071],[.987,.958],[.053,.994]],
}
for slug, corners in TEA_CORNERS.items():
    old = "images/catalog-pure-v20261017/" + slug + "-main.webp"
    src = ROOT / old
    if not src.is_file(): raise FileNotFoundError(old)
    im = np.asarray(Image.open(src).convert("RGBA"))
    h, w = im.shape[:2]
    source_pts = np.float32([[x*w,y*h] for x,y in corners])
    dest_pts = np.float32([[129,75],[1125,75],[1125,1175],[129,1175]])
    matrix = cv2.getPerspectiveTransform(source_pts, dest_pts)
    flat = cv2.warpPerspective(im, matrix, (1254,1254), flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    dst = OUTDIR / (slug + "-main.webp")
    sha = write_main(Image.fromarray(flat,"RGBA"),dst)
    REPLACEMENTS[old] = dst.relative_to(ROOT).as_posix()
    REPORT["fiveTeaRectifications"].append({
        "product":slug,"originalSource":old,"straightenedMain":REPLACEMENTS[old],
        "publishedSha256":sha,"method":"geometric perspective correction of same actual photographic box front"})
    print("ALIGNED:", slug, dst.stat().st_size,flush=True)

# Replace only public-facing content and its catalog authority. Keep historical
# manifests, original photos, ERP internals and unpublished entries intact.
scan = list(ROOT.glob("*.html")) + list(ROOT.glob("*.js")) + list(ROOT.glob("*.json")) + list((ROOT/"data").glob("*.json"))
replaced_keys=set()
for path in scan:
    original = path.read_text(encoding="utf-8")
    updated = original
    for old,new in REPLACEMENTS.items():
        if old in updated:
            updated = updated.replace(old,new)
            replaced_keys.add(old)
    # An image path is a new file so old browsers cannot display cached photos,
    # but refresh core runtime tags in public-facing entrypoints too.
    if path.parent == ROOT and (path.suffix in (".html",".js") or path.name in ("catalog-public.json","data.json","partner-catalog.json")):
        updated = updated.replace(OLD_VERSION,VERSION)
    if path.suffix == ".html" and 'data-page="product-detail"' in updated:
        script = '<script defer src="site-image-lightbox-v20261017.js?v='+VERSION+'"></script>'
        if 'site-image-lightbox-v20261017.js' not in updated:
            updated = updated.replace("</body>",script+"</body>")
    if original != updated:
        path.write_text(updated,encoding="utf-8")
        REPORT["updatedFiles"].append(path.relative_to(ROOT).as_posix())
if set(REPLACEMENTS) != replaced_keys:
    raise RuntimeError("Some images never referenced: "+repr(sorted(set(REPLACEMENTS)-replaced_keys)))
# Confirm critical entrypoints, product cards and detail pages all use the new nine.
hero_pages = {
 "guilu-gao":"product-guilu-gao.html",
 "guilu-drink-30":"product-guilu-drink-30cc.html",
 "guilu-drink-180":"product-guilu-drink-180cc.html",
 "luerong-fen":"product-luerong-fen.html",
 "jinan-sisheng-siwuyin":"product-jinan-siwuyin.html",
 "danshen-tea-collection":"product-danshen-tea.html",
 "guilu-vitality":"product-guilu-vitality.html",
 "uboss-sizhenbao":"product-four-treasures.html",
 "royalherb-erzhenbao-64":"product-er-zhen-bao.html"
}
index = (ROOT/"index.html").read_text(encoding="utf-8")
listing = (ROOT/"products.html").read_text(encoding="utf-8")
authority = (ROOT/"site-product-media-authority.js").read_text(encoding="utf-8")
for id,page in hero_pages.items():
    main = "images/catalog-owner-final-v20261017/"+id+"-main.webp"
    for fname,content in [("index.html",index),("products.html",listing),(page,(ROOT/page).read_text(encoding="utf-8")),("media-authority",authority)]:
        if main not in content:
            raise AssertionError(fname+" still lacks final user-approved photo for "+id)
for slug in TEA_CORNERS:
    path="images/catalog-owner-final-v20261017/"+slug+"-main.webp"
    if path not in (ROOT/"product-danshen-tea.html").read_text(encoding="utf-8"):
        raise AssertionError("tea detail missing "+path)
for page in hero_pages.values():
    if "site-image-lightbox-v20261017.js" not in (ROOT/page).read_text(encoding="utf-8"):
        raise AssertionError("Missing image viewer at "+page)
# Store release evidence; don't suggest that dynamic LINE/ERP D1 was updated.
(ROOT/"data/owner-final-product-photo-release-v20261017.json").write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("PASS 9 original product mains + 5 corrected tea fronts + 9 accessible photo viewers")
print("UPDATED:",len(REPORT["updatedFiles"]), "documents")
