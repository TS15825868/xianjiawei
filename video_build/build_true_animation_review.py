from pathlib import Path
import requests, subprocess, imageio_ffmpeg, shutil

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public_true_animation'
WORK = ROOT / 'work_true_animation'
PUBLIC.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

# 目前先沿用三段已成功生成的真正角色動畫。
# 新動畫生成額度目前受限，因此本版優先修正「童聲自然度、停頓節奏、字幕節奏、30 秒 CTA」。
# 不把重複動畫誤標成最終正式成片，待新動畫生成能力恢復後再逐段換成走路／蹲下／坐下／趴著／互動等新場景。
CLIPS = [
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061028_485b7985-7bc9-4913-94dc-1892efe246be.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061658_c6ff7037-5ae3-4061-ba82-80058c5e0776.mp4',
    'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_062503_9f51994a-1fd9-4252-8686-091c08b1724d.mp4',
]

FONT_URL = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/OTF/Subset/NotoSansTC-VF.otf'
TOTAL = 30.0

# V3 自然童聲測試：改用較輕快的男聲底聲，每一句獨立生成。
# 完全取消 +3～4 半音硬升調與成人共鳴 EQ；只做音量標準化。
# 每句之間的停頓由後製人工控制，不讓 TTS 自己決定整段節奏。
VOICE_PARTS = [
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/25a40947b46942c1a8e5bd329074bba2/id=9b04a99b-9a9c-46fa-bb60-cf54847834a6.wav', 0.45),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/25a40947b46942c1a8e5bd329074bba2/id=4063391e-9302-46f1-a21c-7fc84dae5fff.wav', 3.05),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/25a40947b46942c1a8e5bd329074bba2/id=827ef4c4-668c-4907-98c5-dd082d1e4996.wav', 5.85),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/25a40947b46942c1a8e5bd329074bba2/id=0efb7fd0-e7ec-4d7e-9a6f-ff8ce0f0c0a0.wav', 8.10),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/25a40947b46942c1a8e5bd329074bba2/id=28aba49e-d805-43d9-9ae6-f01c0ff7d1c0.wav', 13.00),
    ('https://resource2.heygen.ai/text_to_speech/a1e4862b123841a2acf5ce54f0f2398b/25a40947b46942c1a8e5bd329074bba2/id=9c37d079-7d84-48e2-b217-ab433c8c5893.wav', 17.00),
]

CAPTIONS = [
    ('嗨！我是仙加味小老闆。', 0.40, 2.70),
    ('這是小鹿，還有小烏龜。', 3.00, 5.65),
    ('他們常常都陪著我。', 5.80, 7.95),
    ('我有時候在這裡幫忙，\\N有時候就到處走走、看看。', 8.05, 12.65),
    ('休息一下，\\N再繼續忙自己的事。', 12.95, 16.20),
    ('下次，我再帶你們一起\\N認識仙加味喔！', 16.95, 20.65),
]
BRAND = '仙加味｜補養，是一種節奏。'
BRAND_CUT = (21.20, 25.45)
CTA = '想了解更多，\\N歡迎加入仙加味官方 LINE 詢問'
CTA_CUT = (25.80, 30.00)


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

# 六段真動畫以動作意義重新排序：
# 揮手／互動 → 揮手延續 → 桌邊整理 → 坐下喝溫熱飲 → 整理 → 收尾。
# 每段 5 秒、交疊 0.6 秒，前 27 秒維持動態，最後 3 秒穩定停留給 CTA 閱讀。
segment_duration = 5.0
order = [0, 0, 1, 2, 1, 0]
segments = []
for i, clip_idx in enumerate(order):
    src = WORK / f'clip{clip_idx + 1}.mp4'
    if not src.exists():
        dl(CLIPS[clip_idx], src)
    out = WORK / f'seg30natural_{i + 1}.mp4'
    # 第二次使用同一段時只做非常輕的安全推近，不翻轉，不讓胸前品牌字樣反向。
    if i in (1, 4):
        framing = 'scale=1134:2016,crop=1080:1920:27:48'
    else:
        framing = 'scale=1080:1920'
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

base = WORK / 'animation_base_30s_natural.mp4'
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

# 逐句下載，靠人工設定的開始時間排節奏；不再把整段 TTS 直接丟進影片。
voice_files = []
for idx, (url, _start) in enumerate(VOICE_PARTS):
    path = WORK / f'voice_natural_{idx + 1}.wav'
    dl(url, path)
    voice_files.append(path)

voice = WORK / 'voice_30s_natural_mix.wav'
voice_inputs = []
for path in voice_files:
    voice_inputs += ['-i', str(path)]

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
    'loudnorm=I=-16:TP=-1.5:LRA=11,'
    f'apad=pad_dur={TOTAL},atrim=0:{TOTAL}[aout]'
)
run([
    ffmpeg, '-y', *voice_inputs,
    '-filter_complex', ';'.join(filters), '-map', '[aout]',
    '-ar', '44100', '-ac', '2', str(voice)
])

# 公開同一條30秒口白音軌，供專門的 lip-sync 工作流測試嘴型同步。
public_voice = PUBLIC / 'xianjiawei-voice-review.wav'
shutil.copy2(voice, public_voice)

# 第一輪先把童聲本身修自然；背景音樂等聲音通過後再加。
# 如加入 BGM，必須使用可正式商用的授權素材，且口白期間自動壓低音量，不蓋住小老闆聲音。
fontfile = WORK / 'NotoSansTC-VF.otf'
dl(FONT_URL, fontfile)
ass = WORK / 'captions_30s_natural.ass'
header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,Noto Sans TC,72,&H00EDF4F7,&H00EDF4F7,&H001A1A1A,&H6034210E,-1,0,0,0,100,100,0,0,3,1,0,2,55,55,130,1
Style: Brand,Noto Sans TC,62,&H00EDF4F7,&H00EDF4F7,&H003D2C16,&H7014210E,-1,0,0,0,100,100,0,0,3,1,0,2,70,70,150,1
Style: CTA,Noto Sans TC,64,&H00EDF4F7,&H00EDF4F7,&H003D2C16,&H8814210E,-1,0,0,0,100,100,0,0,3,1,0,2,70,70,150,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
'''
events = ''
for text, start, end in CAPTIONS:
    safe = text.replace('{', '｛').replace('}', '｝')
    events += f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,{{\\fad(90,100)}}{safe}\n'
brand_safe = BRAND.replace('{', '｛').replace('}', '｝')
events += f'Dialogue: 0,{ass_time(BRAND_CUT[0])},{ass_time(BRAND_CUT[1])},Brand,,0,0,0,,{{\\fad(160,160)}}{brand_safe}\n'
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
<title>仙加味｜認識小老闆｜30秒自然童聲 V3 待審核版</title>
<style>
body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}
h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.65}
</style>
<main><video controls playsinline preload="metadata" src="xianjiawei-true-animation-review.mp4"></video>
<h1>仙加味｜認識小老闆｜30秒自然童聲 V3 待審核版</h1>
<p>逐句配音｜人工停頓｜取消硬升調與成人 EQ｜大字字幕｜真角色動畫｜品牌收尾｜官方 LINE CTA 4.2秒｜待人工審核</p></main></html>''', encoding='utf-8')
print('FINAL', final, final.stat().st_size, 'duration', TOTAL)
print('VOICE', public_voice, public_voice.stat().st_size)
