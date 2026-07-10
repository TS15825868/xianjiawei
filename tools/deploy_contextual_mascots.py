from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "images" / "brand"
SOURCE = BRAND_DIR / "xianjiawei-mascot.jpg"
BG = (245, 237, 224)
OLIVE = (47, 79, 58)
GOLD = (212, 175, 55)
SKIN = (246, 195, 159)
INK = (42, 33, 28)


def canvas():
    return Image.new("RGB", (480, 600), BG)


def place(base, subject, box, contain=True):
    x1, y1, x2, y2 = box
    size = (x2 - x1, y2 - y1)
    fitted = ImageOps.contain(subject, size, Image.Resampling.LANCZOS) if contain else ImageOps.fit(subject, size, Image.Resampling.LANCZOS)
    x = x1 + (size[0] - fitted.width) // 2
    y = y1 + (size[1] - fitted.height) // 2
    base.paste(fitted, (x, y))


def add_soft_halo(im):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((55, 30, 425, 560), fill=(255, 255, 255, 105))
    layer = layer.filter(ImageFilter.GaussianBlur(26))
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def rounded_line(draw, points, fill, width):
    draw.line(points, fill=fill, width=width, joint="curve")
    r = width // 2
    for x, y in (points[0], points[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def draw_tray(draw):
    draw.ellipse((18, 314, 248, 402), fill=(88, 49, 24), outline=INK, width=4)
    draw.ellipse((30, 320, 236, 384), fill=(151, 91, 44), outline=(108, 61, 27), width=3)
    herbs = [
        (60, 341, 83, 360, (151, 39, 31)),
        (91, 348, 118, 367, (231, 205, 153)),
        (126, 338, 151, 359, (183, 151, 91)),
        (157, 348, 186, 368, (241, 219, 172)),
        (193, 335, 220, 357, (79, 111, 52)),
    ]
    for x1, y1, x2, y2, color in herbs:
        draw.ellipse((x1, y1, x2, y2), fill=color, outline=INK, width=2)
    draw.line((202, 344, 221, 319), fill=OLIVE, width=5)
    draw.line((210, 344, 229, 329), fill=OLIVE, width=5)
    draw.ellipse((214, 315, 234, 333), fill=(96, 131, 64), outline=INK, width=2)


def draw_thumb_badge(draw):
    draw.ellipse((24, 255, 164, 395), fill=OLIVE, outline=(35, 58, 44), width=4)
    # palm
    draw.rounded_rectangle((72, 300, 126, 365), radius=18, fill=SKIN, outline=INK, width=3)
    # raised thumb
    rounded_line(draw, [(82, 316), (76, 280), (91, 249)], SKIN, 19)
    draw.ellipse((82, 239, 105, 265), fill=SKIN, outline=INK, width=2)
    # fingers
    for y in (311, 326, 341):
        draw.rounded_rectangle((112, y, 143, y + 15), radius=7, fill=SKIN, outline=INK, width=2)
    # sparkle
    draw.polygon([(54, 221), (62, 240), (82, 247), (62, 254), (54, 273), (46, 254), (26, 247), (46, 240)], fill=GOLD)


def generate_images():
    if not SOURCE.exists():
        raise SystemExit(f"Missing mascot source: {SOURCE}")
    subject = Image.open(SOURCE).convert("RGB")

    full = add_soft_halo(canvas())
    place(full, subject, (68, 18, 412, 582))
    full.save(BRAND_DIR / "xianjiawei-mascot-full.jpg", quality=88, optimize=True, progressive=True)

    wave = add_soft_halo(canvas())
    # Upper-body crop makes the original greeting gesture feel more direct.
    crop = subject.crop((0, 0, subject.width, int(subject.height * 0.74)))
    place(wave, crop, (28, 35, 452, 570), contain=False)
    wave.save(BRAND_DIR / "xianjiawei-mascot-wave.jpg", quality=88, optimize=True, progressive=True)

    tray = add_soft_halo(canvas())
    place(tray, subject, (138, 45, 470, 590))
    draw_tray(ImageDraw.Draw(tray))
    tray.save(BRAND_DIR / "xianjiawei-mascot-tray.jpg", quality=88, optimize=True, progressive=True)

    thumbs = add_soft_halo(canvas())
    crop = subject.crop((0, 0, subject.width, int(subject.height * 0.82)))
    place(thumbs, crop, (122, 65, 470, 585), contain=False)
    draw_thumb_badge(ImageDraw.Draw(thumbs))
    thumbs.save(BRAND_DIR / "xianjiawei-mascot-thumbs.jpg", quality=88, optimize=True, progressive=True)


def patch_site_js():
    path = ROOT / "site.js"
    text = path.read_text(encoding="utf-8")
    block = r'''const MASCOT_IMAGES = {
  full: 'images/brand/xianjiawei-mascot-full.jpg?v=301.0',
  wave: 'images/brand/xianjiawei-mascot-wave.jpg?v=301.0',
  tray: 'images/brand/xianjiawei-mascot-tray.jpg?v=301.0',
  thumbs: 'images/brand/xianjiawei-mascot-thumbs.jpg?v=301.0'
};

function renderMascotGuide() {
  const page = document.body?.dataset?.page || '';
  const config = {
    home: {
      image: 'wave', eyebrow: '仙加味小老闆歡迎你',
      title: '先從平常想怎麼使用開始認識仙加味',
      text: '依固定安排、方便即飲、沖泡燉湯、家庭規格或自行調飲來比較；產品規格與價格仍以正式產品資料為準。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    products: {
      image: 'tray', eyebrow: '小老闆介紹產品',
      title: '不同產品型態，放進日常的方式也不一樣',
      text: '從膏、飲、湯塊、膠到粉，依規格、成分、使用方式與生活情境逐一比較。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="choose.html">怎麼選</a>`
    },
    choose: {
      image: 'thumbs', eyebrow: '小老闆帶你選',
      title: '先看使用習慣，再決定產品型態',
      text: '想固定安排、方便即飲、沖泡燉湯、家庭備用或自行搭配飲品，都可以從日常使用方式開始。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看全部產品</a>`
    },
    combo: {
      image: 'tray', eyebrow: '小老闆搭配導覽',
      title: '依生活節奏查看搭配組合',
      text: '每組內容、價格、可選組數、活動與加入購物車功能，都保留在各搭配卡中。',
      actions: `${lineButton('搭配組合', '搭配組合')}<a class="btn btn-outline" href="products.html">先看產品</a>`
    },
    guide: {
      image: 'full', eyebrow: '小老闆使用提醒',
      title: '把沖泡、即飲與燉湯方式整理清楚',
      text: '依產品型態查看取用方式、飲用時段、搭配方式與保存資訊，讓日常安排更順手。',
      actions: `${lineButton('怎麼使用', '怎麼使用')}<a class="btn btn-outline" href="faq.html">看常見問題</a>`
    },
    recipes: {
      image: 'tray', eyebrow: '小老闆端上日常搭配',
      title: '從熱飲與家常料理開始',
      text: '用沖泡、調飲或燉湯的方式，把產品放進原本就熟悉的飲食節奏。',
      actions: `${lineButton('搭配組合', '料理搭配')}<a class="btn btn-outline" href="guide.html">看使用方式</a>`
    },
    video: {
      image: 'wave', eyebrow: '小老闆陪你看觀點',
      title: '從影片認識原料、工序與傳統食補文化',
      text: '影片提供知識與觀點整理；產品資訊仍以仙加味正式頁面與客服回覆為準。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="knowledge.html">看知識內容</a>`
    },
    knowledge: {
      image: 'full', eyebrow: '小老闆知識導覽',
      title: '把傳統資料整理成今天容易理解的內容',
      text: '內容以食材、文化、原料與日常使用觀點為主，不代替醫療診斷或個人體質判斷。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="sources.html">查看資料來源</a>`
    },
    'hanfang-baike': {
      image: 'full', eyebrow: '小老闆帶你讀漢方資料',
      title: '先了解資料出處，再認識食材文化',
      text: '古籍與藥典內容會標示來源與引用原則，並與產品銷售資訊清楚區分。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="sources.html">資料來源</a>`
    },
    sources: {
      image: 'thumbs', eyebrow: '資料引用原則',
      title: '來源清楚，內容才看得安心',
      text: '網站引用古籍、藥典與公開資料時，會保留出處、年代與適用範圍，不延伸為產品療效宣稱。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="knowledge.html">回知識館</a>`
    },
    brand: {
      image: 'full', eyebrow: '品牌導覽角色',
      title: '仙加味小老闆｜親切、專業、傳承與安心',
      text: '固定沿用米白中式上衣、深橄欖綠圍裙、仙加味紅印章，以及彼此分開的小鹿與小烏龜圖案。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="contact.html">聯絡我們</a>`
    },
    faq: {
      image: 'thumbs', eyebrow: '小老闆回答常見問題',
      title: '產品差異、使用方式與購買流程一次整理',
      text: '先查看常見問題；需要確認規格、數量、配送或付款方式時，再由官方 LINE 協助。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    contact: {
      image: 'wave', eyebrow: '小老闆為你服務',
      title: '歡迎透過官方 LINE 詢問產品與門市資訊',
      text: '請留下想了解的產品、規格、數量或取貨方式，我們會依實際情況協助確認。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">先看產品</a>`
    },
    dm: {
      image: 'tray', eyebrow: '小老闆產品整理',
      title: '一頁比較產品型態、規格與使用方向',
      text: '先快速掌握各產品差異，再進入產品頁查看完整成分、使用與保存資訊。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">完整產品頁</a>`
    },
    'product-detail': {
      image: 'tray', eyebrow: '小老闆介紹這項產品',
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
        <img src="${MASCOT_IMAGES[config.image] || MASCOT_IMAGES.full}" alt="仙加味小老闆，穿米白中式上衣與深橄欖綠圍裙" width="480" height="600" loading="eager" decoding="async">
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
    pattern = re.compile(r"const MASCOT_IMAGE = .*?\n\}\n\nfunction renderHome\(\) \{", re.S)
    updated, count = pattern.subn(block + "\n\nfunction renderHome() {", text, count=1)
    if count != 1:
        raise SystemExit("Could not locate existing mascot guide block")
    updated = updated.replace("v=300.5", "v=301.0")
    path.write_text(updated, encoding="utf-8")


def bump_html_versions():
    for html in ROOT.glob("*.html"):
        raw = html.read_text(encoding="utf-8")
        raw = raw.replace("site.js?v=300.5", "site.js?v=301.0")
        raw = raw.replace("site.css?v=300.5", "site.css?v=301.0")
        html.write_text(raw, encoding="utf-8")


def update_spec():
    spec = ROOT / "MASCOT_CHARACTER_SPEC.md"
    text = spec.read_text(encoding="utf-8") if spec.exists() else ""
    marker = "## 情境化動作與放置原則"
    if marker not in text:
        text += "\n\n## 情境化動作與放置原則\n\n網站與 LINE OA 不重複只使用同一張角色圖，而是依頁面用途選擇固定角色的不同構圖與動作：招手用於歡迎與聯絡、托盤用於產品與搭配、全身介紹用於使用與品牌內容、比讚用於挑選、FAQ 與資料確認。角色本人、臉型、髮型、服裝、圍裙 Logo、小鹿與小烏龜均保持一致。\n"
        spec.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    generate_images()
    patch_site_js()
    bump_html_versions()
    update_spec()
