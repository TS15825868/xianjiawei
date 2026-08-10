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
CANONICAL_INGREDIENTS = {
    "guilu-gao": ["鹿角萃取物","龜板萃取物","枸杞","紅棗","黃耆","粉光蔘"],
    "guilu-drink-30": ["水","龜板萃取物","鹿角萃取物","粉光蔘","枸杞","紅棗","黃耆"],
    "guilu-drink-180": ["水","龜板萃取物","鹿角萃取物","粉光蔘","枸杞","紅棗","黃耆"],
    "guilu-tangkuai": ["龜板萃取物","鹿角萃取物"],
    "guilu-jiao": ["龜板萃取物","鹿角萃取物"],
    "luerong-fen": ["鹿茸"],
}
PUBLIC_HTML = [
    "index.html","products.html","dm.html","choose.html","combo.html","guide.html","recipes.html","faq.html",
    "brand.html","brand-facts.html","ingredients.html","quality.html","craft.html","knowledge.html","video.html",
    "hanfang-baike.html","sources.html","contact.html","trial.html",
    *[v[3] for v in PRODUCTS.values()],
]

class Links(HTMLParser):
    def __init__(self): super().__init__(); self.hrefs=[]
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href=dict(attrs).get("href")
            if href: self.hrefs.append(href)

def req(ok: bool, message: str):
    if not ok: raise AssertionError(message)
def text(path: str) -> str: return (ROOT / path).read_text(encoding="utf-8")
def check_image_value(pid: str, field: str, value: str):
    req("/images/products-v3/" in value or value.startswith("images/products-v3/"), f"{pid}.{field} 未使用 products-v3 正式原圖")
    req("products-v2" not in value and "dm-final" not in value, f"{pid}.{field} 又回到舊產品圖")

def main():
    # 顧客頁內容與公開邊界先獨立驗證；貼文系統／ERP 不再阻擋官網正式發布。
    subprocess.run([sys.executable, str(ROOT / "tools/validate-public-customer-pages-v20260809.py")], check=True)

    # products-v3 永遠是產品本體原圖權威；products-v4-final 只能做顧客顯示層。
    site_authority=text("site-product-data-authority.js")
    req("images/products-v3/" in site_authority, "官網缺少 products-v3 正式產品原圖權威")
    req("images/products-v4-final/" in site_authority, "官網缺少核准顧客顯示層")
    req("officialImagePolicy:'products-v3-authority-original-no-redraw'" in site_authority, "顧客顯示層沒有保留 products-v3 原圖／禁止重畫政策")
    req("customer-display-v4-final-contain-no-crop" in site_authority, "顧客顯示層沒有鎖定 contain/no-crop")
    req("productsV2Use:'legacy-reference-only'" in site_authority, "products-v2 沒有降級為歷史參考")

    data=json.loads(text("data.json")); products=data.get("products") or []
    req(len(products)==6, f"data.json 正式產品必須剛好6項，目前{len(products)}項")
    by_id={p.get("id"):p for p in products}
    for pid,(name,spec,filename,page) in PRODUCTS.items():
        p=by_id.get(pid); req(bool(p), f"data.json 缺少正式產品 {pid}")
        req(p.get("name")==name or p.get("displayName")==name, f"{pid} 正式名稱錯誤")
        actual=p.get("specification") or p.get("size") or p.get("spec")
        req(actual==spec, f"{pid} 正式規格錯誤：{actual}")
        req(p.get("ingredients")==CANONICAL_INGREDIENTS[pid], f"{pid} 正式成分或成分順序不同步")
        for field in ("image","dmImage","officialOriginalImage"):
            value=str(p.get(field) or ""); req(bool(value), f"{pid}.{field} 缺少正式產品原圖"); check_image_value(pid,field,value)
        for field in ("imageUrl","image_url"):
            if p.get(field): check_image_value(pid,field,str(p[field]))
        if p.get("imagePolicy") is not None: req("contain" in str(p.get("imagePolicy")), f"{pid} 圖片政策未鎖定 contain/no-crop")
        req((ROOT/"images/products-v3"/filename).exists(), f"缺少正式產品原圖：images/products-v3/{filename}")
        page_source=text(page)
        req(f"images/products-v3/{filename}" in page_source, f"{page} 未直接引用正式產品原圖")
        req("products-v2" not in page_source, f"{page} 靜態HTML仍引用 products-v2")

    for rel in PUBLIC_HTML:
        source=text(rel)
        req("products-v2" not in source, f"{rel} 靜態HTML仍引用 products-v2 舊產品圖")
        req("images/dm-final/" not in source, f"{rel} 靜態HTML仍把舊DM當產品正式圖")

    for pid in ("guilu-drink-30","guilu-drink-180"):
        p=by_id[pid]
        req(p.get("fulfillmentType")=="made-to-order-drink", f"{pid} 必須是接單製作龜鹿飲")
        req(p.get("readyStock") is False, f"{pid} 不得標成現貨")
        req(p.get("productionLeadTime")=="5～7個工作天", f"{pid} 製作時間必須是5～7個工作天")
    for pid in ("guilu-gao","guilu-tangkuai","guilu-jiao","luerong-fen"):
        p=by_id[pid]
        req(p.get("fulfillmentType")=="ready-stock", f"{pid} 必須是預先備貨商品")
        req(p.get("readyStock") is True, f"{pid} 現貨狀態不同步")
        req(p.get("productionLeadTime") is None, f"{pid} 不得套用龜鹿飲5～7個工作天")
    gao_usage=by_id["guilu-gao"].get("usage") or []
    req("每日早上及下午各一小匙" in gao_usage, "龜鹿膏正式用法缺少每日早上及下午各一小匙")
    req(not any("每天一次，每次一小匙" in str(x) for x in gao_usage), "龜鹿膏又回到舊的一日一次用法")

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
    trial30=("images/products-v3/guilu-drink-30.jpg" in trial or "images/products-v4-final/guilu-drink-30.svg" in trial)
    trial180=("images/products-v3/guilu-drink-180.jpg" in trial or "images/products-v4-final/guilu-drink-180.svg" in trial)
    req(trial30, "試喝頁主視覺必須使用30cc正式原圖或核准顧客顯示層")
    req(trial180, "試喝頁必須另列180cc正式原圖或核准顧客顯示層")
    if "images/products-v4-final/" in trial:
        req("site-product-data-authority.js" in trial, "試喝頁使用顧客顯示層時必須載入 products-v3 正式原圖權威")
    req("guilu-drink-trial-final-20260808-web.svg" not in trial, "試喝頁不得回退到舊價格／活動歷史圖")
    req("試喝品免費，運費自付" in trial, "試喝頁缺少正式試喝說明")
    req("龜鹿飲30cc小玻璃罐 × 3罐" in trial, "試喝頁試喝份量未鎖定目前正式3罐版本")

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

    site_js=text("site.js"); req("site-formal-v20260809.css" in site_js, "site.js 未載入正式版面CSS")
    formal_css=text("site-formal-v20260809.css"); req("object-fit:contain" in formal_css.replace(" ","").lower(), "正式CSS未鎖定圖片contain")
    print(f"PASS website production release: {len(PUBLIC_HTML)} customer pages, 6 canonical products, products-v3 original authority + approved customer display, ingredients/usage/fulfillment, physical scale, trial, navigation and website-only release boundary validated")

if __name__ == "__main__": main()
