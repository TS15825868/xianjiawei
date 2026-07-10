from __future__ import annotations

import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "images/brand"
LINE_MASCOT_DIR = ROOT / "images/line-mascot"
LINE_DIR = ROOT / "images/line"

NAVY = (7, 34, 59)
GOLD = (207, 165, 62)
CREAM = (250, 244, 225)
SOFT_GOLD = (235, 224, 190)

FONT_CANDIDATES_BOLD = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc",
]
FONT_CANDIDATES_REGULAR = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
]


def font_path(candidates: list[str]) -> str:
    for item in candidates:
        if Path(item).exists():
            return item
    raise FileNotFoundError("Noto CJK font is required")


BOLD = font_path(FONT_CANDIDATES_BOLD)
REGULAR = font_path(FONT_CANDIDATES_REGULAR)


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, minimum: int = 24, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = BOLD if bold else REGULAR
    size = start_size
    while size > minimum:
        font = ImageFont.truetype(path, size)
        box = draw.textbbox((0, 0), text, font=font)
        if box[2] - box[0] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(path, minimum)


def crop_fill(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = image.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = image.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - target_w) // 2)
    top = max(0, (resized.height - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def scene(name: str) -> Image.Image:
    path = BRAND_DIR / name
    if not path.exists():
        raise FileNotFoundError(path)
    return Image.open(path).convert("RGB")


def draw_centered(draw: ImageDraw.ImageDraw, area: tuple[int, int, int, int], text: str, font: ImageFont.FreeTypeFont, fill, y: int, stroke_width: int = 0) -> None:
    x0, _, x1, _ = area
    box = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    x = x0 + (x1 - x0 - (box[2] - box[0])) / 2
    draw.text((x, y), text, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=(20, 20, 20))


def make_line_card(source_name: str, output_name: str, title: str, subtitle: str) -> None:
    base = crop_fill(scene(source_name), (1200, 900)).convert("RGBA")
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    panel_top = 650
    draw.rectangle((0, panel_top, 1200, 900), fill=(*NAVY, 238))
    draw.line((0, panel_top + 2, 1200, panel_top + 2), fill=(*GOLD, 255), width=5)
    title_font = fit_font(draw, title, 1080, 70)
    sub_font = fit_font(draw, subtitle, 1080, 32, minimum=24, bold=False)
    draw_centered(draw, (0, panel_top, 1200, 900), title, title_font, CREAM, panel_top + 48, stroke_width=1)
    draw_centered(draw, (0, panel_top, 1200, 900), subtitle, sub_font, SOFT_GOLD, panel_top + 151)
    result = Image.alpha_composite(base, overlay).convert("RGB")
    result = result.filter(ImageFilter.UnsharpMask(radius=0.8, percent=115, threshold=3))
    target = LINE_MASCOT_DIR / output_name
    target.parent.mkdir(parents=True, exist_ok=True)
    result.save(target, quality=88, optimize=True, progressive=True, subsampling=0)
    print(f"created {target.relative_to(ROOT)}")


def make_rich_menu() -> None:
    width, height = 2500, 1686
    header_h = 170
    row_h = (height - header_h) // 2
    image_h = 548
    label_h = row_h - image_h
    col_edges = [0, 833, 1667, 2500]

    canvas = Image.new("RGB", (width, height), NAVY)
    draw = ImageDraw.Draw(canvas)

    brand_font = ImageFont.truetype(BOLD, 64)
    small_font = ImageFont.truetype(REGULAR, 30)
    account_font = ImageFont.truetype(BOLD, 46)
    draw.text((78, 42), "仙加味", font=brand_font, fill=CREAM)
    draw.text((78, 108), "補養，是一種節奏。", font=small_font, fill=SOFT_GOLD)
    right_title = "LINE 官方帳號"
    right_box = draw.textbbox((0, 0), right_title, font=account_font)
    draw.text((width - 85 - (right_box[2] - right_box[0]), 48), right_title, font=account_font, fill=CREAM)
    right_sub = "產品・推薦・搭配・使用・下單"
    right_sub_box = draw.textbbox((0, 0), right_sub, font=small_font)
    draw.text((width - 85 - (right_sub_box[2] - right_sub_box[0]), 108), right_sub, font=small_font, fill=SOFT_GOLD)

    cells = [
        ("xianjiawei-scene-products.jpg", "看產品", "查看產品規格"),
        ("xianjiawei-scene-welcome.jpg", "購物車", "查看購買清單"),
        ("xianjiawei-scene-guide.jpg", "幫我推薦", "依需求快速比較"),
        ("xianjiawei-scene-products.jpg", "搭配組合", "查看日常方案"),
        ("xianjiawei-scene-usage.jpg", "怎麼使用", "即飲・沖泡・燉湯"),
        ("xianjiawei-scene-service.jpg", "直接下單", "由客服協助確認"),
    ]

    for index, (source_name, title, subtitle) in enumerate(cells):
        row = index // 3
        col = index % 3
        x0, x1 = col_edges[col], col_edges[col + 1]
        y0 = header_h + row * row_h
        y_img_end = y0 + image_h
        image = crop_fill(scene(source_name), (x1 - x0, image_h))
        canvas.paste(image, (x0, y0))
        draw.rectangle((x0, y_img_end, x1, y_img_end + label_h), fill=NAVY)
        title_font = fit_font(draw, title, (x1 - x0) - 80, 86)
        subtitle_font = fit_font(draw, subtitle, (x1 - x0) - 70, 31, minimum=24, bold=False)
        draw_centered(draw, (x0, y_img_end, x1, y_img_end + label_h), title, title_font, CREAM, y_img_end + 37, stroke_width=1)
        draw_centered(draw, (x0, y_img_end, x1, y_img_end + label_h), subtitle, subtitle_font, SOFT_GOLD, y_img_end + 145)

    # Original layout retained; only the button labels are enlarged.
    for x in col_edges:
        draw.line((x, header_h, x, height), fill=GOLD, width=5)
    draw.line((0, header_h, width, header_h), fill=GOLD, width=5)
    draw.line((0, header_h + row_h, width, header_h + row_h), fill=GOLD, width=5)
    draw.rectangle((2, 2, width - 3, height - 3), outline=GOLD, width=5)

    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=0.7, percent=110, threshold=3))
    target = LINE_DIR / "xianjiawei-rich-menu-2500x1686-v309.jpg"
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target, quality=90, optimize=True, progressive=True, subsampling=0)
    print(f"created {target.relative_to(ROOT)}")


