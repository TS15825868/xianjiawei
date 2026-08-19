from pathlib import Path
import requests, subprocess, imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public_true_animation'
WORK = ROOT / 'work_true_animation'
PUBLIC.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

# 目前先沿用三段已成功生成的真正角色動畫，組成 30 秒「認識小老闆」結構待審核版。
# 新的場景生成目前受外部生成額度限制，因此這版先驗證 30 秒節奏、口白、字幕與 LINE CTA；
# 不把重複動畫誤標成最終正式成片，待新動畫可生成後再逐段替換成走路／蹲下／坐下／互動等完整新場景。
CLIPS = [
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061028_485b7985-7bc9-4913-94dc-1892efe246be.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061658_c6ff7037-5ae3-4061-ba82-80058c5e0776.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_062503_9f51994a-1fd9-4252-8686-091c08b1724d.mp4',
]

# 30 秒版正式方向口白，HeyGen zh-TW 0.96x 生成，原始口白約 25.52 秒。
# 後製再往約 5 歲自然小男孩聲線推進，片尾保留 3 秒以上 LINE CTA。
TEMP_VOICE_URL = 'https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/2d432723a02444acb48e28ada714cc43/id=e0c07a51-3254-484b-a99e-fab6f16d6722.wav'
FONT_URL = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/OTF/Subset/NotoSansTC-VF.otf'

CAPTIONS = [
    ('嗨，我是仙加味小老闆。', 0.25, 2.90),
    ('平常我會在這裡忙東忙西，\\N也會跟小鹿、小烏龜一起到處晃晃。', 3.25, 9.10),
    ('有時候整理東西，', 9.45, 11.05),
    ('有時候坐下來休息，\\N喝口溫熱的，再繼續。', 11.20, 15.30),
    ('以後我會帶你慢慢認識仙加味，\\N還有我們平常在做的事情。', 15.50, 21.75),
    ('仙加味，補養，\\N是一種節奏。', 22.10, 25.40),
]
CTA = '想了解更多，\\N歡迎加入仙加味官方 LINE 詢問'
CTA_CUT = (26.55, 30.00)
TOTAL = 30.0


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

# 六段真動畫：三段各使用兩次。第二輪只做輕微鏡頭推近，不翻轉角色，避免胸前品牌字樣反向。
# 每段 5 秒、相鄰柔順交疊 0.6 秒，六段合計 27 秒，再以最後動態畫面的尾格穩定停留到 30 秒給 CTA 閱讀。
segment_duration = 5.0
xf = 0.6
order = [0, 1, 2, 0, 1, 2]
segments = []
for i, clip_idx in enumerate(order):
    src = WORK / f'clip{clip_idx + 1}.mp4'
    if not src.exists():
        dl(CLIPS[clip_idx], src)
    out = WORK / f'seg30_{i + 1}.mp4'
    if i < 3:
        framing = 'scale=1080:1920'
    else:
        framing = 'scale=1188:2112,crop=1080:1920:54:96'
    vf = (
        f'{framing},'
        'trim=start=0:end=2.0,'
        'setpts=2.5*(PTS-STARTPTS),'
        'fps=30,format=yuv420p'
    )
    run([
        ffmpeg, '-y', '-i', str(src), '-an', '-vf', vf,
        '-t', str(segment_duration), '-c:v', 'libx264', '-crf', '18',
        '-preset', 'medium', str(out)
    ])
    segments.append(out)

# 6 段連續柔順交疊，最後 tpad 3 秒讓 CTA 真正停留夠久。
base = WORK / 'animation_base_30s.mp4'
fc = (
    '[0:v][1:v]xfade=transition=fade:duration=0.6:offset=4.4[v01];'
    '[v01][2:v]xfade=transition=fade:duration=0.6:offset=8.8[v02];'
    '[v02][3:v]xfade=transition=fade:duration=0.6:offset=13.2[v03];'
    '[v03][4:v]xfade=transition=fade:duration=0.6:offset=17.6[v04];'
    '[v04][5:v]xfade=transition=fade:duration=0.6:offset=22.0[v05];'
    '[v05]tpad=stop_mode=clone:stop_duration=3.0[vout]'
)
run([
    ffmpeg, '-y',
    '-i', str(segments[0]), '-i', str(segments[1]), '-i', str(segments[2]),
    '-i', str(segments[3]), '-i', str(segments[4]), '-i', str(segments[5]),
    '-filter_complex', fc, '-map', '[vout]', '-an',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', '-t', str(TOTAL), str(base)
])

# 更幼齒暫用聲線：+3.7 半音，削弱成人胸腔低頻、略提清晰度。
# 仍屬暫用聲，不冒充正式 5～6 歲男童聲音母本。
voice_src = WORK / 'voice_30s_source.wav'
voice = WORK / 'voice_30s_childlike_temp.wav'
dl(TEMP_VOICE_URL, voice_src)
run([
    ffmpeg, '-y', '-i', str(voice_src),
    '-af', 'asetrate=44100*1.238750,aresample=44100,atempo=0.807265,highpass=f=145,equalizer=f=190:t=q:w=1:g=-4.2,equalizer=f=320:t=q:w=1:g=-1.8,equalizer=f=3900:t=q:w=1:g=1.6,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '44100', '-ac', '2', str(voice)
])

fontfile = WORK / 'NotoSansTC-VF.otf'
dl(FONT_URL, fontfile)
ass = WORK / 'captions_30s.ass'
header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,Noto Sans TC,72,&H00EDF4F7,&H00EDF4F7,&H001A1A1A,&H6034210E,-1,0,0,0,100,100,0,0,3,1,0,2,55,55,130,1
Style: CTA,Noto Sans TC,64,&H00EDF4F7,&H00EDF4F7,&H003D2C16,&H8814210E,-1,0,0,0,100,100,0,0,3,1,0,2,70,70,150,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
'''
events = ''
for text, start, end in CAPTIONS:
    safe = text.replace('{', '｛').replace('}', '｝')
    events += f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{{\\fad(100,120)}}{safe}\n'
cta_safe = CTA.replace('{', '｛').replace('}', '｝')
events += f'Dialogue: 0,{ass_time(CTA_CUT[0])},{ass_time(CTA_CUT[1])},CTA,,0,0,0,,{{\\fad(180,120)}}{cta_safe}\n'
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
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', str(TOTAL), str(final)
])

(PUBLIC / 'index.html').write_text('''<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>仙加味｜認識小老闆｜30秒結構待審核版</title>
<style>
body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}
h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.65}
</style>
<main><video controls playsinline preload="metadata" src="xianjiawei-true-animation-review.mp4"></video>
<h1>仙加味｜認識小老闆｜30秒結構待審核版</h1>
<p>30秒直式｜更幼齒暫用聲｜大字字幕｜真角色動畫｜片尾官方 LINE CTA 3秒以上｜目前先驗證節奏，待新場景動畫替換後再作正式審核</p></main></html>''', encoding='utf-8')
print('FINAL', final, final.stat().st_size, 'duration', TOTAL)
