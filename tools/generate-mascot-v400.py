from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

src = Path("images/brand/xianjiawei-web-scenes-v324.webp")
im = Image.open(src).convert("RGB")
w, h = im.size
if w < 800 or h < 400:
    raise SystemExit(f"母圖解析度不足：{im.size}")
cw, ch = w // 4, h // 2
print(f"母圖：{im.size}，單格：{(cw, ch)}")

cells = {
    "home": (0, 0), "products": (1, 0), "choose": (2, 0), "combo": (3, 0),
    "guide": (0, 1), "recipes": (1, 1), "faq": (2, 1), "contact": (3, 1),
}

def cell(name):
    x, y = cells[name]
    crop = im.crop((x*cw, y*ch, min((x+1)*cw, w), min((y+1)*ch, h)))
    crop = crop.resize((1448, 1086), Image.Resampling.LANCZOS)
    return crop.filter(ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=3))

website_dir = Path("images/brand")
website_dir.mkdir(parents=True, exist_ok=True)
for name in cells:
    cell(name).save(website_dir / f"website-mascot-{name}.jpg", "JPEG", quality=91, optimize=True, progressive=True)
cell("home").save(website_dir / "website-mascot-brand.jpg", "JPEG", quality=91, optimize=True, progressive=True)

line_dir = Path("images/line-mascot")
line_dir.mkdir(parents=True, exist_ok=True)
line_sources = {
    "welcome": "home", "products": "products", "recommend": "choose", "combo": "combo",
    "usage": "guide", "faq": "faq", "service": "contact", "brand": "home", "cart": "products",
}

def line_card(scene, source):
    base = cell(source).crop((34, 26, 1414, 1060)).resize((1412, 1050), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (1448, 1086), "#F7F4ED")
    canvas.paste(base, (18, 18))
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.rounded_rectangle((8, 8, 1440, 1078), radius=34, outline="#0B1F3B", width=16)
    draw.rectangle((18, 982, 1430, 1068), fill=(11, 31, 59, 215))
    draw.ellipse((54, 54, 166, 166), fill=(142, 31, 35, 235), outline=(218, 177, 91, 255), width=6)
    pen = (255, 248, 232, 255)
    gold = (218, 177, 91, 255)
    if scene == "products":
        draw.rectangle((82, 84, 138, 136), outline=pen, width=7)
        draw.line((82, 101, 110, 116, 138, 101), fill=pen, width=6)
    elif scene == "recommend":
        for yy in (86, 108, 130):
            draw.ellipse((82, yy-5, 92, yy+5), fill=gold)
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
    return canvas.filter(ImageFilter.UnsharpMask(radius=0.8, percent=105, threshold=3))

for scene, source in line_sources.items():
    line_card(scene, source).save(line_dir / f"xianjiawei-mascot-line-{scene}.jpg", "JPEG", quality=91, optimize=True, progressive=True)

print("網站與 LINE OA 兩套小老闆素材已產生")
