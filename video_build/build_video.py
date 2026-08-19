from pathlib import Path
import requests, subprocess, imageio_ffmpeg, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
PUBLIC=ROOT/'public'; WORK=ROOT/'work'
PUBLIC.mkdir(exist_ok=True); WORK.mkdir(exist_ok=True)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()

SCENES=[
'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061028_485b7985-7bc9-4913-94dc-1892efe246be.mp4',
'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_061658_c6ff7037-5ae3-4061-ba82-80058c5e0776.mp4',
'https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_062503_9f51994a-1fd9-4252-8686-091c08b1724d.mp4']
VOICE='https://d8j0ntlcm91z4.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/hf_20260819_071444_30961a73-30ed-48de-9d18-66b6d98bf4f7.mp3'
LOGO='https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/c08dfe3c-4ea7-46b5-8fd1-75a99f98a815.png'
END_SCENE='https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/2f0e6cc6-16e6-47a1-bbd0-3376d18ae0f4.png'
FONT='https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/OTF/Subset/NotoSansTC-VF.otf'
CAPTIONS=[
'嗨，我是仙加味小老闆。',
'下午忙了一段時間，先休息一下。',
'溫熱喝一口，再繼續今天的事。',
'仙加味，補養，是一種節奏。']

# D版：維持舒適慢節奏 15.5 秒。
TOTAL=15.5
SCENE_DURS=[3.9,3.9,3.9,3.8]
# 字幕依口白長度重新配置，不再平均四等分。
# 第四句念完後繼續停留至片尾，避免收尾跳掉。
CAPTION_CUTS=[(0.0,2.8),(2.8,6.5),(6.5,10.2),(10.2,15.5)]

def dl(url,path):
    r=requests.get(url,timeout=120); r.raise_for_status(); path.write_bytes(r.content); print('download',path,len(r.content))
def run(args):
    print('RUN',' '.join(map(str,args))); subprocess.run(args,check=True)

scene_paths=[]
for i,u in enumerate(SCENES,1):
    p=WORK/f'scene{i}.mp4'; dl(u,p); scene_paths.append(p)
voice=WORK/'voice.mp3'; dl(VOICE,voice)
logo=WORK/'logo.png'; dl(LOGO,logo)
end_scene=WORK/'end_scene.png'; dl(END_SCENE,end_scene)
fontfile=WORK/'NotoSansTC-VF.otf'; dl(FONT,fontfile)

# 正式 Logo 僅裁去多餘白邊，不重畫中文字。
im=Image.open(logo).convert('RGB'); px=im.load(); xs=[]; ys=[]
for y in range(im.height):
    for x in range(im.width):
        r,g,b=px[x,y]
        if r>60 and r>g*1.7 and r>b*1.5:
            xs.append(x); ys.append(y)
if xs:
    m=8; box=(max(0,min(xs)-m),max(0,min(ys)-m),min(im.width,max(xs)+m),min(im.height,max(ys)+m)); im=im.crop(box)
im.save(WORK/'logo_crop.png',quality=95)

