from pathlib import Path
import json
import re

from bs4 import BeautifulSoup, Comment
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "images" / "brand"
HERO = ROOT / "images" / "hero" / "home-brand-guilu-series.jpg"
VERSION = "302.0"
REMOVED_ID = "guilu-drink-180"
REMOVED_PAGE = "product-guilu-drink-180cc.html"

REPLACEMENTS = {
    "龜鹿飲30cc或180cc": "龜鹿飲30cc",
    "龜鹿飲 30cc 或 180cc": "龜鹿飲30cc",
    "30cc或180cc": "30cc",
    "30cc 或 180cc": "30cc",
    "30cc與180cc": "30cc",
    "30cc 與 180cc": "30cc",
    "30cc、180cc": "30cc",
    "30cc／180cc": "30cc",
    "龜鹿飲180cc": "龜鹿飲30cc",
    "180cc鋁袋": "30cc玻璃瓶",
}


def replace_public_text(text: str) -> str:
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)
    text = re.sub(r"\s*180\s*cc\s*", "", text, flags=re.I)
    text = text.replace("、、", "、").replace("或或", "或")
    return text


def is_removed_product(value) -> bool:
    if not isinstance(value, dict):
        return False
    probe = " ".join(str(value.get(k, "")) for k in ("id", "slug", "page", "detailPage", "name", "displayName", "spec", "size"))
    probe = probe.lower()
    return REMOVED_ID in probe or REMOVED_PAGE in probe or "180cc" in probe or "180 cc" in probe


def clean_json_value(value):
    if isinstance(value, list):
        out = []
        for item in value:
            if is_removed_product(item):
                continue
            cleaned = clean_json_value(item)
            if isinstance(cleaned, dict):
                for key in ("products", "items", "components"):
                    if key in cleaned and isinstance(cleaned[key], list):
                        cleaned[key] = [x for x in cleaned[key] if not (
                            isinstance(x, dict) and str(x.get("productId", x.get("id", ""))) == REMOVED_ID
                        )]
                if any(key in cleaned for key in ("products", "components")):
                    lists = [cleaned.get(key) for key in ("products", "components") if isinstance(cleaned.get(key), list)]
                    if lists and all(len(x) == 0 for x in lists):
                        continue
            out.append(cleaned)
        return out
    if isinstance(value, dict):
        return {k: clean_json_value(v) for k, v in value.items()}
    if isinstance(value, str):
        return replace_public_text(value)
    return value


def clean_json_files():
    for name in ("data.json", "catalog-public.json"):
        path = ROOT / name
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        cleaned = clean_json_value(data)
        path.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def make_background(size=(960, 1200)):
    if HERO.exists():
        bg = ImageOps.fit(Image.open(HERO).convert("RGB"), size, Image.Resampling.LANCZOS)
        bg = bg.filter(ImageFilter.GaussianBlur(2.2))
        bg = ImageEnhance.Color(bg).enhance(0.78)
        bg = ImageEnhance.Brightness(bg).enhance(0.70)
    else:
        bg = Image.new("RGB", size, (49, 42, 32))
        draw = ImageDraw.Draw(bg)
        for y in range(size[1]):
            t = y / size[1]
            c = (int(58 + 38 * t), int(48 + 28 * t), int(34 + 18 * t))
            draw.line((0, y, size[0], y), fill=c)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, 0, size[0], size[1]), fill=(35, 26, 18, 45))
    d.rounded_rectangle((34, 34, size[0]-34, size[1]-34), radius=34, outline=(212, 175, 55, 120), width=3)
    return Image.alpha_composite(bg.convert("RGBA"), overlay)


def remove_light_background(image: Image.Image) -> Image.Image:
    im = image.convert("RGBA")
    px = im.load()
    w, h = im.size
    corners = [im.getpixel((4, 4)), im.getpixel((w-5, 4)), im.getpixel((4, h-5)), im.getpixel((w-5, h-5))]
    bg = tuple(sum(c[i] for c in corners) / len(corners) for i in range(3))
    alpha = Image.new("L", im.size, 0)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            dist = ((r-bg[0])**2 + (g-bg[1])**2 + (b-bg[2])**2) ** 0.5
            a = 0 if dist < 22 else 255 if dist > 72 else int((dist-22) / 50 * 255)
            ap[x, y] = a
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(alpha)
    bbox = alpha.getbbox()
    return im.crop(bbox) if bbox else im


