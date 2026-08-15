#!/usr/bin/env python3
from __future__ import annotations
import json, hashlib, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import pillow_avif  # noqa: F401

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'data/post-smallboss-rebuild-v20260815.json'
OUT=ROOT/'images/posts/smallboss-v20260815'
FONT_SERIF='/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc'
FONT_SANS='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
BG=(247,244,237); NAVY=(15,42,70); RED=(133,32,31); GOLD=(180,143,78)
ACCENTS=[(232,220,194),(223,232,218),(229,218,215),(218,227,236),(236,226,202),(220,235,232),(235,221,225),(229,233,215)]
PRODUCT={
 'gao':'images/customer-display-v20260812/guilu-gao.avif',
 'drink30':'images/customer-display-v20260812/guilu-drink-30cc.avif',
 'drink180':'images/customer-display-v20260812/guilu-drink-180cc-product.jpg',
 'tang':'images/customer-display-v20260812/guilu-tangkuai.avif',
 'jiao':'images/customer-display-v20260812/guilu-jiao.avif',
 'luerong':'images/customer-display-v20260812/luerong-fen.avif',
}
MASCOT=[
 'images/post-library/userzip3-v20260811/self-care-family.webp',
 'images/post-library/userzip3-v20260811/choose-by-routine.webp',
 'images/post-library/userzip3-v20260811/warm-water.webp',
 'images/post-library/userzip3-v20260811/rainy-home.webp',
 'images/post-library/userzip3-v20260811/hot-weather-hydration-2.webp',
]

def fs(size,serif=False): return ImageFont.truetype(FONT_SERIF if serif else FONT_SANS,size)
def rounded(size,r=26):
 m=Image.new('L',size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,size[0]-1,size[1]-1),radius=r,fill=255); return m

