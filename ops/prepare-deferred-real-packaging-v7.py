"""Non-generative original-pixel clipping. Prepare deferred images without listing products."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'images/catalog-deferred-real-v20261016-v7';OUT.mkdir(exist_ok=True)
# Vertices measured against an 800x450 preview of each original photograph.
ITEMS={
 'guilu-jiao-open':('images/products-v2/guilu-jiao-open-new.jpg',[(179,334),(268,201),(272,20),(365,23),(365,16),(429,19),(432,28),(539,31),(518,230),(489,418),(190,370)]),
 'guilu-tangkuai-open':('images/products-v2/guilu-tangkuai-open-new.jpg',[(179,355),(255,212),(240,20),(358,22),(358,16),(422,18),(425,26),(568,31),(546,233),(545,413),(538,438),(188,386)])
}
manifest={'version':'20261016-deferred-real-pixel-v7','publicationStatus':'internal-media-prepared-not-listed','method':'polygon alpha clipping of unaltered source pixels; equal aspect resampling; no AI generation','items':[]}
for name,(source,vertices) in ITEMS.items():
 im=Image.open(ROOT/source).convert('RGBA');mask=Image.new('L',im.size)
 ImageDraw.Draw(mask).polygon([(round(x*im.width/800),round(y*im.height/450)) for x,y in vertices],fill=255)
 im.putalpha(mask.filter(ImageFilter.GaussianBlur(.55)));im=im.crop(im.getbbox());im.thumbnail((900,1000),Image.Resampling.LANCZOS)
 bg=Image.new('RGBA',(1122,1402),'#F7F4ED');shadow=Image.new('RGBA',bg.size)
 x=(1122-im.width)//2;y=1160-im.height
 ImageDraw.Draw(shadow).ellipse((x+30,1143,x+im.width-30,1182),fill=(50,40,30,35));bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(21)));bg.alpha_composite(im,(x,y))
 dst=OUT/(name+'.webp');bg.convert('RGB').save(dst,'WEBP',quality=94,method=6)
 manifest['items'].append({'id':name,'image':str(dst.relative_to(ROOT)),'source':source,'sourceSha256':hashlib.sha256((ROOT/source).read_bytes()).hexdigest(),'role':'actual-open-package-detail','public':False,'note':'Visible tray only; do not infer total box count from visible portions.'})
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
