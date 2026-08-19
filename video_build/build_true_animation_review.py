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

# V1 暫用聲音：先用可講中文的年輕男聲，後續可直接替換正式小老闆聲音母本。
TEMP_VOICE_URL = 'https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/01f98ed43e6140349f47dbd37a416827/id=eef6af71-bff8-49aa-a5ea-6b7a2048b022.wav'
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


def ass_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f'{h}:{m:02d}:{s:05.2f}'

# 口白約 13.14 秒，動畫同步延長到 13.15 秒；維持真動畫，不以靜態圖補時間。
slow_factor = 2.375
seg_dur = 4.75
xf = 0.55
total = seg_dur * 3 - xf * 2
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

# 柔順交疊，不硬切、不使用花俏轉場。
offset1 = seg_dur - xf
offset2 = seg_dur * 2 - xf * 2
base = WORK / 'animation_base.mp4'
fc = (
    f'[0:v][1:v]xfade=transition=fade:duration={xf}:offset={offset1}[v01];'
    f'[v01][2:v]xfade=transition=fade:duration={xf}:offset={offset2}[vout]'
)
run([
    ffmpeg, '-y', '-i', str(segments[0]), '-i', str(segments[1]), '-i', str(segments[2]),
    '-filter_complex', fc, '-map', '[vout]', '-an',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', str(base)
])

# 下載暫用口白並做非常輕微的童聲化（+1 半音）；不壓低成成人男聲，也不過度升高成女童聲。
voice_src = WORK / 'voice_temp_source.wav'
voice = WORK / 'voice_temp_v1.wav'
dl(TEMP_VOICE_URL, voice_src)
run([
    ffmpeg, '-y', '-i', str(voice_src),
    '-af', 'asetrate=44100*1.059463,aresample=44100,atempo=0.943874,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '44100', '-ac', '2', str(voice)
])

# 字幕直接依 HeyGen 回傳的實際逐字時間點安排，不再平均切段。
fontfile = WORK / 'NotoSansTC-VF.otf'
dl(FONT_URL, fontfile)
CUTS = [
    (0.20, 2.80),   # 嗨，我是仙加味小老闆。
    (2.95, 6.12),   # 忙了一陣子，先坐下來休息一下。
    (6.12, 9.20),   # 喝口溫熱的，整理一下，再繼續。
    (9.95, total),  # 仙加味，補養，是一種節奏。
]
ass = WORK / 'captions.ass'
header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,Noto Sans TC,54,&H00EDF4F7,&H00EDF4F7,&H001A1A1A,&H6034210E,0,0,0,0,100,100,0,0,3,1,0,2,55,55,125,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
'''
events = ''
for text, (start, end) in zip(CAPTIONS, CUTS):
    safe = text.replace('{', '｛').replace('}', '｝')
    events += f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{safe}\n'
ass.write_text(header + events, encoding='utf-8')

final = PUBLIC / 'xianjiawei-true-animation-review.mp4'
ass_path = ass.as_posix().replace(':', r'\:')
font_dir = WORK.as_posix().replace(':', r'\:')
vf = f'ass={ass_path}:fontsdir={font_dir}'
run([
    ffmpeg, '-y', '-i', str(base), '-i', str(voice),
    '-vf', vf, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-shortest', str(final)
])

(PUBLIC / 'index.html').write_text('''<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>仙加味｜V1 暫用聲音版</title>
<style>
body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}
h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.65}
</style>
<main><video controls playsinline preload="metadata" src="xianjiawei-true-animation-review.mp4"></video>
<h1>仙加味｜V1 暫用聲音版</h1>
<p>自然文案｜真正角色動畫｜柔順轉場｜暫用近似男童聲｜後續直接替換正式小老闆聲音｜待人工審核</p></main></html>''', encoding='utf-8')
print('FINAL', final, final.stat().st_size, 'duration', total)
