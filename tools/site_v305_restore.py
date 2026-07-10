from pathlib import Path
import json
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
VERSION = "305.0"

PRODUCT_180 = {
  "id": "guilu-drink-180",
  "series": "仙加味・龜鹿",
  "name": "龜鹿飲180cc鋁袋",
  "displayName": "龜鹿飲180cc鋁袋",
  "size": "180cc／包（鋁袋）",
  "image": "images/products-v3/guilu-drink-180.jpg?v=305.0",
  "gallery": [],
  "dmImage": "images/dm-final/03_guilu-drink-180cc-dm.jpg?v=305.0",
  "description": "180cc鋁袋包裝，把龜鹿膏的成分方向整理成方便即飲的液態型態。適合居家、工作空檔或偏好一次安排較完整份量的人。",
  "ingredients": ["水", "鹿角萃取物", "龜板萃取物", "枸杞", "紅棗", "黃耆", "粉光蔘"],
  "usage": ["撕開包裝即可飲用", "可依個人習慣溫熱後飲用", "開封後請儘速飲用完畢"],
  "storage": ["未開封置於陰涼乾燥處", "避免高溫與日光直射", "開封後請儘速飲用完畢"],
  "fit": "想要較完整即飲份量、居家安排或工作空檔飲用的人",
  "detailImages": ["images/dm-final/03_guilu-drink-180cc-dm.jpg?v=305.0"],
  "priceNote": "價格與優惠請透過官方 LINE 詢問。",
  "detailPage": "product-guilu-drink-180cc.html",
  "purpose": "完整份量即飲食補",
  "purposeDirection": "適合偏好180cc鋁袋、居家安排、工作空檔或想一次飲用較完整份量的人。",
  "page": "product-guilu-drink-180cc.html"
}


def update_data():
    path = ROOT / "data.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    products = [p for p in data.get("products", []) if p.get("id") != "guilu-drink-180"]
    insert_at = next((i + 1 for i, p in enumerate(products) if p.get("id") == "guilu-drink-30"), len(products))
    products.insert(insert_at, PRODUCT_180)
    data["products"] = products

    store = data.setdefault("store", {})
    store["hours"] = "週一至週六 09:30–18:30"
    store["holidayNote"] = "假日如未外出，可提前透過官方 LINE 預約。"
    store["pickupNote"] = "門市自取或假日預約，請先透過官方 LINE 確認時間。"

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_site_js():
    path = ROOT / "site.js"
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"data\.json\?v=[0-9.]+", f"data.json?v={VERSION}", text)
    text = re.sub(r"xianjiawei-scene-([a-z]+)\.jpg\?v=[0-9.]+", rf"xianjiawei-scene-\1.jpg?v={VERSION}", text)
    text = text.replace(
        "龜鹿膏、龜鹿飲30cc、龜鹿湯塊、龜鹿膠與鹿茸粉，各有不同的日常使用情境。",
        "龜鹿膏、龜鹿飲30cc、龜鹿飲180cc鋁袋、龜鹿湯塊、龜鹿膠與鹿茸粉，各有不同的日常使用情境。"
    )
    old = """      <p><strong>官方 LINE：</strong>${SITE_DATA.lineId || '@762jybnm'}</p>\n      <p>${store.pickupNote || '門市自取請先透過官方 LINE 確認取貨時間。'}</p>"""
    new = """      <p><strong>官方 LINE：</strong>${SITE_DATA.lineId || '@762jybnm'}</p>\n      <p><strong>營業時間：</strong>${store.hours || '週一至週六 09:30–18:30'}</p>\n      <p>${store.holidayNote || '假日如未外出，可提前透過官方 LINE 預約。'}</p>\n      <p>${store.pickupNote || '門市自取請先透過官方 LINE 確認取貨時間。'}</p>"""
    if old in text:
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")


def update_css():
    path = ROOT / "site.css"
    text = path.read_text(encoding="utf-8")
    marker = "/* v305｜小老闆完整獨立情境圖 */"
    if marker in text:
        text = text.split(marker)[0].rstrip()
    text += r'''

/* v305｜小老闆完整獨立情境圖 */
.mascot-guide-card__media{background:#f5ede0!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
.mascot-guide-card__media::after{display:none!important;content:none!important}
.mascot-guide-card__media img{display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;object-fit:contain!important;object-position:center!important;opacity:1!important;filter:none!important;mix-blend-mode:normal!important}
.mascot-guide-card{background:linear-gradient(135deg,#fffaf2,#f4ead8)!important}
@media(max-width:760px){.mascot-guide-card__media{height:auto!important;min-height:0!important;aspect-ratio:auto!important}.mascot-guide-card__media img{height:auto!important;aspect-ratio:auto!important}.mascot-guide-card__copy{margin-top:0!important}}
'''
    path.write_text(text + "\n", encoding="utf-8")