def paste_subject(scene, subject_path, box):
    subject = remove_light_background(Image.open(subject_path))
    fitted = ImageOps.contain(subject, (box[2]-box[0], box[3]-box[1]), Image.Resampling.LANCZOS)
    x = box[0] + (box[2]-box[0]-fitted.width)//2
    y = box[1] + (box[3]-box[1]-fitted.height)//2
    shadow = Image.new("RGBA", scene.size, (0, 0, 0, 0))
    mask = fitted.getchannel("A").filter(ImageFilter.GaussianBlur(16))
    sh = Image.new("RGBA", fitted.size, (0, 0, 0, 120))
    sh.putalpha(mask)
    shadow.alpha_composite(sh, (x+14, y+18))
    scene.alpha_composite(shadow)
    scene.alpha_composite(fitted, (x, y))


def draw_wood_counter(draw, y=930):
    draw.rounded_rectangle((30, y, 930, 1170), radius=28, fill=(75, 43, 25, 235), outline=(201, 151, 77, 220), width=4)
    draw.line((50, y+60, 910, y+60), fill=(143, 91, 46, 220), width=5)


def generate_scenes():
    BRAND.mkdir(parents=True, exist_ok=True)
    variants = {
        "welcome": (BRAND / "xianjiawei-mascot-wave.jpg", (250, 150, 875, 1125)),
        "products": (BRAND / "xianjiawei-mascot-tray.jpg", (315, 110, 930, 1120)),
        "guide": (BRAND / "xianjiawei-mascot-full.jpg", (390, 145, 930, 1120)),
        "service": (BRAND / "xianjiawei-mascot-thumbs.jpg", (330, 110, 900, 1080)),
        "usage": (BRAND / "xianjiawei-mascot-full.jpg", (355, 130, 915, 1120)),
    }
    for name, (subject_path, box) in variants.items():
        scene = make_background()
        draw = ImageDraw.Draw(scene, "RGBA")
        if name == "guide":
            draw.rounded_rectangle((45, 180, 430, 900), radius=24, fill=(24, 45, 55, 225), outline=(212, 175, 55, 235), width=5)
            for cy, icon in ((310, "leaf"), (505, "cup"), (700, "question")):
                draw.ellipse((100, cy-55, 210, cy+55), outline=(231, 203, 145, 245), width=6)
                draw.line((235, cy, 380, cy), fill=(231, 203, 145, 210), width=5)
                if icon == "leaf":
                    draw.line((135, cy+28, 175, cy-28), fill=(231, 203, 145, 245), width=5)
                    draw.ellipse((150, cy-38, 190, cy-8), outline=(231, 203, 145, 245), width=4)
                elif icon == "cup":
                    draw.rounded_rectangle((125, cy-20, 185, cy+32), radius=10, outline=(231, 203, 145, 245), width=5)
                    draw.arc((176, cy-8, 215, cy+28), 270, 90, fill=(231, 203, 145, 245), width=5)
                else:
                    draw.arc((130, cy-35, 185, cy+20), 200, 520, fill=(231, 203, 145, 245), width=6)
                    draw.ellipse((155, cy+30, 165, cy+40), fill=(231, 203, 145, 245))
        elif name == "service":
            draw_wood_counter(draw, 880)
            draw.rounded_rectangle((60, 650, 300, 820), radius=24, fill=(245, 237, 224, 235), outline=(212, 175, 55, 220), width=4)
            draw.rounded_rectangle((125, 690, 235, 770), radius=24, fill=(39, 179, 86, 245))
            draw.ellipse((150, 715, 210, 755), fill=(255,255,255,245))
            draw.polygon([(188, 752), (210, 770), (205, 744)], fill=(255,255,255,245))
        elif name == "usage":
            draw.rounded_rectangle((55, 720, 340, 1030), radius=26, fill=(245,237,224,230), outline=(212,175,55,220), width=4)
            draw.rounded_rectangle((105, 790, 195, 960), radius=18, fill=(32,55,61,240), outline=(212,175,55,230), width=4)
            draw.rounded_rectangle((220, 850, 300, 930), radius=18, fill=(247,244,234,245), outline=(90,65,40,220), width=4)
            draw.arc((280, 865, 330, 925), 270, 90, fill=(90,65,40,220), width=4)
            for yy in (760, 735, 710):
                draw.arc((210, yy, 320, yy+90), 210, 330, fill=(255,245,220,180), width=5)
        elif name == "products":
            draw.rounded_rectangle((55, 720, 300, 1020), radius=28, fill=(90, 52, 28, 225), outline=(212, 175, 55, 220), width=4)
            for cx, cy, color in ((115,820,(140,45,35,245)), (190,865,(220,190,130,245)), (245,800,(80,110,55,245))):
                draw.ellipse((cx-35, cy-25, cx+35, cy+25), fill=color, outline=(45,35,25,220), width=3)
        paste_subject(scene, subject_path, box)
        if name == "welcome":
            draw.rounded_rectangle((55, 970, 380, 1085), radius=24, fill=(245,237,224,225), outline=(212,175,55,210), width=4)
            draw.ellipse((95, 1007, 135, 1047), fill=(182,29,29,245))
            draw.line((160,1027,335,1027), fill=(47,79,58,220), width=8)
        out = BRAND / f"xianjiawei-scene-{name}.jpg"
        scene.convert("RGB").save(out, quality=84, optimize=True, progressive=True)


