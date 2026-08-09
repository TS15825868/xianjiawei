#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]

PRODUCTS = {
    "guilu-gao": ("龜鹿膏", "100g／罐", "guilu-gao.jpg", "product-guilu-gao.html"),
    "guilu-drink-30": ("龜鹿飲30cc玻璃罐", "30cc／罐（小玻璃罐）", "guilu-drink-30.jpg", "product-guilu-drink-30cc.html"),
    "guilu-drink-180": ("龜鹿飲180cc鋁袋", "180cc／包（鋁袋）", "guilu-drink-180.jpg", "product-guilu-drink-180cc.html"),
    "guilu-tangkuai": ("龜鹿湯塊", "75g／盒｜8塊裝｜每塊約9.375g", "guilu-tangkuai.jpg", "product-guilu-tangkuai.html"),
    "guilu-jiao": ("龜鹿膠", "600g（1斤）／盒｜32塊裝｜每塊約18.75g", "guilu-jiao.jpg", "product-guilu-jiao.html"),
    "luerong-fen": ("鹿茸粉", "75g／罐", "luerong-fen.jpg", "product-luerong-fen.html"),
}

PUBLIC_HTML = [
    "index.html","products.html","dm.html","choose.html","combo.html","guide.html","recipes.html","faq.html",
    "brand.html","brand-facts.html","ingredients.html","quality.html","craft.html","knowledge.html","video.html",
    "hanfang-baike.html","sources.html","contact.html","trial.html",
    *[v[3] for v in PRODUCTS.values()],
]

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.hrefs=[]
    def handle_starttag(self, tag, attrs):
        if tag != "a": return
        href=dict(attrs).get("href")
        if href: self.hrefs.append(href)

def req(ok: bool, message: str):
    if not ok: raise AssertionError(message)

def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")

def check_image_value(pid: str, field: str, value: str):
    req("/images/products-v3/" in value or value.startswith("images/products-v3/"), f"{pid}.{field} 未使用 products-v3 正式原圖")
    req("products-v2" not in value and "dm-final" not in value, f"{pid}.{field} 又回到舊產品圖")

def main():
    subprocess.run([sys.executable, str(ROOT / "tools/validate-public-customer-pages-v20260809.py")], check=True)

    data=json.loads(text("data.json"))
    products=data.get("products") or []
    req(len(products)==6, f"data.json 正式產品必須剛好6項，目前{len(products)}項")
    by_id={p.get("id"):p for p in products}
    for pid,(name,spec,filename,page) in PRODUCTS.items():
        p=by_id.get(pid); req(bool(p), f"data.json 缺少正式產品 {pid}")
        req(p.get("name")==name or p.get("displayName")==name, f"{pid} 正式名稱錯誤")
        actual=p.get("specification") or p.get("size") or p.get("spec")
        req(actual==spec, f"{pid} 正式規格錯誤：{actual}")
        for field in ("image","dmImage","officialOriginalImage"):
            value=str(p.get(field) or "")
            req(bool(value), f"{pid}.{field} 缺少正式產品原圖")
            check_image_value(pid,field,value)
        for field in ("imageUrl","image_url"):
            if p.get(field): check_image_value(pid,field,str(p[field]))
        if p.get("imagePolicy") is not None:
            req("contain" in str(p.get("imagePolicy")), f"{pid} 圖片政策未鎖定 contain/no-crop")
        req((ROOT/"images/products-v3"/filename).exists(), f"缺少正式產品原圖：images/products-v3/{filename}")
        page_source=text(page)
        req(f"images/products-v3/{filename}" in page_source, f"{page} 未直接引用正式產品原圖")
        req("products-v2" not in page_source, f"{page} 靜態HTML仍引用 products-v2")

    p30=json.dumps(by_id["guilu-drink-30"],ensure_ascii=False)
    req(not re.search(r"玻璃瓶|30cc\s*[／/]\s*瓶|瓶裝",p30), "30cc正式母資料又出現瓶／瓶裝")
    req(by_id["guilu-drink-30"].get("knownContainerDimensionsMm")=={"diameter":42,"height":51}, "30cc實際尺寸鎖不是Ø42×H51mm")
    req(by_id["guilu-gao"].get("knownContainerDimensionsMm")=={"width":51,"height":78}, "龜鹿膏100g實際尺寸鎖不是51×78mm")
    ratio=(by_id["guilu-drink-180"].get("aspectRatioWidthToHeight") or {}).get("target")
    req(abs(float(ratio or 0)-0.64)<0.001, "180cc鋁袋寬高比目標不是0.64")
    soup=json.dumps(by_id["guilu-tangkuai"],ensure_ascii=False)
    req(not re.search(r"300\s*g|600\s*g",soup,re.I), "龜鹿湯塊正式母資料又出現300g／600g")

    trial=text("trial.html")
    req("<iframe" not in trial.lower(), "試喝頁不得再用iframe，iPhone Safari曾灰屏")
    req("guilu-drink-trial-final-20260808-web.svg" in trial and "<img" in trial, "試喝頁未使用鎖定正式主圖img")
    req((ROOT/"images/trial/guilu-drink-trial-final-20260808-web.svg").exists(), "正式試喝Web圖不存在")

    publishing=text("publishing-center.html")
    req("xianjiawei-internal.tung314069.workers.dev/publishing.html" in publishing, "候選審核中心未導向獨立貼文系統")
    req("/#posts" not in publishing and "ERP 貼文中心" not in publishing, "候選審核中心又導回ERP貼文路由")
    bridge=text("publishing-center-erp-bridge.js")
    req("/publishing.html" in bridge and "#posts" not in bridge, "候選交接仍導向舊ERP貼文頁")

    broken=[]
    for rel in PUBLIC_HTML:
        parser=Links(); parser.feed(text(rel))
        for href in parser.hrefs:
            h=href.strip()
            if not h or h.startswith(("#","mailto:","tel:","javascript:")): continue
            parsed=urlparse(h)
            if parsed.scheme or parsed.netloc: continue
            target=parsed.path
            if not target or not target.endswith(".html"): continue
            resolved=(ROOT/target.lstrip("/")).resolve()
            if ROOT not in resolved.parents and resolved != ROOT: continue
            if not resolved.exists(): broken.append(f"{rel} → {target}")
    req(not broken, "站內連結目標不存在："+"；".join(broken[:20]))

    site_js=text("site.js")
    req("site-formal-v20260809.css" in site_js, "site.js 未載入正式版面CSS")
    formal_css=text("site-formal-v20260809.css")
    req("object-fit:contain" in formal_css.replace(" ","").lower(), "正式CSS未鎖定圖片contain")

    print(f"PASS website production release: {len(PUBLIC_HTML)} customer pages, 6 products, physical-scale locks, trial, navigation, standalone publishing handoff and no internal-copy leakage validated")

if __name__ == "__main__":
    main()
