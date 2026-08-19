from pathlib import Path
import requests, subprocess, imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public_true_animation'
WORK = ROOT / 'work_true_animation'
PUBLIC.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

# 三段皆為先前已成功生成的真正角色動畫，不是靜態圖片推移。
CLIPS = [
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061028_485b7985-7bc9-4913-94dc-1892efe246be.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061658_c6ff7037-5ae3-4061-ba82-80058c5e0776.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_062503_9f51994a-1fd9-4252-8686-091c08b1724d.mp4',
]
FONT_URL = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/OTF/Subset/NotoSansTC-VF.otf'
CAPTIONS = [
    '嗨，我是仙加味小老闆。',
    '忙了一陣子，先坐下來休息一下。',
    '喝口溫熱的，整理一下，再繼續。',
    '仙加味，補養，是一種節奏。',
]


def dl(url: str, path: Path):
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    path.write_bytes(r.content)
    print('downloaded', path.name, len(r.content))


def run(args):
    print('RUN', ' '.join(map(str, args)))
    subprocess.run(args, check=True)

# 比上一版再慢一點，但不拉成停格感。
slow_factor = 2.0
seg_dur = 4.0
segments = []
for i, url in enumerate(CLIPS, 1):
    src = WORK / f'clip{i}.mp4'
    out = WORK / f'seg{i}.mp4'
    dl(url, src)
    vf = (
        'scale=1080:1920:force_original_aspect_ratio=increase,'
        'crop=1080:1920,'
        f'setpts={slow_factor}*PTS,'
        'fps=30,format=yuv420p'
    )
    run([
        ffmpeg, '-y', '-i', str(src), '-an', '-vf', vf,
        '-t', str(seg_dur), '-c:v', 'libx264', '-crf', '18',
        '-preset', 'medium', str(out)
    ])
    segments.append(out)

# 長交疊柔順銜接，不硬切、不使用花俏轉場。
xf = 0.55
offset1 = seg_dur - xf
offset2 = seg_dur * 2 - xf * 2
total = seg_dur * 3 - xf * 2

# 正式繁中字型與字幕文字檔。
fontfile = WORK / 'NotoSansTC-VF.otf'
dl(FONT_URL, fontfile)
for i, text in enumerate(CAPTIONS, 1):
    (WORK / f'caption{i}.txt').write_text(text, encoding='utf-8')

# 字幕依閱讀節奏配置，不跟分鏡硬切；第四句穩定停留到片尾。
CUTS = [(0.0, 2.2), (2.2, 5.25), (5.25, 8.15), (8.15, total)]

final = PUBLIC / 'xianjiawei-true-animation-review.mp4'
fc = (
    f'[0:v][1:v]xfade=transition=fade:duration={xf}:offset={offset1}[v01];'
    f'[v01][2:v]xfade=transition=fade:duration={xf}:offset={offset2}[base];'
)
prev = 'base'
for i, (start, end) in enumerate(CUTS, 1):
    outlabel = f'v{i}'
    textfile = (WORK / f'caption{i}.txt').as_posix().replace(':', '\\:')
    fontpath = fontfile.as_posix().replace(':', '\\:')
    fc += (
        f'[{prev}]drawtext=fontfile={fontpath}:textfile={textfile}:'
        f'fontcolor=0xF7F4ED:fontsize=54:'
        f'box=1:boxcolor=0x0E2134@0.82:boxborderw=26:'
        f'x=(w-text_w)/2:y=h-text_h-150:'
        f"enable='between(t,{start:.2f},{end:.2f})'[{outlabel}];"
    )
    prev = outlabel

run([
    ffmpeg, '-y', '-i', str(segments[0]), '-i', str(segments[1]), '-i', str(segments[2]),
    '-filter_complex', fc, '-map', f'[{prev}]', '-an',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(final)
])

(PUBLIC / 'index.html').write_text('''<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>仙加味｜F版真正角色動畫</title>
<style>
body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}
h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.65}
</style>
<main><video controls playsinline preload="metadata" src="xianjiawei-true-animation-review.mp4"></video>
<h1>仙加味｜F版真正角色動畫</h1><p>自然文案｜角色本體真動畫｜柔順交疊｜無錯誤配音｜待人工審核</p></main></html>''', encoding='utf-8')
print('FINAL', final, final.stat().st_size, 'duration', total)
