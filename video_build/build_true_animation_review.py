from pathlib import Path
import requests, subprocess, imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public_true_animation'
WORK = ROOT / 'work_true_animation'
PUBLIC.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

# 這三段都是先前已成功生成的真正角色動畫，不是靜態圖片推移。
CLIPS = [
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061028_485b7985-7bc9-4913-94dc-1892efe246be.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061658_c6ff7037-5ae3-4061-ba82-80058c5e0776.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_062503_9f51994a-1fd9-4252-8686-091c08b1724d.mp4',
]


def dl(url: str, path: Path):
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    path.write_bytes(r.content)
    print('downloaded', path.name, len(r.content))


def run(args):
    print('RUN', ' '.join(map(str, args)))
    subprocess.run(args, check=True)

# 每段原始動畫約 2 秒；只做輕度放慢，避免角色動作變得拖泥帶水。
slow_factor = 1.28
seg_dur = 2.55
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

# 長交疊柔順銜接：不是硬切，也不使用花俏轉場。
xf = 0.48
offset1 = seg_dur - xf
offset2 = seg_dur * 2 - xf * 2
final = PUBLIC / 'xianjiawei-true-animation-review.mp4'
fc = (
    f'[0:v][1:v]xfade=transition=fade:duration={xf}:offset={offset1}[v01];'
    f'[v01][2:v]xfade=transition=fade:duration={xf}:offset={offset2}[vout]'
)
run([
    ffmpeg, '-y', '-i', str(segments[0]), '-i', str(segments[1]), '-i', str(segments[2]),
    '-filter_complex', fc, '-map', '[vout]', '-an',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(final)
])

(PUBLIC / 'index.html').write_text('''<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>仙加味｜真正角色動畫測試</title>
<style>
body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}
h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.65}
</style>
<main><video controls playsinline preload="metadata" src="xianjiawei-true-animation-review.mp4"></video>
<h1>仙加味｜真正角色動畫測試</h1><p>角色本體真動畫｜柔順交疊｜無配音｜待人工審核</p></main></html>''', encoding='utf-8')
print('FINAL', final, final.stat().st_size)
