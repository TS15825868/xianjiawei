#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='https://ts15825868.github.io/xianjiawei/'
PRIMARY={
 'index.html','brand-facts.html','products.html','choose.html','combo.html','guide.html','faq.html','trial.html','brand.html',
 'product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html'
}
SUMMARIES={
 'products.html':'仙加味目前六項正式產品：龜鹿膏100g、龜鹿飲30cc小玻璃罐、龜鹿飲180cc鋁袋、龜鹿湯塊75g、龜鹿膠600g（1斤）與鹿茸粉75g。',
 'product-guilu-drink-30cc.html':'仙加味龜鹿飲30cc玻璃罐，正式規格30cc／罐（小玻璃罐），裸罐、無貼紙；接單後安排製作約5～7個工作天。',
 'product-guilu-drink-180cc.html':'仙加味龜鹿飲180cc鋁袋，正式規格180cc／包（鋁袋），維持狹長鋁袋比例；接單後安排製作約5～7個工作天。',
 'product-guilu-tangkuai.html':'仙加味龜鹿湯塊正式主規格75g／盒｜8塊裝；每塊約9.375g只屬產品詳細資料，可搭配熱水或家常湯品。',
 'product-guilu-jiao.html':'仙加味龜鹿膠正式主規格600g（1斤）／盒｜32塊裝；每塊約18.75g只屬產品詳細資料，可搭配熱水或家常料理。',
 'product-luerong-fen.html':'仙加味鹿茸粉正式規格75g／罐，成分為鹿茸；整理粉狀產品的一般使用、保存與日常搭配資訊。',
 'trial.html':'仙加味龜鹿飲30cc試喝組提供3罐試喝品免費，運費自付；每位顧客、電話及地址限一次，接單後製作約5～7個工作天。',
 'combo.html':'仙加味產品搭配頁依產品型態、容量與日常使用情境整理選擇方向；價格、活動、付款與配送以官方LINE最新回覆為準。',
 'ingredients.html':'仙加味原料資訊頁整理龜鹿系列與鹿茸粉目前公開成分與原料名稱，並區分產品資訊、傳統飲食文化與資料來源。',
 'quality.html':'仙加味品質頁整理正式產品規格、包裝身份、圖片比例、保存與公開資訊一致性原則，方便顧客核對目前產品資料。',
 'craft.html':'仙加味工序頁從前處理、時間、火候與濃縮節奏介紹傳統龜鹿工序文化，內容以飲食文化與製作脈絡為主。',
 'brand-facts.html':'仙加味官方品牌與產品資料頁整理萬華四代品牌脈絡、六項正式產品主規格、媒體權威、使用與引用原則。',
 'dm.html':'仙加味六項目前正式詳細DM入口；產品主圖與詳細DM分開管理，DM只用於明確DM版位，產品規格以目前正式authority為準。',
 'video.html':'仙加味影音頁整理品牌、產品、使用方式與飲食文化相關影音入口，內容與目前官網產品規格及公開資訊保持一致。',
 'sources.html':'仙加味資料來源頁說明品牌自有產品資料、一般知識、外部來源與引用層級，協助讀者辨識內容來源與適用範圍。',
}
IMAGE_DEFAULT={
 'products.html':'images/customer-display-v20260812/guilu-gao.avif',
 'choose.html':'images/logo.png','combo.html':'images/logo.png','guide.html':'images/logo.png','brand-facts.html':'images/logo.png'
}
DM_MAP={
 'guilu-gao':'https://ts15825868.github.io/xianjiawei/images/dm-final/01_guilu-gao-100g-dm.jpg?v=20260814-product-modal-media-v3',
 'guilu-drink-30':'https://ts15825868.github.io/xianjiawei/images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg?v=20260814-product-modal-media-v3',
 'guilu-drink-180':'https://ts15825868.github.io/xianjiawei/images/dm-final/03_guilu-drink-180cc-dm.jpg?v=20260814-product-modal-media-v3',
 'guilu-tangkuai':'https://ts15825868.github.io/xianjiawei/images/dm-final/05_guilu-tangkuai-75g-dm.jpg?v=20260814-product-modal-media-v3',
 'guilu-jiao':'https://ts15825868.github.io/xianjiawei/images/dm-final/06_guilu-jiao-600g-dm.jpg?v=20260814-product-modal-media-v3',
 'luerong-fen':'https://ts15825868.github.io/xianjiawei/images/dm-final/04_luerong-fen-75g-dm.jpg?v=20260814-product-modal-media-v3',
}

