from pathlib import Path
import requests, subprocess, imageio_ffmpeg, shutil

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public_true_animation'
WORK = ROOT / 'work_true_animation'
PUBLIC.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
TOTAL = 30.0

SCENES = [
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/3d9fd8cf-4cf2-4288-8a8e-7dde3f95aaae.png', 170, '工作桌邊'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/f77c11f9-79ed-4eb3-b11f-f28a91e84075.png', 210, '陪伴互動'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/92edaff1-800a-49ad-821d-dc8cf78b4779.png', 190, '日常補水'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/4a5f7698-3e98-4ed2-adce-b43ec7ea53d0.png', 205, '桌邊料理'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/f1dd3a52-c9e1-49b5-ba11-ec7f01bdc15b.png', 185, '外出看看'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/ea9d38ce-c452-4eac-b71a-8174b8713966.png', 175, '溫熱飲'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/c599a2e3-a7b4-4bad-8d36-227af748a38c.png', 185, '雨天休息'),
    ('https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/bcdc6cfe-c1cc-404a-90e7-82c63e5537f1.png', 195, '換季收尾'),
]

VOICE_PARTS = [
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=1d7e444e-9db8-4392-a46d-91c1671d3dc8.wav', 0.35),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=5b971047-38da-4f4e-9c4f-1b1d347aefa3.wav', 3.20),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=c459b9e4-976b-4b19-aebb-eee46540841f.wav', 6.10),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=4f23c025-f93e-4e21-8cd9-2c6ab762ef77.wav', 8.75),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=453075b6-6664-484b-9784-40afbeaa51b8.wav', 11.45),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=4fdade6a-a146-4e54-80d8-01f5856725dd.wav', 14.85),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/1335bb2f851a41848306f22787267439/id=e5b9b58e-8c91-45b6-9f8a-10f57b8ee0ef.wav', 18.15),
]

CAPTIONS = [
    ('嗨！我是仙加味小老闆。', 0.35, 2.55),
    ('這是小鹿，還有小烏龜。', 3.20, 5.55),
    ('他們常常都會陪著我。', 6.10, 8.00),
    ('我有時候會在這裡幫忙。', 8.75, 10.85),
    ('有時候也會到處走走、看看。', 11.45, 14.05),
    ('累了就坐一下，\\N休息一下再繼續。', 14.85, 17.05),
    ('下次再帶你們一起\\N認識仙加味喔！', 18.15, 21.10),
]
BRAND = '仙加味｜補養，是一種節奏。'
BRAND_CUT = (24.70, 26.25)
CTA = '想了解更多，\\N歡迎加入仙加味官方 LINE 詢問'
CTA_CUT = (26.00, 30.00)

FONT_URL = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/OTF/Subset/NotoSansTC-VF.otf'
LOGO_URL = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/c08dfe3c-4ea7-46b5-8fd1-75a99f98a815.png'

def dl(url: str, path: Path):
    if path.exists() and path.stat().st_size > 1024:
        return
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

scene_duration = 3.35
scene_paths = []
for i, (url, crop_x, _name) in enumerate(SCENES, start=1):
    src = WORK / f'scene_source_{i}.png'
    dl(url, src)
    out = WORK / f'scene_motion_{i}.mp4'
    pan = [
        "x='iw/2-(iw/zoom/2)-18+on*0.08':y='ih/2-(ih/zoom/2)'",
        "x='iw/2-(iw/zoom/2)+18-on*0.07':y='ih/2-(ih/zoom/2)+8'",
        "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-12+on*0.05'",
        "x='iw/2-(iw/zoom/2)-10':y='ih/2-(ih/zoom/2)+12-on*0.04'",
    ][(i-1) % 4]
    vf = (
        "split=2[rawbg][rawfg];"
        "[rawbg]scale=1920:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920:(iw-ow)/2:(ih-oh)/2,gblur=sigma=42,eq=brightness=-0.10:saturation=0.88[bg];"
        f"[rawfg]crop=660:900:{crop_x}:300,scale=980:-2[fg];"
        "[bg][fg]overlay=(W-w)/2:360:format=auto[comp];"
        f"[comp]zoompan=z='min(zoom+0.00065,1.055)':{pan}:d=101:s=1080x1920:fps=30,"
        "fade=t=in:st=0:d=0.12,fade=t=out:st=3.20:d=0.15,format=yuv420p"
    )
    run([
        ffmpeg, '-y', '-loop', '1', '-i', str(src), '-an', '-vf', vf,
        '-t', str(scene_duration), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
        '-pix_fmt', 'yuv420p', str(out)
    ])
    scene_paths.append(out)

logo = WORK / 'official_logo.png'
dl(LOGO_URL, logo)
endcard = WORK / 'endcard.mp4'
run([
    ffmpeg, '-y', '-f', 'lavfi', '-i', 'color=c=0x10283D:s=1080x1920:r=30:d=5.6',
    '-loop', '1', '-i', str(logo),
    '-filter_complex', '[1:v]scale=230:-2[lg];[0:v][lg]overlay=(W-w)/2:420:format=auto,format=yuv420p[v]',
    '-map', '[v]', '-an', '-t', '5.6', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', str(endcard)
])