font=ImageFont.truetype(str(fontfile),54)
for idx,text in enumerate(CAPTIONS,1):
    W,H=980,180; card=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(card)
    d.rounded_rectangle((12,12,W-12,H-12),38,fill=(14,33,52,210),outline=(190,154,79,225),width=3)
    bb=d.textbbox((0,0),text,font=font); tw,th=bb[2]-bb[0],bb[3]-bb[1]
    d.text(((W-tw)//2,(H-th)//2-5),text,font=font,fill=(247,244,237,255),stroke_width=1,stroke_fill=(0,0,0,120))
    card.save(WORK/f'caption{idx}.png')

# 畫面速度：前三幕維持慢動作 3.9 秒，收尾 3.8 秒。
segs=[]
for i,p in enumerate(scene_paths,1):
    out=WORK/f'seg{i}.mp4'
    vf='scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=1.95*PTS,fps=30,format=yuv420p'
    run([ffmpeg,'-y','-i',str(p),'-an','-vf',vf,'-t',str(SCENE_DURS[i-1]),'-c:v','libx264','-crf','19','-preset','medium',str(out)])
    segs.append(out)
end=WORK/'seg4.mp4'
run([ffmpeg,'-y','-loop','1','-i',str(end_scene),'-t',str(SCENE_DURS[3]),'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p','-an','-c:v','libx264','-crf','19','-preset','medium',str(end)])
segs.append(end)
concat=WORK/'concat.txt'; concat.write_text(''.join(f"file \'{p.as_posix()}\'\n" for p in segs),encoding='utf-8')
base=WORK/'base.mp4'; run([ffmpeg,'-y','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(base)])

# D版聲音：不用 asetrate，也不做簡單 pitch-shift。
# 先轉單聲道，再用 Praat 的 Change gender 同時調整聲帶共鳴與音高。
mono=WORK/'voice_mono.wav'
run([ffmpeg,'-y','-i',str(voice),'-ar','48000','-ac','1',str(mono)])
try:
    import parselmouth
    from parselmouth.praat import call
except Exception:
    subprocess.check_call([sys.executable,'-m','pip','install','praat-parselmouth==0.4.6'])
    import parselmouth
    from parselmouth.praat import call

snd=parselmouth.Sound(str(mono))
# 6～9歲男童仍保留童聲：目標中位音高約275Hz；共鳴僅下降8%，避免變成年輕男性。
try:
    boy=call(snd,'Change gender...',75,600,0.92,275,1.0,1.0)
except Exception as e:
    print('Praat change-gender failed, fallback to source',repr(e))
    boy=snd
praat_wav=WORK/'voice_boy_praat.wav'; boy.save(str(praat_wav),'WAV')

# 語速只慢約4%，保留自然音高；EQ 僅做輕微厚度與去尖銳，不再強拉音色。
child=WORK/'child_d.wav'
af=('atempo=0.96,'
    'equalizer=f=240:t=q:w=1:g=1.0,'
    'equalizer=f=700:t=q:w=1:g=0.4,'
    'equalizer=f=3800:t=q:w=1:g=-1.0,'
    'highpass=f=80,lowpass=f=11500,'
    'loudnorm=I=-16:TP=-1.5:LRA=11,'
    'apad=pad_dur=2.5')
run([ffmpeg,'-y','-i',str(praat_wav),'-af',af,'-ar','48000','-ac','2','-t',str(TOTAL),str(child)])

final=PUBLIC/'xianjiawei-first-official-reel.mp4'
cmd=[ffmpeg,'-y','-i',str(base),'-i',str(WORK/'logo_crop.png')]
for i in range(1,5): cmd += ['-i',str(WORK/f'caption{i}.png')]
cmd += ['-i',str(child)]

# 字幕使用新的實際閱讀節奏，不再沿用畫面分鏡時間。
c1s,c1e=CAPTION_CUTS[0]; c2s,c2e=CAPTION_CUTS[1]; c3s,c3e=CAPTION_CUTS[2]; c4s,c4e=CAPTION_CUTS[3]
fc=(f"[1:v]scale=130:-1[lg];[0:v][lg]overlay=W-w-42:52[v1];"
    f"[2:v]scale=980:-1[c1];[v1][c1]overlay=(W-w)/2:H-h-108:enable='between(t,{c1s},{c1e})'[v2];"
    f"[3:v]scale=980:-1[c2];[v2][c2]overlay=(W-w)/2:H-h-108:enable='between(t,{c2s},{c2e})'[v3];"
    f"[4:v]scale=980:-1[c3];[v3][c3]overlay=(W-w)/2:H-h-108:enable='between(t,{c3s},{c3e})'[v4];"
    f"[5:v]scale=980:-1[c4];[v4][c4]overlay=(W-w)/2:H-h-108:enable='between(t,{c4s},{c4e})'[vout]")
run(cmd+['-filter_complex',fc,'-map','[vout]','-map','6:a:0','-t',str(TOTAL),'-c:v','libx264','-crf','18','-preset','medium','-c:a','aac','-b:a','192k','-pix_fmt','yuv420p','-movflags','+faststart',str(final)])

(PUBLIC/'index.html').write_text('''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>仙加味｜第一支正式短影音</title><style>body{margin:0;background:#0e2134;color:#f7f4ed;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}main{max-width:430px;margin:auto}video{width:100%;border-radius:18px;background:#000;box-shadow:0 12px 40px #0009}h1{font-size:20px;margin:16px 0 6px}p{opacity:.82;line-height:1.6}</style><main><video controls playsinline preload="metadata" src="xianjiawei-first-official-reel.mp4"></video><h1>仙加味｜第一支正式短影音</h1><p>上班日常篇｜D版男童共鳴・字幕同步｜待人工審核</p></main></html>''',encoding='utf-8')
print('FINAL',final,final.stat().st_size)