def grab(source,pattern):
 m=re.search(pattern,source,re.I|re.S)
 return unescape(m.group(1).strip()) if m else ''
def has_meta(source,kind,key):
 if kind=='name': return bool(re.search(r'<meta\b[^>]*\bname=["\']'+re.escape(key)+r'["\']',source,re.I))
 return bool(re.search(r'<meta\b[^>]*\bproperty=["\']'+re.escape(key)+r'["\']',source,re.I))
def meta_tag(kind,key,value):
 return f'<meta {kind}="{key}" content="{value}"/>'
def add_before_head_end(source,lines):
 if not lines:return source
 marker='</head>'
 if marker not in source.lower(): raise RuntimeError('missing </head>')
 pos=source.lower().rfind(marker)
 return source[:pos]+'\n'+'\n'.join(lines)+'\n'+source[pos:]
def canonical(source,filename):
 return grab(source,r'<link\b[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)["\']') or f'{BASE}{filename}'
def title(source):return grab(source,r'<title>(.*?)</title>')
def description(source):return grab(source,r'<meta\b[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']')
def og(source,key):return grab(source,r'<meta\b[^>]*property=["\']'+re.escape(key)+r'["\'][^>]*content=["\']([^"\']*)["\']')
def absolute_image(filename,path):
 value=str(path or '').strip()
 if value.startswith('http'):return value
 return BASE+value.lstrip('/')

def update_html(filename):
 path=ROOT/filename; source=path.read_text('utf-8'); additions=[]
 desc=description(source); page_title=title(source); canon=canonical(source,filename)
 summary=SUMMARIES.get(filename,desc)
 if (not has_meta(source,'name','ai-summary')) and summary:
  additions.append(meta_tag('name','ai-summary',summary))
 if filename in PRIMARY:
  og_title=og(source,'og:title') or page_title
  og_desc=og(source,'og:description') or desc
  og_image=og(source,'og:image')
  if not og_image:
   fallback=IMAGE_DEFAULT.get(filename,'images/logo.png'); og_image=absolute_image(filename,fallback)
   additions.append(meta_tag('property','og:image',og_image))
  twitter={
   'twitter:card':'summary_large_image','twitter:title':og_title,'twitter:description':og_desc,'twitter:image':og_image
  }
  for key,value in twitter.items():
   if not has_meta(source,'name',key) and value:additions.append(meta_tag('name',key,value))
  if 'application/ld+json' not in source.lower():
   payload={'@context':'https://schema.org','@type':'WebPage','name':page_title,'description':desc,'url':canon,'inLanguage':'zh-Hant-TW','isPartOf':{'@type':'WebSite','name':'仙加味','url':BASE}}
   if og_image:payload['image']=og_image
   additions.append('<script type="application/ld+json">'+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'</script>')
 updated=add_before_head_end(source,additions)
 if updated!=source:path.write_text(updated,'utf-8')

def update_catalog():
 path=ROOT/'catalog-public.json'; data=json.loads(path.read_text('utf-8'))
 by={p.get('id'):p for p in data.get('products') or []}
 for pid,url in DM_MAP.items():
  if pid not in by:raise RuntimeError(f'missing product {pid}')
  by[pid]['dm']=url
 data['updatedAt']='2026-08-14'
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')

def main():
 import xml.etree.ElementTree as ET
 ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}
 tree=ET.parse(ROOT/'sitemap.xml')
 pages=[]
 for node in tree.findall('.//sm:loc',ns):
  if not node.text:continue
  name=Path(node.text.strip().split('?',1)[0]).name or 'index.html'
  if (ROOT/name).is_file():pages.append(name)
 for filename in sorted(set(pages)):update_html(filename)
 update_catalog()
 print(f'PASS: updated missing AIO metadata on {len(set(pages))} canonical sitemap pages and aligned six catalog DM URLs.')

if __name__=='__main__':main()