def mascot_block():
    return r'''const MASCOT_IMAGES = {
  welcome: 'images/brand/xianjiawei-scene-welcome.jpg?v=302.0',
  products: 'images/brand/xianjiawei-scene-products.jpg?v=302.0',
  guide: 'images/brand/xianjiawei-scene-guide.jpg?v=302.0',
  service: 'images/brand/xianjiawei-scene-service.jpg?v=302.0',
  usage: 'images/brand/xianjiawei-scene-usage.jpg?v=302.0'
};

function renderMascotGuide() {
  const page = document.body?.dataset?.page || '';
  const config = {
    home: {
      image: 'welcome', eyebrow: '歡迎認識仙加味',
      title: '先從你平常想怎麼使用開始',
      text: '依固定安排、方便即飲、沖泡燉湯、家庭規格或自行調飲來比較，找到適合日常節奏的產品型態。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    products: {
      image: 'products', eyebrow: '小老闆帶你看產品',
      title: '不同型態，使用方式也不一樣',
      text: '從龜鹿膏、龜鹿飲30cc、龜鹿湯塊、龜鹿膠到鹿茸粉，依規格、成分與生活情境逐一比較。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="choose.html">怎麼選</a>`
    },
    choose: {
      image: 'guide', eyebrow: '不知道怎麼選？',
      title: '先看使用情境，再決定產品型態',
      text: '固定安排、方便即飲、沖泡燉湯、家庭使用或自行搭配飲品，都可以從平常習慣開始比較。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看全部產品</a>`
    },
    combo: {
      image: 'products', eyebrow: '日常搭配導覽',
      title: '依生活節奏查看搭配組合',
      text: '每組內容、價格、可選組數與活動，都會在正式方案卡中清楚列出。',
      actions: `${lineButton('搭配組合', '搭配組合')}<a class="btn btn-outline" href="products.html">先看產品</a>`
    },
    guide: {
      image: 'usage', eyebrow: '使用方式清楚整理',
      title: '沖泡、即飲與燉湯，都有適合的安排',
      text: '依產品型態查看取用方式、建議時段、搭配方式與保存資訊，讓日常使用更順手。',
      actions: `${lineButton('怎麼使用', '怎麼使用')}<a class="btn btn-outline" href="faq.html">看常見問題</a>`
    },
    recipes: {
      image: 'usage', eyebrow: '料理與熱飲搭配',
      title: '從原本熟悉的飲食方式開始',
      text: '用沖泡、調飲或燉湯的方式，把產品自然放進每天的飲食節奏。',
      actions: `${lineButton('料理搭配', '料理搭配')}<a class="btn btn-outline" href="guide.html">看使用方式</a>`
    },
    video: {
      image: 'guide', eyebrow: '一起看原料與工序',
      title: '用影片認識傳統食補文化',
      text: '從原料、處理方式與日常觀點開始理解；產品資訊仍以仙加味正式頁面為準。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="knowledge.html">看知識內容</a>`
    },
    knowledge: {
      image: 'guide', eyebrow: '食材與日常觀點',
      title: '把傳統資料整理成容易理解的內容',
      text: '內容以食材文化、原料與日常使用觀點為主，不代替醫療診斷或個人體質判斷。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="sources.html">查看資料來源</a>`
    },
    'hanfang-baike': {
      image: 'guide', eyebrow: '漢方資料導覽',
      title: '先了解資料出處，再認識食材文化',
      text: '古籍與藥典內容會標示來源與引用原則，並與產品資訊清楚區分。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="sources.html">資料來源</a>`
    },
    sources: {
      image: 'guide', eyebrow: '資料來源與引用原則',
      title: '來源清楚，內容才看得安心',
      text: '引用古籍、藥典與公開資料時，保留出處、年代與適用範圍，不延伸為產品療效宣稱。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="knowledge.html">回知識館</a>`
    },
    brand: {
      image: 'welcome', eyebrow: '從萬華出發',
      title: '延續四代對原料、工序與信用的重視',
      text: '仙加味把多年累積的經驗整理成清楚的產品資訊與日常使用方式，讓傳統更容易被今天的人理解。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="contact.html">聯絡我們</a>`
    },
    faq: {
      image: 'service', eyebrow: '常見問題一次整理',
      title: '產品差異、使用方式與購買流程',
      text: '先查看常見問題；需要確認規格、數量、配送或付款方式時，再由官方 LINE 協助。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    contact: {
      image: 'service', eyebrow: '官方 LINE 與門市服務',
      title: '歡迎留下想了解的產品與需求',
      text: '提供產品名稱、規格、數量或取貨方式，我們會依實際庫存與安排協助確認。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">先看產品</a>`
    },
    dm: {
      image: 'products', eyebrow: '產品快速整理',
      title: '先掌握產品型態、規格與使用方向',
      text: '快速比較各產品差異，再進入產品頁查看完整成分、使用與保存資訊。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">完整產品頁</a>`
    },
    'product-detail': {
      image: 'products', eyebrow: '產品資訊',
      title: '先看規格、成分與使用方式',
      text: '產品頁以正式標示為準；需要確認價格、數量、活動或出貨時間，可透過官方 LINE 詢問。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="products.html">比較其他產品</a>`
    }
  }[page];

  if (!config || document.getElementById('mascot-guide')) return;
  const hero = document.querySelector('main .hero');
  if (!hero) return;
  const section = document.createElement('section');
  section.id = 'mascot-guide';
  section.className = 'section mascot-guide-section';
  section.innerHTML = `
    <article class="mascot-guide-card reveal">
      <div class="mascot-guide-card__media">
        <img src="${MASCOT_IMAGES[config.image] || MASCOT_IMAGES.welcome}" alt="仙加味小老闆情境導覽" width="960" height="1200" loading="eager" decoding="async">
      </div>
      <div class="mascot-guide-card__copy">
        <p class="eyebrow">${config.eyebrow}</p>
        <h2>${config.title}</h2>
        <p>${config.text}</p>
        <div class="hero-actions">${config.actions}</div>
      </div>
    </article>
  `;
  hero.insertAdjacentElement('afterend', section);
}'''


