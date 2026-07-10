from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageFilter
import json, re

ROOT = Path(__file__).resolve().parents[1]
VERSION = "307.0"

SCENES = {
    "welcome": ROOT / "images/brand/xianjiawei-scene-welcome.jpg",
    "products": ROOT / "images/brand/xianjiawei-scene-products.jpg",
    "guide": ROOT / "images/brand/xianjiawei-scene-guide.jpg",
    "service": ROOT / "images/brand/xianjiawei-scene-service.jpg",
    "usage": ROOT / "images/brand/xianjiawei-scene-usage.jpg",
}


def improve_scene(path: Path):
    if not path.exists():
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGB")
    image = ImageOps.fit(image, (1920, 1440), Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    image = image.filter(ImageFilter.UnsharpMask(radius=1.1, percent=125, threshold=2))
    image.save(path, "JPEG", quality=94, subsampling=0, optimize=True, progressive=True)


def font(size: int):
    candidates = [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for item in candidates:
        if Path(item).exists():
            return ImageFont.truetype(item, size)
    return ImageFont.load_default()


def build_rich_menu():
    width, height = 2500, 1686
    col_widths = [834, 833, 833]
    x_positions = [0, 834, 1667]
    row_height = 843
    navy = (10, 36, 66)
    gold = (214, 175, 67)
    cream = (247, 244, 237)
    white = (255, 255, 255)

    title_font = font(96)
    subtitle_font = font(40)
    items = [
        ("products", "看產品", "查看產品規格"),
        ("products", "購物車", "查看購買清單"),
        ("guide", "幫我推薦", "依需求快速比較"),
        ("products", "搭配組合", "查看日常方案"),
        ("usage", "怎麼使用", "即飲・沖泡・燉湯"),
        ("service", "直接下單", "由客服協助確認"),
    ]

    canvas = Image.new("RGB", (width, height), navy)
    draw = ImageDraw.Draw(canvas)
    label_h = 250
    image_h = row_height - label_h

    for index, (scene, label, subtitle) in enumerate(items):
        col = index % 3
        row = index // 3
        x = x_positions[col]
        y = row * row_height
        cell_w = col_widths[col]

        source = Image.open(SCENES[scene]).convert("RGB")
        fitted = ImageOps.fit(source, (cell_w, image_h), Image.Resampling.LANCZOS, centering=(0.5, 0.48))
        canvas.paste(fitted, (x, y))
        draw.rectangle((x, y + image_h, x + cell_w, y + row_height), fill=navy)
        draw.line((x, y + image_h, x + cell_w, y + image_h), fill=gold, width=9)

        box = draw.textbbox((0, 0), label, font=title_font)
        tx = x + (cell_w - (box[2] - box[0])) // 2
        draw.text((tx, y + image_h + 24), label, font=title_font, fill=white)

        sbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        sx = x + (cell_w - (sbox[2] - sbox[0])) // 2
        draw.text((sx, y + image_h + 154), subtitle, font=subtitle_font, fill=cream)

    for x in (834, 1667):
        draw.line((x, 0, x, height), fill=gold, width=9)
    draw.line((0, 843, width, 843), fill=gold, width=9)
    draw.rectangle((0, 0, width - 1, height - 1), outline=gold, width=10)

    out = ROOT / "images/line/xianjiawei-rich-menu-2500x1686-v307.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, "JPEG", quality=93, subsampling=0, optimize=True, progressive=True)

    actions = {
        "size": {"width": 2500, "height": 1686},
        "selected": True,
        "name": "仙加味服務 v307",
        "chatBarText": "仙加味服務",
        "areas": [
            {"bounds": {"x": 0, "y": 0, "width": 834, "height": 843}, "action": {"type": "message", "text": "看產品"}},
            {"bounds": {"x": 834, "y": 0, "width": 833, "height": 843}, "action": {"type": "message", "text": "購物車"}},
            {"bounds": {"x": 1667, "y": 0, "width": 833, "height": 843}, "action": {"type": "message", "text": "幫我推薦"}},
            {"bounds": {"x": 0, "y": 843, "width": 834, "height": 843}, "action": {"type": "message", "text": "搭配組合"}},
            {"bounds": {"x": 834, "y": 843, "width": 833, "height": 843}, "action": {"type": "message", "text": "怎麼使用"}},
            {"bounds": {"x": 1667, "y": 843, "width": 833, "height": 843}, "action": {"type": "message", "text": "直接下單"}},
        ],
    }
    (ROOT / "rich-menu-actions-v307.json").write_text(json.dumps(actions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def bump_versions():
    for path in [ROOT / "site.js", ROOT / "site.css", *ROOT.glob("*.html")]:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"(?<=\?v=)306\.0", VERSION, text)
        text = re.sub(r"(?<=\?v=)305\.0", VERSION, text)
        path.write_text(text, encoding="utf-8")

    css = ROOT / "site.css"
    text = css.read_text(encoding="utf-8")
    marker = "/* v307 image clarity */"
    if marker not in text:
        text += "\n\n/* v307 image clarity */\n.mascot-guide-card__media img{image-rendering:auto!important;filter:none!important;opacity:1!important;transform:translateZ(0);backface-visibility:hidden}\n"
        css.write_text(text, encoding="utf-8")


def clean_stale_files():
    stale = [
        ROOT / ".asset-v306",
        ROOT / ".asset-stage",
        ROOT / "final_mascot_v306_sheet.jpg",
        ROOT / "latest_generated_sheet.jpg",
    ]
    import shutil
    for path in stale:
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        elif path.exists():
            path.unlink()


for scene in SCENES.values():
    improve_scene(scene)
build_rich_menu()
bump_versions()
clean_stale_files()

for scene in SCENES.values():
    with Image.open(scene) as im:
        assert im.size == (1920, 1440), (scene, im.size)
with Image.open(ROOT / "images/line/xianjiawei-rich-menu-2500x1686-v307.jpg") as im:
    assert im.size == (2500, 1686)
print("website visual v307 ready")