base = WORK / 'ep01_visual_base.mp4'
inputs = []
for p in scene_paths:
    inputs += ['-i', str(p)]
inputs += ['-i', str(endcard)]
fc = (
    '[0:v][1:v]xfade=transition=fade:duration=0.3:offset=3.05[v01];'
    '[v01][2:v]xfade=transition=fade:duration=0.3:offset=6.10[v02];'
    '[v02][3:v]xfade=transition=fade:duration=0.3:offset=9.15[v03];'
    '[v03][4:v]xfade=transition=fade:duration=0.3:offset=12.20[v04];'
    '[v04][5:v]xfade=transition=fade:duration=0.3:offset=15.25[v05];'
    '[v05][6:v]xfade=transition=fade:duration=0.3:offset=18.30[v06];'
    '[v06][7:v]xfade=transition=fade:duration=0.3:offset=21.35[v07];'
    '[v07][8:v]xfade=transition=fade:duration=0.3:offset=24.40[vout]'
)
run([
    ffmpeg, '-y', *inputs, '-filter_complex', fc, '-map', '[vout]', '-an',
    '-t', str(TOTAL), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', str(base)
])

voice_files = []
for idx, (url, _start) in enumerate(VOICE_PARTS, start=1):
    p = WORK / f'voice_v4_{idx}.wav'
    dl(url, p)
    voice_files.append(p)
voice = WORK / 'voice_v4_mix.wav'
voice_inputs = []
for p in voice_files:
    voice_inputs += ['-i', str(p)]
filters = []
labels = []
for idx, (_url, start) in enumerate(VOICE_PARTS):
    delay_ms = int(round(start * 1000))
    label = f'a{idx}'
    filters.append(f'[{idx}:a]adelay={delay_ms}:all=1[{label}]')
    labels.append(f'[{label}]')
filters.append(
    ''.join(labels) +
    f'amix=inputs={len(labels)}:duration=longest:dropout_transition=0,'
    'highpass=f=85,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=10,'
    f'apad=pad_dur={TOTAL},atrim=0:{TOTAL}[aout]'
)
run([
    ffmpeg, '-y', *voice_inputs, '-filter_complex', ';'.join(filters), '-map', '[aout]',
    '-ar', '44100', '-ac', '2', str(voice)
])
shutil.copy2(voice, PUBLIC / 'xianjiawei-voice-review.wav')

fontfile = WORK / 'NotoSansTC-VF.otf'
dl(FONT_URL, fontfile)
ass = WORK / 'captions_ep01_v4.ass'
header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,Noto Sans TC,78,&H00F7F4ED,&H00F7F4ED,&H00131B21,&H7010212F,-1,0,0,0,100,100,0,0,3,1,0,2,58,58,150,1
Style: Brand,Noto Sans TC,66,&H00F7F4ED,&H00F7F4ED,&H00131B21,&H0010212F,-1,0,0,0,100,100,0,0,1,2,1,2,72,72,620,1
Style: CTA,Noto Sans TC,68,&H00F7F4ED,&H00F7F4ED,&H00131B21,&H0010212F,-1,0,0,0,100,100,0,0,1,2,1,2,72,72,610,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
'''
events = ''
for text, start, end in CAPTIONS:
    safe = text.replace('{', '｛').replace('}', '｝')
    events += f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{{\\fad(80,100)}}{safe}\n'
events += f'Dialogue: 0,{ass_time(BRAND_CUT[0])},{ass_time(BRAND_CUT[1])},Brand,,0,0,0,,{{\\fad(120,120)}}{BRAND}\n'
events += f'Dialogue: 0,{ass_time(CTA_CUT[0])},{ass_time(CTA_CUT[1])},CTA,,0,0,0,,{{\\fad(150,100)}}{CTA}\n'
ass.write_text(header + events, encoding='utf-8')

final = PUBLIC / 'xianjiawei-true-animation-review.mp4'
ass_path = ass.as_posix().replace(':', r'\:')
font_dir = WORK.as_posix().replace(':', r'\:')
run([
    ffmpeg, '-y', '-i', str(base), '-i', str(voice),
    '-vf', f'ass={ass_path}:fontsdir={font_dir}',
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-t', str(TOTAL), str(final)
])

(PUBLIC / 'index.html').write_text('''<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>仙加味｜認識小老闆｜30秒多場景待審核版</title>
<style>
body{margin:0;background:#10283d;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}
h1{font-size:20px;margin:16px 0 6px}p{opacity:.86;line-height:1.65;font-size:14px}
.badge{display:inline-block;padding:6px 10px;border:1px solid #c9a05c;border-radius:999px;color:#e8cc98;font-size:12px;margin-top:8px}
</style>
<main><video controls playsinline preload="metadata" src="xianjiawei-true-animation-review.mp4"></video>
<h1>仙加味｜認識小老闆｜30秒多場景待審核版</h1>
<p>8個不同生活場景｜新分句童聲｜大字字幕｜品牌收尾｜官方 LINE CTA 4秒</p>
<div class="badge">嘴型同步：待 Avatar IV 月額度恢復後只替換說話鏡頭，不重做整支影片</div>
</main></html>''', encoding='utf-8')
print('FINAL', final, final.stat().st_size, 'duration', TOTAL)
