#!/usr/bin/env python3
"""Compose existing photographic cutouts; never generate product pixels."""
from pathlib import Path
import hashlib,json,math
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'images/catalog-calm-v20261016'
S=1200

def backdrop():
    im=Image.new('RGB',(S,S));d=ImageDraw.Draw(im)
    for y in range(S):
        t=y/(S-1)
        c=tuple(round(a*(1-t)+b*t) for a,b in zip((251,249,244),(233,226,214)))
        d.line((0,y,S,y),fill=c)
    # Faint distant contours only; no frame, platform, or stone texture.
    haze=Image.new('RGBA',(S,S));hd=ImageDraw.Draw(haze)
    hd.polygon([(0,1000),(0,825),(160,865),(285,808),(470,909),(670,847),(870,898),(1050,808),(1200,862),(1200,1000)],fill=(117,130,129,10))
    im=Image.alpha_composite(im.convert('RGBA'),haze.filter(ImageFilter.GaussianBlur(25)))
    glow=Image.new('RGBA',(S,S));ImageDraw.Draw(glow).ellipse((150,0,1050,1000),fill=(255,255,255,65))
    return Image.alpha_composite(im,glow.filter(ImageFilter.GaussianBlur(100)))

def gao_cutout():
    im=Image.open(ROOT/'images/product-main/gao-packaging-v20261016/box-jar-original.jpg').convert('RGBA')
    m=Image.new('L',im.size);d=ImageDraw.Draw(m)
    d.polygon([(357,184),(483,81),(736,105),(742,121),(734,402),(663,546),(430,485)],fill=255)
    d.polygon([(736,403),(738,321),(744,277),(760,266),(762,220),(775,186),(807,166),(858,154),(926,151),(989,164),(1029,185),(1042,212),(1041,249),(1021,293),(1036,320),(1042,335),(1010,496),(899,591),(759,552),(744,501)],fill=255)
    im.putalpha(m.filter(ImageFilter.GaussianBlur(.65)))
    return im.crop(m.getbbox())

def run():
    OUT.mkdir(exist_ok=True)
    manifests=json.loads((ROOT/'images/catalog-clean-studio-v20261016-v5/manifest.json').read_text())['items']
    entries=[x for x in manifests if x['file'].endswith('-main.webp') or x.get('kind')=='manufacturer-original-tea-box']
    records=[];mapping={}
    for item in entries:
        key=Path(item['file']).stem
        if key=='guilu-gao-main':cut=gao_cutout()
        else:
            cut=Image.open(ROOT/item['source']).convert('RGBA')
            if cut.getextrema()[-1][0]==255:raise ValueError('Source must have an existing photo mask: '+item['source'])
            cut=cut.crop(cut.getchannel('A').getbbox())
        scale=min(1000/cut.width,960/cut.height)
        cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS)
        x=(S-cut.width)//2;y=(S-cut.height)//2
        bg=backdrop();shadow=Image.new('RGBA',(S,S));sd=ImageDraw.Draw(shadow)
        sd.ellipse((x+cut.width*.06,y+cut.height-9,x+cut.width*.94,y+cut.height+30),fill=(68,57,43,35))
        bg=Image.alpha_composite(bg,shadow.filter(ImageFilter.GaussianBlur(20)))
        bg.alpha_composite(cut,(x,y));out=OUT/(key+'.webp');bg.convert('RGB').save(out,'WEBP',quality=94,method=6)
        dest=out.relative_to(ROOT).as_posix();mapping[item['file']]=dest
        records.append({'file':dest,'output':dest,'source':item['source'],'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'productPixels':'original photo + alpha mask + uniform resize only','sourceLimitationsPreserved':True})
    (OUT/'manifest.json').write_text(json.dumps({'version':'20261016-calm-original-photos-v1','noProductRedraw':True,'noPedestal':True,'items':records},ensure_ascii=False,indent=2)+'\n')
    return mapping
if __name__=='__main__':run()
