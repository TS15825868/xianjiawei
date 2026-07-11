from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

SIZE = (1448, 1086)
BRAND_BG = "#F7F4ED"
NAVY = "#0B1F3B"
RED = "#8E1F23"
GOLD = "#DAB15B"

line_dir = Path("images/line-mascot")
brand_dir = Path("images/brand")
line_dir.mkdir(parents=True, exist_ok=True)
brand_dir.mkdir(parents=True, exist_ok=True)

source_names = ["welcome", "products", "recommend", "combo", "usage", "faq", "service", "brand"]
source_images = {}
for name in source_names:
    path = line_dir / f"xianjiawei-mascot-line-{name}.jpg"
    if not path.exists():
        raise SystemExit(f"缺少原始小老闆圖：{path}")
    with Image.open(path) as im:
        source_images[name] = im.convert("RGB").copy()


def cover(im, size=SIZE, zoom=1.0):
    tw, th = size
    iw, ih = im.size
    scale = max(tw / iw, th / ih) * zoom
    nw, nh = max(1, round(iw * scale)), max(1, round(ih * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


def website_card(source_name, variant=0):
    source = source_images[source_name]
    background = cover(source).filter(ImageFilter.GaussianBlur(radius=18))
    background = ImageEnhance.Brightness(background).enhance(0.88)
    foreground = cover(source, zoom=1.0 + variant * 0.012)

    canvas = Image.new("RGB", SIZE, BRAND_BG)
    canvas.paste(background, (0, 0))

    margin_x, margin_y = 30, 26
    inner = foreground.resize((SIZE[0] - margin_x * 2, SIZE[1] - margin_y * 2), Image.Resampling.LANCZOS)
    canvas.paste(inner, (margin_x, margin_y))

    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.rounded_rectangle((18, 18, SIZE[0] - 18, SIZE[1] - 18), radius=38, outline=(218, 177, 91, 210), width=8)
    draw.rectangle((30, SIZE[1] - 78, SIZE[0] - 30, SIZE[1] - 30), fill=(247, 244, 237, 185))
    return canvas.filter(ImageFilter.UnsharpMask(radius=0.9, percent=112, threshold=3))


def draw_scene_icon(draw, scene):
    pen = (255, 248, 232, 255)
    gold = (218, 177, 91, 255)
    if scene == "products":
        draw.rectangle((82, 84, 138, 136), outline=pen, width=7)
        draw.line((82, 101, 110, 116, 138, 101), fill=pen, width=6)
    elif scene == "recommend":
        for yy in (86, 108, 130):
            draw.ellipse((82, yy - 5, 92, yy + 5), fill=gold)
            draw.line((100, yy, 139, yy), fill=pen, width=6)
    elif scene == "combo":
        draw.ellipse((76, 88, 116, 128), outline=pen, width=7)
        draw.ellipse((104, 88, 144, 128), outline=pen, width=7)
    elif scene == "usage":
        draw.rectangle((82, 94, 132, 132), outline=pen, width=7)
        draw.arc((126, 98, 148, 126), -90, 90, fill=pen, width=6)
        draw.arc((88, 72, 124, 104), 190, 335, fill=gold, width=5)
    elif scene == "faq":
        draw.arc((82, 76, 140, 126), 200, 520, fill=pen, width=8)
        draw.line((111, 124, 111, 136), fill=pen, width=7)
        draw.ellipse((107, 145, 115, 153), fill=pen)
    elif scene == "service":
        draw.arc((76, 76, 144, 144), 180, 360, fill=pen, width=8)
        draw.rectangle((72, 106, 88, 136), fill=pen)
        draw.rectangle((132, 106, 148, 136), fill=pen)
        draw.line((139, 137, 121, 147), fill=gold, width=6)
    elif scene == "cart":
        draw.line((76, 84, 88, 84, 96, 128, 138, 128), fill=pen, width=7)
        draw.rectangle((92, 92, 138, 120), outline=pen, width=6)
        draw.ellipse((96, 136, 110, 150), fill=gold)
        draw.ellipse((128, 136, 142, 150), fill=gold)
    elif scene == "brand":
        draw.ellipse((80, 80, 140, 140), outline=pen, width=7)
        draw.line((94, 110, 126, 110), fill=gold, width=6)
        draw.line((110, 94, 110, 126), fill=gold, width=6)
    else:
        draw.arc((78, 82, 142, 144), 205, 335, fill=pen, width=8)
        draw.line((108, 112, 134, 86), fill=gold, width=7)


def line_card(source_name, scene, variant=0):
    source = source_images[source_name]
    base = cover(source, zoom=1.04 + variant * 0.006)
    base = base.crop((28, 20, SIZE[0] - 28, SIZE[1] - 20)).resize((1412, 1050), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", SIZE, BRAND_BG)
    canvas.paste(base, (18, 18))
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.rounded_rectangle((8, 8, SIZE[0] - 8, SIZE[1] - 8), radius=34, outline=NAVY, width=16)
    draw.rectangle((18, 982, SIZE[0] - 18, 1068), fill=(11, 31, 59, 220))
    draw.ellipse((54, 54, 166, 166), fill=(142, 31, 35, 238), outline=(218, 177, 91, 255), width=6)
    draw_scene_icon(draw, scene)
    return canvas.filter(ImageFilter.UnsharpMask(radius=0.8, percent=108, threshold=3))


website_sources = {
    "home": ("welcome", 0),
    "products": ("products", 1),
    "choose": ("recommend", 2),
    "combo": ("combo", 3),
    "guide": ("usage", 4),
    "recipes": ("brand", 5),
    "faq": ("faq", 6),
    "contact": ("service", 7),
    "brand": ("welcome", 8),
}
for scene, (source, variant) in website_sources.items():
    website_card(source, variant).save(
        brand_dir / f"website-mascot-{scene}.jpg",
        "JPEG",
        quality=92,
        optimize=True,
        progressive=True,
    )

line_sources = {
    "welcome": ("welcome", 0),
    "products": ("products", 1),
    "recommend": ("recommend", 2),
    "combo": ("combo", 3),
    "usage": ("usage", 4),
    "faq": ("faq", 5),
    "service": ("service", 6),
    "brand": ("brand", 7),
    "cart": ("products", 8),
}
for scene, (source, variant) in line_sources.items():
    line_card(source, scene, variant).save(
        line_dir / f"xianjiawei-mascot-line-{scene}.jpg",
        "JPEG",
        quality=92,
        optimize=True,
        progressive=True,
    )

print("已產生官網與 LINE OA 兩套獨立高解析小老闆素材")
