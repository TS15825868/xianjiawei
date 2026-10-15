#!/usr/bin/env python3
"""Real physical product pixels + calm brand scenery. Never repaint a package."""
from pathlib import Path
import hashlib,json,math
from PIL import Image,ImageOps,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"images/partner-products"
OUT=SRC/"site-hero-v20261016"
AUDIT=ROOT/"images/partner-product-design-review"
POLYGONS={
 "four-treasures-front.jpg":[(198,423),(936,415),(943,995),(196,995)],
 "er-zhen-bao-royalherb-original.webp":[(150,193),(849,193),(849,756),(795,800),(668,839),(572,725),(150,756)],
 "tea-danshen-leisure-front.webp":[(62,96),(1031,195),(1031,1217),(58,1286)],
 "tea-danshen-lotus-front.webp":[(0,104),(1029,188),(1029,1280),(3,1300)],
 "tea-danshen-refresh-front.webp":[(120,160),(1015,195),(1016,1208),(120,1278)],
 "tea-rose-fruit-front.webp":[(0,102),(998,195),(997,1230),(0,1276)],
 "tea-white-danshen-front.webp":[(1,145),(1026,186),(1028,1246),(2,1299)],
 "tea-wudahan-front.webp":[(61,125),(1024,192),(1029,1242),(65,1292)]
}
def backdrop():
    p=ROOT/"images/brand/world-landscape-v20261008.webp"
    bg=ImageOps.fit(Image.open(p).convert("RGBA"),(1000,1000)) if p.exists() else Image.new("RGBA",(1000,1000),(247,244,237,255))
    bg=Image.alpha_composite(bg,Image.new("RGBA",(1000,1000),(247,244,237,172)))
    layer=Image.new("RGBA",(1000,1000));d=ImageDraw.Draw(layer)
    d.rounded_rectangle((68,112,932,895),radius=52,fill=(252,249,241,115),outline=(166,127,65,119),width=3)
    d.rounded_rectangle((79,123,921,882),radius=50,outline=(255,255,255,104),width=2)
    d.ellipse((145,798,865,893),fill=(35,46,53,17))
    return Image.alpha_composite(bg,layer)
def run():
    OUT.mkdir(parents=True,exist_ok=True);AUDIT.mkdir(parents=True,exist_ok=True)
    records=[];contact=[]
    for name,vertices in POLYGONS.items():
        p=SRC/name
        if not p.is_file():raise ValueError("Missing physical source: "+name)
        original=ImageOps.exif_transpose(Image.open(p)).convert("RGBA")
        w,h=original.size;mask=Image.new("L",(w,h),0)
        ImageDraw.Draw(mask).polygon(vertices,fill=255)
        mask=mask.filter(ImageFilter.GaussianBlur(1.05))
        box=mask.getbbox()
        if not box:raise ValueError("Empty original-photo mask: "+name)
        coverage=sum(mask.histogram()[230:])/(w*h)
        if not 0.12<coverage<0.86:raise ValueError("Unsafe mask coverage: "+name)
        cut=original.crop(box);cut.putalpha(mask.crop(box))
        cut.thumbnail((730,600) if name.startswith("tea-") else (760,665),Image.Resampling.LANCZOS)
        # Reusable transparent primary-image candidate: original product pixels and
        # edges only. Do not bake scenery/white borders into transparent image.
        # This file is for review, not wired into the live catalog automatically.
        transparent_out=OUT/(p.stem+"-cutout.webp")
        cut.save(transparent_out,"WEBP",lossless=True,method=6,exact=True)
        check=Image.open(transparent_out)
        if check.mode!="RGBA" or check.getchannel("A").getextrema()!=(0,255):
            raise ValueError("Transparent output is not a genuine alpha cutout: "+name)
        x=(1000-cut.width)//2;y=788-cut.height
        shade=Image.new("RGBA",cut.size,(28,30,36,0))
        shade.putalpha(cut.getchannel("A").point(lambda a:int(a*.28)))
        shadow=Image.new("RGBA",(1000,1000));shadow.alpha_composite(shade,(x+12,y+18))
        shadow=shadow.filter(ImageFilter.GaussianBlur(17))
        frame=Image.alpha_composite(backdrop(),shadow)
        frame.alpha_composite(cut,(x,y))
        out=OUT/(p.stem+"-hero.webp")
        frame.convert("RGB").save(out,"WEBP",quality=91,method=6)
        records.append({"source":"images/partner-products/"+name,"hero":str(out.relative_to(ROOT)),"sourceSha256":hashlib.sha256(p.read_bytes()).hexdigest(),"originalPackagePixelsPreserved":True,"packageNotAIGenerated":True,"scaledWithAspectRatio":True,"transparentCutout":str(transparent_out.relative_to(ROOT)),"transparentCutoutAlphaVerified":True,"humanReviewRequired":True})
        contact.append((name,frame.convert("RGB")))
    canvas=Image.new("RGB",(4*320,math.ceil(len(contact)/4)*355),(247,244,237));pen=ImageDraw.Draw(canvas)
    for i,(name,pic) in enumerate(contact):
        x=i%4*320;y=i//4*355
        canvas.paste(pic.resize((305,305),Image.Resampling.LANCZOS),(x+7,y+8))
        pen.text((x+8,y+321),name[:39],fill=(27,44,54))
    canvas.save(AUDIT/"site-hero-v20261016-contact.jpg",quality=91)
    (OUT/"manifest.json").write_text(json.dumps({"reviewState":"cutout-and-hero-visual-candidates-not-yet-linked-to-public-catalog","images":records},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Built",len(records),"original-photo candidate heroes; live catalog unaffected.")
if __name__=="__main__":run()
