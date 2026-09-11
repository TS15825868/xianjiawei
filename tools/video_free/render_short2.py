#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""仙加味零額外費用短影片渲染器｜第2支《早安，今天一起準備開店》

目標：
- 9:16 / 720x1280 / 24fps / 約30秒
- 使用 repo 內既有核准小老闆 sprite，不重畫產品、不生成不存在包裝
- 角色本體有姿勢切換、呼吸、擺動、步伐與夥伴獨立動作，不做單純整張圖片平移/縮放
- 多場景、多鏡位、字幕安全區
- 預設不放產品，避免任何 AI 包裝錯誤
- 若未提供核准音檔，輸出 technical-preview（字幕版），不得自動發布

本檔只使用 Python 標準庫 + Pillow；FFmpeg 由 workflow 安裝。
"""
from __future__ import annotations

import argparse
import base64
import io
import math
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SPRITE_PATH = ROOT / "assets/reference/mascot-sprite-v20260816.txt"
W, H = 720, 1280
FPS = 24
DURATION = 30.0
FRAME_COUNT = int(FPS * DURATION)

CREAM = "#F7F4ED"
NAVY = "#142B4A"
GREEN = "#394B36"
RED = "#9B2B2B"
GOLD = "#C8A45A"
INK = "#203040"
WOOD = "#7A5436"
WARM = "#EEDCC7"
WHITE = "#FFFDF8"

FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
]

SUBTITLES = [
    (0.0, 3.5, "早安，今天一起準備開店。"),
    (3.5, 7.2, "先把桌面整理好，讓一天慢慢開始。"),
    (7.2, 10.8, "小鹿來巡店，小烏龜也沒有缺席。"),
    (10.8, 14.8, "藥櫃、杯子、常用的小東西，一樣一樣放回位置。"),
    (14.8, 18.5, "天氣還有點涼，先準備一杯溫熱的。"),
    (18.5, 22.5, "仙加味的日常，不急著趕快，先把每件事做好。"),
    (22.5, 26.2, "等等開門，也準備好聽大家聊聊今天需要什麼。"),
    (26.2, 30.0, "店準備好了。早安，今天也一起照自己的節奏來。"),
]

FORBIDDEN_PUBLIC = ["台興山產", "治療", "改善疾病", "預防疾病", "保證功效", "膠原蛋白", "鈣質"]

SPRITE_BOXES = {
    "main": (8, 35, 8 + 188, 35 + 390),
    "wave": (235, 25, 235 + 150, 25 + 145),
    "tray": (405, 25, 405 + 175, 25 + 150),
    "thumb": (245, 215, 245 + 150, 215 + 133),
    "deer": (430, 235, 430 + 71, 235 + 80),
    "turtle": (530, 235, 530 + 80, 235 + 77),
}


@dataclass
class Scene:
    start: float
    end: float
    name: str
    pose: str


SCENES = [
    Scene(0.0, 3.5, "morning_door", "wave"),
    Scene(3.5, 7.2, "wipe_table", "main"),
    Scene(7.2, 10.8, "friends_arrive", "main"),
    Scene(10.8, 14.8, "organize_shelf", "tray"),
    Scene(14.8, 18.5, "warm_drink", "main"),
    Scene(18.5, 22.5, "shop_rhythm", "thumb"),
    Scene(22.5, 26.2, "ready_counter", "main"),
    Scene(26.2, 30.0, "open_shop", "wave"),
]


def font(size: int, bold: bool = True):
    choices = FONT_CANDIDATES if bold else FONT_CANDIDATES[1:] + FONT_CANDIDATES[:1]
    for p in choices:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def load_sprite():
    raw = base64.b64decode(SPRITE_PATH.read_text(encoding="utf-8").strip())
    sheet = Image.open(io.BytesIO(raw)).convert("RGBA")
    return {k: sheet.crop(v) for k, v in SPRITE_BOXES.items()}


def contain(im: Image.Image, maxw: int, maxh: int) -> Image.Image:
    out = im.copy()
    out.thumbnail((maxw, maxh), Image.Resampling.LANCZOS)
    return out


def ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)


def local_time(t: float, s: Scene) -> float:
    return (t - s.start) / max(0.001, s.end - s.start)


def current_scene(t: float) -> Scene:
    for s in SCENES:
        if s.start <= t < s.end:
            return s
    return SCENES[-1]


def draw_apothecary(draw: ImageDraw.ImageDraw, variant: str, t: float):
    # 乾淨現代漢方店背景，完全不畫產品包裝。
    draw.rectangle((0, 0, W, H), fill=CREAM)
    draw.rectangle((0, 0, W, 150), fill=NAVY)
    draw.text((46, 42), "仙加味", font=font(44), fill=WHITE)
    draw.text((W - 46, 60), "補養，是一種節奏。", font=font(22), fill="#EAD5A1", anchor="ra")

    # 遠景藥櫃
    draw.rounded_rectangle((26, 176, W - 26, 780), 30, fill="#6E4A32")
    for r in range(4):
        for c in range(5):
            x0 = 48 + c * 124
            y0 = 202 + r * 128
            draw.rounded_rectangle((x0, y0, x0 + 105, y0 + 98), 14, fill="#8A5F3B", outline="#B98955", width=3)
            draw.ellipse((x0 + 45, y0 + 40, x0 + 60, y0 + 55), fill="#D5B16C")

    # 前景桌面
    draw.rectangle((0, 900, W, H), fill="#7A5132")
    draw.rectangle((0, 900, W, 926), fill="#9E714B")

    # 場景物件與局部動畫
    phase = (math.sin(t * 2.0 * math.pi / 2.8) + 1) / 2
    if variant == "morning_door":
        # 門邊晨光
        glow = int(120 + 80 * phase)
        draw.polygon([(0, 160), (210, 160), (520, 900), (230, 900)], fill=(247, 222, 170, glow))
        draw.rounded_rectangle((480, 735, 655, 850), 20, fill="#F1E5CF", outline=GOLD, width=4)
        draw.text((568, 790), "準備開店", font=font(24), fill=GREEN, anchor="mm")
    elif variant == "wipe_table":
        x = 135 + int(180 * (0.5 + 0.5 * math.sin(t * 4.3)))
        draw.rounded_rectangle((x, 962, x + 190, 1000), 15, fill="#E4D7C5")
        for i in range(5):
            draw.arc((x - 40 + i * 34, 930, x + 30 + i * 34, 1015), 200, 330, fill="#EED9BD", width=3)
    elif variant == "friends_arrive":
        draw.rounded_rectangle((482, 760, 660, 850), 18, fill="#E8DEC9", outline=GREEN, width=3)
        draw.text((571, 805), "早安", font=font(30), fill=GREEN, anchor="mm")
    elif variant == "organize_shelf":
        for i in range(4):
            x = 438 + i * 54
            y = 808 - int(10 * math.sin(t * 3 + i))
            draw.rounded_rectangle((x, y, x + 38, y + 60), 8, fill="#F1E6D4", outline="#B08A5D", width=2)
    elif variant == "warm_drink":
        draw.rounded_rectangle((470, 775, 610, 875), 22, fill="#F4EFE5", outline="#B9A486", width=4)
        for i in range(3):
            sx = 500 + i * 35
            sy = 748 - int(18 * math.sin(t * 3.4 + i))
            draw.arc((sx, sy - 80, sx + 60, sy + 30), 190, 355, fill="#FFFDF8", width=6)
    elif variant == "shop_rhythm":
        draw.ellipse((500, 735, 626, 861), fill="#E9DEC8", outline=GOLD, width=4)
        draw.line((563, 754, 563, 798), fill=NAVY, width=6)
        draw.line((563, 798, 600, 823), fill=NAVY, width=6)
    elif variant == "ready_counter":
        draw.rounded_rectangle((430, 752, 650, 862), 16, fill="#F2E9D9", outline=GOLD, width=3)
        draw.text((540, 795), "LINE OA", font=font(25), fill=NAVY, anchor="mm")
        draw.text((540, 830), "@762jybnm", font=font(20), fill=GREEN, anchor="mm")
    elif variant == "open_shop":
        draw.rounded_rectangle((438, 744, 660, 858), 20, fill="#F6EBD6", outline=GOLD, width=4)
        draw.text((549, 786), "仙加味", font=font(30), fill=NAVY, anchor="mm")
        draw.text((549, 823), "今天也開店了", font=font(21), fill=GREEN, anchor="mm")


def animate_pose(im: Image.Image, t: float, scene: Scene, target_h: int) -> Image.Image:
    """角色本體動畫：非單純整張縮放。

    做法：把角色分為上/下兩段，各自做微小旋轉與位移，再重新合成；
    搭配核准 sprite 的 pose 切換，使頭身、腳步與姿勢在鏡頭內真正發生變化。
    """
    im = contain(im, 320, target_h)
    w, h = im.size
    split = int(h * 0.66)
    upper = im.crop((0, 0, w, min(h, split + 28)))
    lower = im.crop((0, max(0, split - 28), w, h))

    walk = math.sin(t * 5.6)
    breathe = math.sin(t * 2.3)
    upper_ang = 1.7 * breathe
    lower_ang = -0.9 * walk
    upper = upper.rotate(upper_ang, resample=Image.Resampling.BICUBIC, expand=True)
    lower = lower.rotate(lower_ang, resample=Image.Resampling.BICUBIC, expand=True)

    canvas = Image.new("RGBA", (w + 70, h + 70), (0, 0, 0, 0))
    ux = (canvas.width - upper.width) // 2 + int(5 * walk)
    uy = 10 + int(3 * breathe)
    lx = (canvas.width - lower.width) // 2 - int(5 * walk)
    ly = split - 20 + int(3 * abs(walk))
    canvas.alpha_composite(upper, (ux, uy))
    canvas.alpha_composite(lower, (lx, ly))
    return canvas


def shadow_paste(base: Image.Image, im: Image.Image, xy: Tuple[int, int], blur=10):
    alpha = im.getchannel("A")
    sh = Image.new("RGBA", im.size, (22, 18, 12, 0))
    sh.putalpha(alpha.filter(ImageFilter.GaussianBlur(blur)).point(lambda p: int(p * 0.34)))
    base.alpha_composite(sh, (xy[0] + 6, xy[1] + 12))
    base.alpha_composite(im, xy)


def draw_companions(base: Image.Image, poses, t: float, scene: Scene):
    deer = contain(poses["deer"], 108, 122)
    turtle = contain(poses["turtle"], 120, 116)
    d_bob = int(10 * abs(math.sin(t * 3.1)))
    t_bob = int(7 * abs(math.sin(t * 2.4 + 0.7)))
    if scene.name in {"friends_arrive", "open_shop", "shop_rhythm"}:
        shadow_paste(base, deer, (480, 835 - d_bob), blur=4)
        shadow_paste(base, turtle, (584, 850 - t_bob), blur=4)
    else:
        shadow_paste(base, deer, (528, 842 - d_bob), blur=4)
        shadow_paste(base, turtle, (620, 854 - t_bob), blur=4)


def wrap(draw, text, fnt, maxw):
    lines, cur = [], ""
    for ch in text:
        test = cur + ch
        if draw.textbbox((0, 0), test, font=fnt)[2] <= maxw:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines[:3]


def subtitle_at(t: float) -> str:
    for a, b, txt in SUBTITLES:
        if a <= t < b:
            return txt
    return ""


def draw_subtitle(base: Image.Image, text: str):
    if not text:
        return
    draw = ImageDraw.Draw(base)
    fnt = font(34)
    lines = wrap(draw, text, fnt, 600)
    box_h = 40 + 50 * len(lines)
    y0 = H - 245 - box_h
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle((44, y0, W - 44, y0 + box_h), 24, fill=(12, 28, 45, 210))
    y = y0 + 20
    for line in lines:
        od.text((W // 2, y), line, font=fnt, fill=WHITE, anchor="ma")
        y += 50
    base.alpha_composite(overlay)


def render_frame(t: float, poses) -> Image.Image:
    base = Image.new("RGBA", (W, H), CREAM)
    draw = ImageDraw.Draw(base)
    scene = current_scene(t)
    draw_apothecary(draw, scene.name, t)

    # 角色定位：以多鏡位 x/y/尺寸變化，但不靠整張畫面 pan/zoom。
    lt = local_time(t, scene)
    positions = {
        "morning_door": (80, 420, 600),
        "wipe_table": (95, 430, 610),
        "friends_arrive": (72, 420, 620),
        "organize_shelf": (74, 460, 560),
        "warm_drink": (85, 430, 610),
        "shop_rhythm": (80, 462, 560),
        "ready_counter": (70, 430, 610),
        "open_shop": (76, 410, 625),
    }
    x, y, th = positions[scene.name]
    source = poses.get(scene.pose, poses["main"])
    char = animate_pose(source, t, scene, th)

    # 場景內腳步／站姿，角色自身相對位置小幅改變；不是整張圖平移。
    if scene.name == "wipe_table":
        x += int(18 * math.sin(lt * math.pi * 2))
    elif scene.name == "friends_arrive":
        y += int(5 * math.sin(t * 4.2))
    elif scene.name == "open_shop":
        x += int(8 * math.sin(t * 3.2))

    shadow_paste(base, char, (x, y), blur=12)
    draw_companions(base, poses, t, scene)

    # 場景標題（簡短，不做大量字卡）
    labels = {
        "morning_door": "開店前",
        "wipe_table": "整理桌面",
        "friends_arrive": "夥伴報到",
        "organize_shelf": "把東西放回位置",
        "warm_drink": "準備溫熱飲",
        "shop_rhythm": "照自己的節奏",
        "ready_counter": "準備接待",
        "open_shop": "今天開店了",
    }
    draw.rounded_rectangle((42, 172, 250, 224), 22, fill="#EFE3D4")
    draw.text((146, 198), labels[scene.name], font=font(22), fill=RED, anchor="mm")

    draw_subtitle(base, subtitle_at(t))
    draw.text((W // 2, H - 74), "仙加味｜補養，是一種節奏。", font=font(24), fill="#F7EFD9", anchor="mm")
    return base.convert("RGB")


def validate_copy():
    joined = "\n".join(x[2] for x in SUBTITLES)
    for bad in FORBIDDEN_PUBLIC:
        if bad in joined:
            raise SystemExit(f"blocked public term in subtitle: {bad}")


def render_video(out_path: Path):
    validate_copy()
    poses = load_sprite()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(out_path)
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for i in range(FRAME_COUNT):
        t = i / FPS
        frame = render_frame(t, poses)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise SystemExit(f"ffmpeg failed: {rc}")


def mux_audio(video: Path, audio: Path, out: Path):
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-i", str(audio),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
        "-shortest", "-movflags", "+faststart", str(out)
    ]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="artifacts/short2-opening-shop-preview.mp4")
    ap.add_argument("--voice-file", default="", help="核准語音檔；未提供則產出字幕 technical preview")
    args = ap.parse_args()

    out = ROOT / args.out
    if args.voice_file:
        tmp = out.with_name(out.stem + "-silent.mp4")
        render_video(tmp)
        voice = ROOT / args.voice_file
        if not voice.exists():
            raise SystemExit(f"voice file missing: {voice}")
        mux_audio(tmp, voice, out)
        tmp.unlink(missing_ok=True)
        print(f"PASS formal-ready render candidate with approved audio: {out}")
    else:
        render_video(out)
        print(f"PASS technical preview (subtitle-only; DO NOT AUTO-PUBLISH): {out}")


if __name__ == "__main__":
    main()