def create_180_page():
    src = (ROOT / "product-guilu-drink-30cc.html").read_text(encoding="utf-8")
    replacements = [
        ("龜鹿飲30cc玻璃瓶", "龜鹿飲180cc鋁袋"),
        ("龜鹿飲30cc", "龜鹿飲180cc"),
        ("product-guilu-drink-30cc.html", "product-guilu-drink-180cc.html"),
        ("guilu-drink-30.jpg?v=300.4", "guilu-drink-180.jpg?v=305.0"),
        ("02_guilu-drink-30cc-dm.jpg?v=300.4", "03_guilu-drink-180cc-dm.jpg?v=305.0"),
        ("30cc玻璃小瓶", "180cc鋁袋包裝"),
        ("輕巧即飲食補", "完整份量即飲食補"),
        ("30cc／玻璃瓶", "180cc／鋁袋"),
        ("適合輕巧即飲、外出與工作空檔", "適合居家、工作空檔或偏好一次安排較完整份量"),
        ("想方便即飲、外出攜帶或在工作空檔飲用的人", "想要較完整即飲份量、居家安排或工作空檔飲用的人"),
        ("開瓶即可飲用", "撕開包裝即可飲用"),
        ("開瓶後", "開封後"),
        ("開瓶即飲", "開封即飲"),
        ("30cc適合小瓶體驗、外出與工作空檔；容量較完整，適合想一次安排一份的人。兩者主要差異在容量與使用情境。", "180cc鋁袋適合居家、工作空檔，或偏好一次安排較完整份量的人；與30cc玻璃瓶的主要差異在容量與攜帶方式。"),
        ("30cc怎麼選？", "180cc怎麼選？"),
        ("內容版本 v300.5", "內容版本 v305.0")
    ]
    for old, new in replacements:
        src = src.replace(old, new)
    src = re.sub(r"site\.css\?v=[0-9.]+", f"site.css?v={VERSION}", src)
    src = re.sub(r"site\.js\?v=[0-9.]+", f"site.js?v={VERSION}", src)
    src = src.replace("30cc適合什麼情境？", "180cc適合什麼情境？")
    src = src.replace("適合第一次了解、外出攜帶、工作空檔或想從小規格開始的人。", "適合居家、工作空檔或偏好一次飲用較完整份量的人。")
    (ROOT / "product-guilu-drink-180cc.html").write_text(src, encoding="utf-8")


def update_dm():
    path = ROOT / "dm.html"
    text = path.read_text(encoding="utf-8")
    if "03_guilu-drink-180cc-dm.jpg" not in text:
        marker = '<article class="card reveal"><img class="dm-image-v2" src="images/dm-final/05_guilu-tangkuai-75g-dm.jpg'
        card = '''<article class="card reveal"><img class="dm-image-v2" src="images/dm-final/03_guilu-drink-180cc-dm.jpg?v=305.0" alt="龜鹿飲180cc鋁袋產品用途與DM" loading="lazy" decoding="async"><p class="eyebrow">龜鹿飲</p><h3>龜鹿飲180cc鋁袋</h3><p class="muted">規格：180cc／包（鋁袋）</p><p>即開即飲，也可依個人習慣溫熱後飲用。</p><div class="final-cta__actions"><a class="btn btn-outline dm-lightbox-link" href="images/dm-final/03_guilu-drink-180cc-dm.jpg?v=305.0" data-dm-src="images/dm-final/03_guilu-drink-180cc-dm.jpg?v=305.0">開啟DM圖</a><a class="btn btn-line" data-line-url data-line-message="我要詢問【龜鹿飲180cc鋁袋】" href="https://lin.ee/sHZW7NkR" target="_blank" rel="noopener">我要詢問</a></div></article>\n'''
        if marker in text:
            text = text.replace(marker, card + marker, 1)
    path.write_text(text, encoding="utf-8")


def update_public_html():
    replacements = {
        "五大產品型態與五項規格": "五大產品型態與六項規格",
        "五大產品型態與五項產品規格": "五大產品型態與六項產品規格",
        "龜鹿膏、龜鹿飲30cc、龜鹿湯塊": "龜鹿膏、龜鹿飲30cc與180cc、龜鹿湯塊",
        "龜鹿飲可詢問30cc玻璃瓶與30cc玻璃瓶。30cc適合輕巧即飲、外出與工作空檔；適合偏好較大容量即飲或居家安排的人。": "龜鹿飲可詢問30cc玻璃瓶與180cc鋁袋。30cc適合輕巧攜帶；180cc適合偏好較完整即飲份量或居家安排的人。",
        "30cc玻璃瓶開瓶即可飲用；30cc玻璃瓶開封即可飲用。": "30cc玻璃瓶開瓶即可飲用；180cc鋁袋撕開即可飲用。"
    }
    for path in ROOT.glob("*.html"):
        text = path.read_text(encoding="utf-8")
        for old, new in replacements.items():
            text = text.replace(old, new)
        text = re.sub(r"site\.css\?v=[0-9.]+", f"site.css?v={VERSION}", text)
        text = re.sub(r"site\.js\?v=[0-9.]+", f"site.js?v={VERSION}", text)
        path.write_text(text, encoding="utf-8")


def update_sitemap():
    path = ROOT / "sitemap.xml"
    if not path.exists(): return
    text = path.read_text(encoding="utf-8")
    url = "https://ts15825868.github.io/xianjiawei/product-guilu-drink-180cc.html"
    if url not in text:
        text = text.replace("</urlset>", f"  <url><loc>{url}</loc></url>\n</urlset>")
    path.write_text(text, encoding="utf-8")


def validate():
    data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    ids = [p.get("id") for p in data.get("products", [])]
    assert ids.count("guilu-drink-180") == 1
    assert (ROOT / "images/products-v3/guilu-drink-180.jpg").exists()
    assert (ROOT / "images/dm-final/03_guilu-drink-180cc-dm.jpg").exists()
    assert (ROOT / "product-guilu-drink-180cc.html").exists()
    js = (ROOT / "site.js").read_text(encoding="utf-8")
    assert "週一至週六 09:30–18:30" in js
    assert "object-fit:contain" in (ROOT / "site.css").read_text(encoding="utf-8")


if __name__ == "__main__":
    update_data()
    update_site_js()
    update_css()
    create_180_page()
    update_dm()
    update_public_html()
    update_sitemap()
    validate()