def patch_site_js():
    path = ROOT / "site.js"
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"const MASCOT_IMAGES = .*?\n\}\n\nfunction renderHome\(\) \{", re.S)
    text, count = pattern.subn(mascot_block() + "\n\nfunction renderHome() {", text, count=1)
    if count != 1:
        raise SystemExit("找不到小老闆導覽區塊")
    text = replace_public_text(text)
    text = text.replace("v=301.0", f"v={VERSION}")
    path.write_text(text, encoding="utf-8")


def patch_css():
    path = ROOT / "site.css"
    text = path.read_text(encoding="utf-8")
    start = "/* v302 mascot scene integration */"
    if start in text:
        text = text.split(start)[0].rstrip() + "\n"
    text += r'''
/* v302 mascot scene integration */
.mascot-guide-card{display:grid;grid-template-columns:minmax(260px,42%) 1fr;overflow:hidden;padding:0;background:linear-gradient(135deg,#f8f1e4,#fffaf2);border:1px solid rgba(180,132,64,.26);box-shadow:0 18px 45px rgba(55,38,22,.12)}
.mascot-guide-card__media{position:relative;min-height:430px;background:#2b2119;overflow:hidden}
.mascot-guide-card__media::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 65%,rgba(248,241,228,.72));pointer-events:none}
.mascot-guide-card__media img{display:block;width:100%;height:100%;min-height:430px;object-fit:cover;object-position:center}
.mascot-guide-card__copy{align-self:center;padding:clamp(26px,4vw,58px)}
.mascot-guide-card__copy h2{max-width:13em}
@media(max-width:760px){.mascot-guide-card{grid-template-columns:1fr}.mascot-guide-card__media{min-height:auto;aspect-ratio:4/5}.mascot-guide-card__media img{min-height:0;aspect-ratio:4/5}.mascot-guide-card__media::after{background:linear-gradient(180deg,transparent 72%,rgba(248,241,228,.82))}.mascot-guide-card__copy{padding:24px}}
'''
    path.write_text(text, encoding="utf-8")


