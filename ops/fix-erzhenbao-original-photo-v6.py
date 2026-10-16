#!/usr/bin/env python3
"""二珍寶主圖修正：只切出使用者實拍的完整紫色外盒，不合成虛構橘色膏塊。"""
from pathlib import Path
from io import BytesIO
from urllib.request import Request,urlopen
from PIL import Image,ImageDraw,ImageFilter
import json,hashlib
ROOT=Path(__file__).resolve().parent.parent
DIR=ROOT/"images/catalog-corrections-v20261016-v6"
DIR.mkdir(parents=True,exist_ok=True)
url="https://d2ol7oe51mr4n9.cloudfront.net/user_3I7cZELbKfOMYPcVd2g8GfqVrb4/f4b0e9c5-8824-46b8-a6fa-285fe8f0895e.jpg"
req=Request(url,headers={"User-Agent":"Xianjiawei-verified-actual-photo"})
with urlopen(req,timeout=40) as response:raw=response.read(5000000)
if not 120000<len(raw)<4999000:raise ValueError("原照下載異常，不可使用AI替代")
photo=Image.open(BytesIO(raw)).convert("RGBA")
if photo.size!=(1536,1152):raise ValueError("來源圖片尺寸不同，不可推測外盒")
mask=Image.new("L",photo.size,0)
ImageDraw.Draw(mask).polygon([(214,104),(1286,139),(1190,1035),(212,886)],fill=255)
photo.putalpha(mask.filter(ImageFilter.GaussianBlur(.65)))
subject=photo.crop(photo.getchannel("A").getbbox())
s=min(880/subject.width,780/subject.height)
subject=subject.resize((round(subject.width*s),round(subject.height*s)),Image.Resampling.LANCZOS)
background=Image.new("RGBA",(1122,1402),"#F7F4ED")
x=(1122-subject.width)//2; y=1110-subject.height
shadow=Image.new("RGBA",background.size,(0,0,0,0))
ImageDraw.Draw(shadow).ellipse((x+20,1095,x+subject.width-20,1132),fill=(40,34,30,34))
background.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(22)))
background.alpha_composite(subject,(x,y))
f=DIR/"royalherb-erzhenbao-64-main.webp"
background.convert("RGB").save(f,"WEBP",quality=94,method=6)
old="images/catalog-clean-studio-v20261016-v5/royalherb-erzhenbao-64-main.webp"
new="images/catalog-corrections-v20261016-v6/royalherb-erzhenbao-64-main.webp"
changed=[]
for path in list(ROOT.glob("*.html"))+list(ROOT.glob("*.js"))+[ROOT/i for i in ("partner-catalog.json","catalog-public.json","data.json","product-master.json") if (ROOT/i).exists()]:
    s=path.read_text(encoding="utf-8")
    if old in s:
        path.write_text(s.replace(old,new),encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))
if "product-er-zhen-bao.html" not in changed or "products.html" not in changed:
    raise ValueError("新版商品主圖未連到正式商品頁")
(DIR/"manifest.json").write_text(json.dumps({"source":"user photo IMG_9999","sha256":hashlib.sha256(raw).hexdigest(),"method":"unaltered real package pixels clipped to clean ivory","newImage":new,"oldImagePreserved":old,"updated":changed},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Purple gift box actual photo replaced; changed",len(changed),"site files")