# Delete old LINE-specific mascot files before generating the final set.
shutil.rmtree(LINE_MASCOT_DIR, ignore_errors=True)
LINE_MASCOT_DIR.mkdir(parents=True, exist_ok=True)
LINE_DIR.mkdir(parents=True, exist_ok=True)
for old in LINE_DIR.glob("xianjiawei-rich-menu-2500x1686-v30*.jpg"):
    old.unlink(missing_ok=True)

cards = [
    ("xianjiawei-scene-welcome.jpg", "xianjiawei-mascot-line-welcome.jpg", "歡迎來到仙加味", "先看產品，也可以請小老闆協助推薦"),
    ("xianjiawei-scene-products.jpg", "xianjiawei-mascot-line-products.jpg", "認識仙加味產品", "查看規格、使用方式與購買資訊"),
    ("xianjiawei-scene-guide.jpg", "xianjiawei-mascot-line-recommend.jpg", "幫我推薦", "依使用情境快速比較"),
    ("xianjiawei-scene-products.jpg", "xianjiawei-mascot-line-combo.jpg", "搭配組合", "依日常使用方式整理"),
    ("xianjiawei-scene-usage.jpg", "xianjiawei-mascot-line-usage.jpg", "怎麼使用", "即飲、沖泡、熱飲與燉湯"),
    ("xianjiawei-scene-guide.jpg", "xianjiawei-mascot-line-faq.jpg", "常見問題 FAQ", "產品、配送與付款資訊一次整理"),
    ("xianjiawei-scene-service.jpg", "xianjiawei-mascot-line-service.jpg", "人工客服與門市服務", "週一至週六 09:30–18:30｜假日可預約"),
    ("xianjiawei-scene-welcome.jpg", "xianjiawei-mascot-line-brand.jpg", "仙加味品牌故事", "從萬華出發，延續四代龜鹿工序"),
]

for item in cards:
    make_line_card(*item)

make_rich_menu()
print("LINE OA v309 image assets generated successfully")