def clean_html():
    removed_path = ROOT / REMOVED_PAGE
    if removed_path.exists():
        removed_path.unlink()
    for path in ROOT.glob("*.html"):
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        for tag in list(soup.find_all(href=True)):
            if not getattr(tag, "attrs", None):
                continue
            href = tag.attrs.get("href", "")
            if REMOVED_PAGE in href or REMOVED_ID in href:
                parent = tag.find_parent(["article", "li"])
                (parent or tag).decompose()
        for tag in list(soup.find_all(attrs={"data-product-id": REMOVED_ID})):
            tag.decompose()
        for node in list(soup.find_all(string=True)):
            if isinstance(node, Comment):
                low = node.lower()
                if any(x in low for x in ("debug", "audit", "test only", "internal only")):
                    node.extract()
                continue
            new = replace_public_text(str(node))
            if new != str(node):
                node.replace_with(new)
        rendered = str(soup).replace("v=301.0", f"v={VERSION}")
        path.write_text(rendered, encoding="utf-8")


def clean_sitemap():
    path = ROOT / "sitemap.xml"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"\s*<url>.*?product-guilu-drink-180cc\.html.*?</url>", "", text, flags=re.S)
    path.write_text(text, encoding="utf-8")


def remove_internal_artifacts():
    names = [
        "BUTTON_AUDIT_REPORT.md", "BUTTON_BROWSER_REPORT.md", "LATEST_ASSET_REPORT.txt",
        "CHECK_REPORT_281_AI聊天_DM圖片清理.json", "仙加味_Git圖片清理清單.md",
        "仙加味_Git圖片清理清單_v282.md", "MASCOT_RUN_FINAL_2.txt", "TREE_BASE_TEST.txt"
    ]
    for name in names:
        path = ROOT / name
        if path.exists():
            path.unlink()


def audit():
    targets = [*ROOT.glob("*.html"), ROOT/"data.json", ROOT/"catalog-public.json", ROOT/"site.js", ROOT/"sitemap.xml"]
    bad = []
    for path in targets:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if "180cc" in text.lower() or REMOVED_ID in text or REMOVED_PAGE in text:
            bad.append(str(path.relative_to(ROOT)))
        if path.name == "site.js" and any(term in text for term in ("固定沿用米白", "品牌導覽角色", "角色設定")):
            bad.append(str(path.relative_to(ROOT)) + ":internal-copy")
    if bad:
        raise SystemExit("公開內容仍有不應顯示項目：" + ", ".join(sorted(set(bad))))
    for name in ("welcome", "products", "guide", "service", "usage"):
        p = BRAND / f"xianjiawei-scene-{name}.jpg"
        if not p.exists() or p.stat().st_size < 20000:
            raise SystemExit(f"缺少情境圖片：{p}")


if __name__ == "__main__":
    generate_scenes()
    clean_json_files()
    patch_site_js()
    patch_css()
    clean_html()
    clean_sitemap()
    remove_internal_artifacts()
    audit()