def fit_card(im,size,r=28):
 bg=ImageOps.fit(im.convert('RGB'),size,method=Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(7))
 fg=ImageOps.contain(im.convert('RGB'),size,method=Image.Resampling.LANCZOS)
 bg.paste(fg,((size[0]-fg.width)//2,(size[1]-fg.height)//2))
 out=Image.new('RGBA',size,(0,0,0,0)); out.paste(bg,(0,0),rounded(size,r)); return out

def wrap(draw,text,font,maxw,maxlines=3):
 text=str(text or '').replace('\n',' ').strip(); lines=[]; cur=''
 for ch in text:
  if draw.textlength(cur+ch,font=font)<=maxw or not cur: cur+=ch
  else:
   lines.append(cur); cur=ch
   if len(lines)>=maxlines: break
 if cur and len(lines)<maxlines: lines.append(cur)
 if len(''.join(lines))<len(text) and lines:
  s=lines[-1]
  while s and draw.textlength(s+'…',font=font)>maxw: s=s[:-1]
  lines[-1]=s+'…'
 return lines

def paste(canvas,obj,xy): canvas.alpha_composite(obj.convert('RGBA'),xy)

def mascot_parts(seed):
 src=ROOT/MASCOT[seed%len(MASCOT)]; im=Image.open(src).convert('RGB'); w,h=im.size
 boss=im.crop((0,int(h*.28),int(w*.46),int(h*.88)))
 pals=im.crop((int(w*.42),int(h*.64),int(w*.86),int(h*.91)))
 return fit_card(boss,(350,500),30),fit_card(pals,(245,145),24)

def product(key,size): return fit_card(Image.open(ROOT/PRODUCT[key]),size,28)

def draw_brand(draw):
 draw.rounded_rectangle((58,42,214,104),radius=20,fill=RED)
 draw.text((136,73),'仙加味',font=fs(29,True),fill='white',anchor='mm')

def draw_header(draw,title,headline,accent):
 draw_brand(draw); y=142; tf=fs(52,True)
 for line in wrap(draw,title,tf,1010,3): draw.text((60,y),line,font=tf,fill=NAVY); y+=66
 hf=fs(27)
 for line in wrap(draw,headline,hf,1010,2): draw.text((62,y+8),line,font=hf,fill=(85,77,67)); y+=38
 draw.line((60,y+28,1140,y+28),fill=accent,width=3); return y+48

def footer(draw):
 draw.rounded_rectangle((54,1116,1146,1176),radius=22,fill=NAVY)
 draw.text((600,1146),'仙加味｜補養，是一種節奏。',font=fs(26),fill=(235,210,160),anchor='mm')

def small_tag(draw,box,a,b,sym):
 draw.rounded_rectangle(box,radius=22,fill=(255,253,248),outline=(218,203,173),width=2)
 x0,y0,x1,y1=box; draw.ellipse((x0+16,y0+20,x0+68,y0+72),fill=(242,232,210))
 draw.text((x0+42,y0+46),sym,font=fs(24),fill=RED,anchor='mm'); draw.text((x0+82,y0+19),a,font=fs(23,True),fill=NAVY)
 for i,line in enumerate(wrap(draw,b,fs(18),x1-x0-100,2)): draw.text((x0+82,y0+54+i*24),line,font=fs(18),fill=(95,88,78))

def product_body(canvas,draw,kind,title,top):
 mapping={'gao':('gao','龜鹿膏 100g'),'drink30':('drink30','龜鹿飲 30cc 小玻璃罐'),'drink180':('drink180','龜鹿飲 180cc 鋁袋'),'jiao':('jiao','龜鹿膠 600g／32塊'),'tang':('tang','龜鹿湯塊 75g／8塊'),'luerong':('luerong','鹿茸粉 75g')}
 key,label=mapping[kind]; card=product(key,(515,450)); paste(canvas,card,(610,max(top,520)))
 draw.rounded_rectangle((640,912,1095,964),radius=17,fill=(255,253,248)); draw.text((868,938),label,font=fs(22),fill=NAVY,anchor='mm')
 if '保存' in title: tags=[('保存','依包裝與產品型態留意保存','存'),('開封','開封後依產品特性處理','封')]
 elif '5～7' in title or '工作天' in title or '接單後' in title: tags=[('接單後製作','確認訂單後安排製作','製'),('約5～7工作天','完成後安排出貨','時')]
 elif '溫熱' in title or '熱水' in title: tags=[('溫熱安排','依產品型態溫熱搭配','溫'),('日常節奏','依自己的習慣安排','日')]
 elif '外出' in title or '工作空檔' in title: tags=[('外出／工作','依生活場景安排','外'),('產品型態','先看容量與包裝','型')]
 else: tags=[('先看規格','容量、重量、包裝分清楚','規'),('再看使用','依產品型態安排','用')]
 small_tag(draw,(520,990,810,1100),*tags[0]); small_tag(draw,(830,990,1120,1100),*tags[1])

def multi_products(canvas,draw,keys,labels,top):
 cols=3; xs=[520,725,930]; y0=max(top,500)
 for i,(k,l) in enumerate(zip(keys,labels)):
  r=i//3;c=i%3; y=y0+r*245; card=product(k,(175,190)); paste(canvas,card,(xs[c],y))
  draw.rounded_rectangle((xs[c]+3,y+152,xs[c]+172,y+190),radius=12,fill=(255,253,248)); draw.text((xs[c]+87,y+171),l,font=fs(16),fill=NAVY,anchor='mm')

def make(post_id,item):
 if '台興山產' in json.dumps(item,ensure_ascii=False): raise RuntimeError(f'blocked brand text: {post_id}')
 seed=int(hashlib.sha1(post_id.encode()).hexdigest()[:8],16); accent=ACCENTS[seed%len(ACCENTS)]
 canvas=Image.new('RGBA',(1200,1200),BG+(255,)); draw=ImageDraw.Draw(canvas)
 draw.rounded_rectangle((24,24,1176,1186),radius=44,outline=(222,210,186),width=3); draw.ellipse((1020,55,1160,195),fill=accent+(150,))
 top=draw_header(draw,item['title'],item.get('headline',''),accent)
 boss,pals=mascot_parts(seed); paste(canvas,boss,(64,540)); paste(canvas,pals,(145,950))
 kind=item['kind']
 if kind in ('gao','drink30','drink180','jiao','tang','luerong'): product_body(canvas,draw,kind,item['title'],top)
 elif kind=='drink_compare':
  paste(canvas,product('drink30',(255,330)),(590,max(top,550))); paste(canvas,product('drink180',(255,330)),(880,max(top,550)))
  small_tag(draw,(555,930,830,1050),'30cc','小玻璃罐，輕巧即飲','小'); small_tag(draw,(850,930,1125,1050),'180cc','鋁袋完整份量','大')
 elif kind=='gao_drink_combo': multi_products(canvas,draw,['gao','drink30','drink180'],['龜鹿膏','30cc','180cc'],top)
 elif kind=='tang_jiao_compare':
  paste(canvas,product('tang',(270,350)),(575,max(top,540))); paste(canvas,product('jiao',(270,350)),(870,max(top,540)))
  small_tag(draw,(560,940,830,1060),'龜鹿湯塊','75g／8塊','湯'); small_tag(draw,(855,940,1125,1060),'龜鹿膠','600g／32塊','膠')
 elif kind=='all_products': multi_products(canvas,draw,['gao','drink30','drink180','tang','jiao','luerong'],['膏100g','飲30cc','飲180cc','湯塊75g','膠600g','鹿茸粉75g'],top)
 elif kind=='seasons':
  for i,(s,txt,col) in enumerate([('春','整理步調',(242,221,228)),('夏','清爽補水',(219,239,236)),('秋','回到規律',(240,225,199)),('冬','安排溫熱',(225,234,243))]):
   rr=i//2;cc=i%2;x=520+cc*300;y=520+rr*200;draw.rounded_rectangle((x,y,x+270,y+170),radius=28,fill=col);draw.text((x+35,y+28),s,font=fs(38,True),fill=NAVY);draw.text((x+135,y+110),txt,font=fs(22),fill=NAVY,anchor='mm')
 elif kind=='brand':
  draw.rounded_rectangle((520,520,1120,930),radius=34,fill=(255,253,248),outline=(218,203,173),width=2);draw.text((820,590),'萬華',font=fs(56,True),fill=RED,anchor='mm')
  for i,t in enumerate(['起點','四代','工藝','今天']):
   cx=610+i*140;draw.ellipse((cx-25,690,cx+25,740),fill=accent);draw.text((cx,715),str(i+1),font=fs(20),fill=NAVY,anchor='mm');draw.text((cx,775),t,font=fs(22),fill=NAVY,anchor='mm')
  draw.text((820,860),'把傳統整理成今天更容易理解的日常內容',font=fs(23),fill=(93,85,75),anchor='mm')
 elif kind=='craft':
  draw.rounded_rectangle((545,535,1125,930),radius=34,fill=(255,253,248),outline=(218,203,173),width=2);draw.ellipse((585,610,690,715),outline=NAVY,width=5);draw.line((638,663,638,625),fill=NAVY,width=5);draw.line((638,663,670,680),fill=NAVY,width=5);draw.rounded_rectangle((720,680,990,815),radius=28,fill=(80,75,67));draw.polygon([(760,880),(815,800),(850,875),(900,795),(940,885),(850,925)],fill=(173,74,47));draw.text((830,600),'時間 × 火候 × 工序',font=fs(28),fill=NAVY,anchor='mm')
 elif kind=='cooking':
  draw.rounded_rectangle((545,540,1120,930),radius=34,fill=(255,253,248),outline=(218,203,173),width=2);draw.arc((670,650,995,820),0,180,fill=NAVY,width=7)
  for x in [735,835,935]: draw.arc((x,560,x+65,680),80,260,fill=GOLD,width=6)
  draw.text((830,835),'雞湯／排骨湯／溫熱飲食',font=fs(27),fill=NAVY,anchor='mm');draw.text((830,880),'從熟悉的家常料理開始',font=fs(22),fill=(93,85,75),anchor='mm')
 elif kind=='consult':
  draw.rounded_rectangle((560,540,1110,930),radius=38,fill=(255,253,248),outline=(218,203,173),width=2);draw.rounded_rectangle((655,610,825,860),radius=28,fill=NAVY);draw.rounded_rectangle((675,640,805,820),radius=12,fill=(244,248,244));draw.rounded_rectangle((850,650,1050,720),radius=20,fill=accent);draw.text((950,685),'規格／試喝',font=fs(22),fill=NAVY,anchor='mm');draw.rounded_rectangle((850,750,1090,820),radius=20,fill=(237,228,213));draw.text((970,785),'交期／下單流程',font=fs(22),fill=NAVY,anchor='mm')
 else:
  for i,(a,b,s) in enumerate([('文化','先了解飲食文化脈絡','文'),('型態','看即飲、膏、湯塊、龜鹿膠','型'),('生活','再對應自己的日常場景','日')]): small_tag(draw,(530,545+i*150,1110,670+i*150),a,b,s)
 footer(draw); out=Image.new('RGB',canvas.size,BG);out.paste(canvas.convert('RGB'));return out

def main():
 data=json.loads(MANIFEST.read_text(encoding='utf-8')); OUT.mkdir(parents=True,exist_ok=True)
 if data.get('brandDisplay')!='仙加味': raise RuntimeError('brandDisplay must be 仙加味')
 for old in OUT.glob('*.jpg'): old.unlink()
 for pid,item in data['posts'].items(): make(pid,item).save(OUT/item['file'],quality=91,optimize=True,progressive=True)
 files=list(OUT.glob('*.jpg'))
 if len(files)!=len(data['posts']): raise RuntimeError(f'expected {len(data["posts"])} images, got {len(files)}')
 print(f'PASS: generated {len(files)} Traditional Chinese small-boss post visuals.')

if __name__=='__main__': main()
