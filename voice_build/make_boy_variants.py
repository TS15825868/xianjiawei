from pathlib import Path
import math, subprocess, requests, imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'voice_variants_public'
OUT.mkdir(exist_ok=True)
RAW=OUT/'source.mp3'
URL='https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_071444_30961a73-30ed-48de-9d18-66b6d98bf4f7.mp3'
r=requests.get(URL,timeout=120); r.raise_for_status(); RAW.write_bytes(r.content)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()

def make(name,semitones,eq_low=1.5,eq_high=-1.0):
    ratio=2**(semitones/12)
    rate=24000*ratio
    tempo=1/ratio
    out=OUT/name
    af=(f'asetrate={rate:.3f},aresample=24000,atempo={tempo:.6f},'
        f'equalizer=f=220:t=q:w=1:g={eq_low},equalizer=f=3200:t=q:w=1:g={eq_high},'
        'highpass=f=85,lowpass=f=10500,loudnorm=I=-16:TP=-1.5:LRA=11')
    subprocess.run([ffmpeg,'-y','-i',str(RAW),'-af',af,'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','128k',str(out)],check=True)

make('A_小男孩自然版.mp3',-0.65,1.2,-0.8)
make('B_小男孩較低共鳴版.mp3',-1.15,1.8,-1.3)

(OUT/'index.html').write_text('''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>仙加味小老闆聲線比較</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f7f4ed;color:#0e2134;max-width:720px;margin:40px auto;padding:0 20px}h1{font-size:24px}section{background:#fff;border-radius:18px;padding:20px;margin:16px 0;box-shadow:0 8px 30px #0001}audio{width:100%}small{opacity:.7}</style><h1>仙加味小老闆｜男童化聲線比較</h1><section><h2>A｜自然男童版</h2><audio controls preload="metadata" src="A_小男孩自然版.mp3"></audio><p>只輕微降低音高與共鳴，保留原本童聲感。</p></section><section><h2>B｜較低共鳴男童版</h2><audio controls preload="metadata" src="B_小男孩較低共鳴版.mp3"></audio><p>男童感更明顯，但仍避免變成少年或成人。</p></section><small>兩版皆由同一個小老闆聲音母本微調，沒有更換聲線。</small></html>''',encoding='utf-8')
print('done')
