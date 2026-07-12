#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

VERSION = "405.0"
ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = Path("/tmp/approved-website-mascot.zip")
TMP = Path("/tmp/approved-website-mascot")
OUT = ROOT / "images/brand/approved-v405"

SOURCE_TO_DEST = {
    "CCCF7C46-1FB1-47D3-8CC5-4FC209DED7C3.PNG": "home-brand.png",
    "7D2D344F-15E6-4734-A496-06A51CA88E64.PNG": "products-all.png",
    "0B096D87-8251-40D9-8986-F534D69900CD.PNG": "guide-how-to-use.png",
    "1DB73ACE-5051-4E6D-9B60-8914A77BE4EF.PNG": "recipes.png",
    "DCF43E0D-88CF-40C3-8C7D-726A7C252C29.PNG": "combo.png",
    "6FB7E7F6-81D1-45DB-AF35-29B418F22B61.PNG": "brand-story.png",
    "220827BE-A699-4CEE-8E03-93B00460BFC6.PNG": "faq.png",
    "2992D44D-8912-4F3E-A44E-5F19C79CD4A8.PNG": "contact-line.png",
    "F44656F6-DE44-4994-8D86-F0F65B32DBAE.PNG": "product-guilu-gao-100g.png",
    "310D322F-7C23-465A-9B30-721C92739B1A.PNG": "product-guilu-drink-30cc.png",
    "C62F7F09-7C89-4483-BABB-9D1FD2CEEAD6.PNG": "product-guilu-drink-180cc.png",
    "58A23A88-E70D-42E3-AE4D-A8328D868778.PNG": "product-guilu-tangkuai-75g.png",
    "73E8E13D-A347-4DCA-AC1F-5CC855F6C5B9.PNG": "product-guilu-jiao-600g.png",
    "6C25417A-4CE0-4B14-B602-47F553F0EC01.PNG": "product-luerong-fen-75g.png",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc" if bold else "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJKtc-Bold.otf" if bold else "/usr/share/fonts/opentype/noto/NotoSansCJKtc-Regular.otf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def extract_sources() -> dict[str, Path]:
    if not ZIP_PATH.exists():
        raise SystemExit(f"missing source archive: {ZIP_PATH}")
    shutil.rmtree(TMP, ignore_errors=True)
    TMP.mkdir(parents=True)
    with zipfile.ZipFile(ZIP_PATH) as zf:
        zf.extractall(TMP)
    found = {p.name: p for p in TMP.rglob("*.PNG") if "__MACOSX" not in p.parts}
    missing = sorted(set(SOURCE_TO_DEST) - set(found))
    if missing:
        raise SystemExit(f"missing approved originals: {missing}")
    return found


def install_originals(found: dict[str, Path]) -> None:
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir(parents=True)
    for src_name, dest_name in SOURCE_TO_DEST.items():
        src = found[src_name]
        with Image.open(src) as image:
            if image.size != (1448, 1086):
                raise SystemExit(f"invalid size {src_name}: {image.size}")
        shutil.copy2(src, OUT / dest_name)


def build_choose() -> None:
    source = Image.open(OUT / "products-all.png").convert("RGB")
    w, h = 1448, 1086
    canvas = Image.new("RGB", (w, h), "#f5ead7")
    draw = ImageDraw.Draw(canvas)
    for y in range(h):
        t = y / (h - 1)
        c1, c2 = (248, 240, 224), (229, 208, 174)
        c = tuple(round(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
        draw.line((0, y, w, y), fill=c)

    # New dedicated composition: only the approved mascot crop is reused; no product package is present.
    mascot = source.crop((980, 70, 1448, 1086)).resize((455, 985), Image.Resampling.LANCZOS)
    mask = Image.new("L", mascot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, mascot.width - 1, mascot.height - 1), 48, fill=255)
    shadow = Image.new("RGBA", (510, 1030), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((24, 24, 490, 1010), 52, fill=(70, 45, 25, 75))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.paste(shadow.convert("RGB"), (914, 28))
    canvas.paste(mascot, (938, 48), mask)

    navy, red, brown = "#0b1f3b", "#8b2e24", "#5f402a"
    draw.rounded_rectangle((72, 58, 870, 188), 28, fill="#fffaf0", outline="#c79e62", width=3)
    draw.text((110, 73), "怎麼選", font=font(72, True), fill=navy)
    draw.text((110, 151), "依日常使用方式，選擇適合的產品型態", font=font(27), fill=brown)

    cards = [
        ("固定日常取用", "龜鹿膏", "小匙取用或熱水化開"),
        ("方便即飲", "龜鹿飲", "30cc玻璃瓶或180cc鋁袋"),
        ("沖泡或燉湯", "龜鹿湯塊・龜鹿膠", "熱水、保溫壺或家常湯品"),
        ("自行搭配調飲", "鹿茸粉", "溫開水、牛奶或豆漿"),
    ]
    y = 235
    for idx, (title, product, desc) in enumerate(cards, 1):
        draw.rounded_rectangle((72, y, 870, y + 166), 26, fill="#fffdf8", outline="#d6b47d", width=3)
        draw.ellipse((98, y + 38, 178, y + 118), fill=red)
        number = str(idx)
        box = draw.textbbox((0, 0), number, font=font(36, True))
        draw.text((138 - (box[2] - box[0]) / 2, y + 78 - (box[3] - box[1]) / 2), number, font=font(36, True), fill="white")
        draw.text((205, y + 26), title, font=font(36, True), fill=navy)
        draw.text((205, y + 77), product, font=font(30, True), fill=red)
        draw.text((205, y + 120), desc, font=font(23), fill=brown)
        y += 184

    draw.rounded_rectangle((72, 985, 870, 1050), 20, fill=navy)
    footer = "產品包裝、規格與外觀，請以官網真實產品原圖為準"
    box = draw.textbbox((0, 0), footer, font=font(24, True))
    draw.text(((72 + 870 - (box[2] - box[0])) / 2, 999), footer, font=font(24, True), fill="white")
    canvas.save(OUT / "choose.png", "PNG", optimize=True)


def write_assets() -> None:
    (ROOT / "approved-mascot-v405.js").write_text(r'''"use strict";
(() => {
  const VERSION = "405.0";
  const ROOT = "images/brand/approved-v405/";
  const CORE = {
    home: ["home-brand.png", "首頁品牌主視覺", "品牌入口與全系列陪伴"],
    products: ["products-all.png", "產品總覽", "全系列產品與規格比較"],
    choose: ["choose.png", "怎麼選", "依使用方式選擇產品型態"],
    combo: ["combo.png", "套餐搭配", "依需求搭配料理與日常使用"],
    guide: ["guide-how-to-use.png", "怎麼使用", "五種使用方式一次整理"],
    recipes: ["recipes.png", "料理搭配", "燉湯、熱飲與日常料理"],
    brand: ["brand-story.png", "品牌故事", "從萬華開始的四代工序"],
    faq: ["faq.png", "常見問題", "產品、使用、購買與配送整理"],
    contact: ["contact-line.png", "聯絡我們", "加入官方 LINE 與門市服務"]
  };
  const PRODUCTS = {
    "product-guilu-gao.html": ["product-guilu-gao-100g.png", "龜鹿膏100g情境介紹"],
    "product-guilu-drink-30cc.html": ["product-guilu-drink-30cc.png", "龜鹿飲30cc情境介紹"],
    "product-guilu-drink-180cc.html": ["product-guilu-drink-180cc.png", "龜鹿飲180cc鋁袋情境介紹"],
    "product-guilu-tangkuai.html": ["product-guilu-tangkuai-75g.png", "龜鹿湯塊75g情境介紹"],
    "product-guilu-jiao.html": ["product-guilu-jiao-600g.png", "龜鹿膠600g情境介紹"],
    "product-luerong-fen.html": ["product-luerong-fen-75g.png", "鹿茸粉75g情境介紹"]
  };
  function scene(file, eyebrow, title, extraClass = "") {
    const section = document.createElement("section");
    section.id = "approved-mascot-scene";
    section.className = `section approved-mascot-scene ${extraClass}`;
    section.innerHTML = `<article class="card approved-mascot-card reveal"><img src="${ROOT}${file}?v=${VERSION}" alt="${title}" width="1448" height="1086" loading="lazy" decoding="async"><div class="approved-mascot-copy"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div></article>`;
    return section;
  }
  function render() {
    document.querySelectorAll("#mascot-guide,#approved-mascot-scene").forEach(node => node.remove());
    const page = document.body?.dataset?.page || "";
    if (page === "home") {
      const cfg = CORE.home;
      const image = document.querySelector(".home-story-main .story-photo");
      if (image) {
        image.src = `${ROOT}${cfg[0]}?v=${VERSION}`;
        image.alt = cfg[1];
        image.width = 1448;
        image.height = 1086;
        image.classList.add("approved-home-mascot");
      }
      return;
    }
    if (CORE[page]) {
      const cfg = CORE[page];
      const hero = document.querySelector("main .hero");
      if (hero) hero.insertAdjacentElement("afterend", scene(cfg[0], cfg[1], cfg[2], `approved-mascot--${page}`));
      return;
    }
    const filename = location.pathname.split("/").pop() || "";
    if (PRODUCTS[filename]) {
      const cfg = PRODUCTS[filename];
      const hero = document.querySelector(".product-detail-hero");
      if (hero) hero.insertAdjacentElement("afterend", scene(cfg[0], "仙加味小老闆產品情境", cfg[1], "approved-mascot--product"));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, {once: true});
  else render();
})();
''', encoding="utf-8")

    (ROOT / "site-v405.css").write_text('''/* v405.0：核准原圖完整呈現，不裁切、不變形；產品原圖仍由 products-v3 提供。 */
#mascot-guide { display: none !important; }
.approved-mascot-card { overflow: hidden; padding: 0; }
.approved-mascot-card > img { width: 100%; height: auto; aspect-ratio: 1448 / 1086; object-fit: contain; display: block; background: #efe2cc; }
.approved-mascot-copy { padding: 22px 26px 26px; }
.approved-mascot-copy h2 { margin: 4px 0 0; }
.home-story-main .approved-home-mascot { width: 100%; height: auto; aspect-ratio: 1448 / 1086; object-fit: contain; object-position: center; transform: none !important; display: block; }
.approved-mascot--product { padding-top: 24px; }
@media (max-width: 760px) { .approved-mascot-copy { padding: 18px; } .approved-mascot-card > img, .home-story-main .approved-home-mascot { transform: none !important; } }
''', encoding="utf-8")

    (ROOT / "site.js").write_text('''"use strict";
// v405.0：只載入一套官網核心與一套核准小老闆素材，避免重複。
document.write('<link rel="stylesheet" href="site-v321.css?v=405.0" data-site-version="405.0">');
document.write('<link rel="stylesheet" href="site-v405.css?v=405.0" data-approved-mascot-version="405.0">');
document.write('<script src="site-core.js?v=405.0"><\\/script>');
document.write('<script src="approved-mascot-v405.js?v=405.0"><\\/script>');
''', encoding="utf-8")
    (ROOT / "site-fix-v317.js").write_text('"use strict";\n// v405.0：舊版小老闆自動插入停用。\n', encoding="utf-8")


def update_pages_and_manifests() -> None:
    for page in ROOT.glob("*.html"):
        text = page.read_text(encoding="utf-8")
        text = re.sub(r'(site\.css\?v=)[^"\']+', rf'\g<1>{VERSION}', text)
        text = re.sub(r'(site-v321\.css\?v=)[^"\']+', rf'\g<1>{VERSION}', text)
        text = re.sub(r'(site\.js\?v=)[^"\']+', rf'\g<1>{VERSION}', text)
        if page.name == "index.html":
            text = re.sub(r'src="images/brand/[^"?]+(?:\?v=[^"]+)?"(?= class="story-photo)', f'src="images/brand/approved-v405/home-brand.png?v={VERSION}"', text)
            text = text.replace("https://ts15825868.github.io/xianjiawei/images/brand/scene-brand-all.svg?v=403.1", "https://ts15825868.github.io/xianjiawei/images/logo.png")
        page.write_text(text, encoding="utf-8")

    manifest = {
        "version": VERSION,
        "source": "網站專用小老闆圖(1).zip approved originals",
        "imagePolicy": "14 approved originals shown in full; no crop, redraw or shape change",
        "productPhotoSource": "images/products-v3",
        "corePageMap": {
            "home": "home-brand.png", "products": "products-all.png", "choose": "choose.png",
            "combo": "combo.png", "guide": "guide-how-to-use.png", "recipes": "recipes.png",
            "brand": "brand-story.png", "faq": "faq.png", "contact": "contact-line.png",
        },
        "productPageMap": {
            "product-guilu-gao.html": "product-guilu-gao-100g.png",
            "product-guilu-drink-30cc.html": "product-guilu-drink-30cc.png",
            "product-guilu-drink-180cc.html": "product-guilu-drink-180cc.png",
            "product-guilu-tangkuai.html": "product-guilu-tangkuai-75g.png",
            "product-guilu-jiao.html": "product-guilu-jiao-600g.png",
            "product-luerong-fen.html": "product-luerong-fen-75g.png",
        },
        "contentOnlyPages": ["dm", "video", "knowledge", "hanfang-baike", "sources"],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "deploy-version.json").write_text(json.dumps({
        "version": VERSION,
        "updated": "2026-07-12",
        "mascot": "approved-14-originals-plus-dedicated-choose",
        "productSource": "images/products-v3",
        "productTransform": "none",
        "duplicateVisibleScene": False,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def cleanup_old() -> None:
    shutil.rmtree(ROOT / "images/brand/mascot-v404", ignore_errors=True)
    for path in [ROOT / "mascot-v404.js", ROOT / "site-v404.css", ROOT / "RUN_APPROVED_14_V405.txt", ROOT / ".github/workflows/install-approved-14-v405.yml"]:
        if path.exists():
            path.unlink()


def audit() -> None:
    pngs = list(OUT.glob("*.png"))
    if len(pngs) != 15:
        raise SystemExit(f"expected 15 scene files, got {len(pngs)}")
    for path in pngs:
        with Image.open(path) as image:
            if image.size != (1448, 1086):
                raise SystemExit(f"invalid output size: {path} {image.size}")
    data = (ROOT / "data.json").read_text(encoding="utf-8")
    required = [
        "images/products-v3/guilu-gao.jpg", "images/products-v3/guilu-drink-30.jpg",
        "images/products-v3/guilu-drink-180.jpg", "images/products-v3/guilu-tangkuai.jpg",
        "images/products-v3/guilu-jiao.jpg", "images/products-v3/luerong-fen.jpg",
    ]
    missing = [item for item in required if item not in data]
    if missing:
        raise SystemExit(f"real product images missing from data.json: {missing}")


def main() -> None:
    found = extract_sources()
    install_originals(found)
    build_choose()
    write_assets()
    update_pages_and_manifests()
    cleanup_old()
    audit()
    print("approved mascot v405.0 installation complete")


if __name__ == "__main__":
    main()
