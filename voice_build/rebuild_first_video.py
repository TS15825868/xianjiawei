from pathlib import Path
import requests, subprocess, imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public'
WORK = ROOT / 'work'
PUBLIC.mkdir(exist_ok=True)
WORK.mkdir(exist_ok=True)

VIDEO_URL = 'https://xianjiawei-first-official-reel-20260819.onrender.com/xianjiawei-first-official-reel.mp4'
VOICE_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_071444_30961a73-30ed-48de-9d18-66b6d98bf4f7.mp3'

def download(url, path):
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    path.write_bytes(r.content)
    print('downloaded', path.name, len(r.content))

video = WORK / 'base.mp4'
voice = WORK / 'boss_voice.mp3'
download(VIDEO_URL, video)
download(VOICE_URL, voice)

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
out = PUBLIC / 'xianjiawei-first-official-reel-boss-voice.mp4'
subprocess.run([
    ffmpeg, '-y',
    '-i', str(video),
    '-i', str(voice),
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-ac', '2',
    '-t', '12',
    '-movflags', '+faststart',
    str(out)
], check=True)

(PUBLIC / 'index.html').write_text('''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>仙加味｜第一支正式短影音｜小老闆聲音版</title><style>body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.6}</style><main><video controls playsinline preload="metadata" src="xianjiawei-first-official-reel-boss-voice.mp4"></video><h1>仙加味｜第一支正式短影音</h1><p>上班日常篇｜小老闆聲音版｜待人工審核</p></main></html>''', encoding='utf-8')
print('FINAL', out, out.stat().st_size)
