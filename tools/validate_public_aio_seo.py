#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE='https://ts15825868.github.io/xianjiawei/'
CURRENT_30='每日 1–2 罐'
SOUP_MAIN_SPEC='75g （2兩）／盒｜8塊裝'
SOUP_DETAIL='每塊約9.375g'
JIAO_MAIN_SPEC='600g （1斤）／盒｜32塊裝'
JIAO_DETAIL='每塊約18.75g'
QIXUAN_NAME='柒玄茶・龜鹿調飲粉'
QIXUAN_SPEC='2g／小包；20g／包（10小包）'
KNOWLEDGE_SPECS={
 'guilu-gao':'100g／罐',
 'guilu-drink-30':'30cc／罐（小玻璃罐）',
 'guilu-drink-180':'180cc／包（鋁袋）',
 'guilu-tangkuai':SOUP_MAIN_SPEC,
 'guilu-jiao':JIAO_MAIN_SPEC,
 'luerong-fen':'75g／罐',
 'qixuan-guilu-drink-powder':QIXUAN_SPEC,
}
MEDIA_IDS={'guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen'}
PRIMARY_DECISION_PAGES={
 'index.html','brand-facts.html','products.html','choose.html','combo.html','guide.html','faq.html','trial.html','brand.html',
 'product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html',
}
REQUIRED_SITEMAP_PAGES=PRIMARY_DECISION_PAGES|{'dm.html','recipes.html','video.html','knowledge.html','hanfang-baike.html','sources.html','ingredients.html','quality.html','craft.html','contact.html'}

class HeadParser(HTMLParser):
 def __init__(self):
  super().__init__();self.title='';self._in_title=False;self.metas=[];self.links=[];self.jsonld=[];self._jsonld_open=False;self._jsonld_buffer=[];self.html_lang='';self.h1_count=0
 def handle_starttag(self,tag,attrs):
  data={str(k).lower():str(v or '') for k,v in attrs}
  if tag=='html':self.html_lang=data.get('lang','')
  elif tag=='title':self._in_title=True
  elif tag=='meta':self.metas.append(data)
  elif tag=='link':self.links.append(data)
  elif tag=='script' and data.get('type','').lower()=='application/ld+json':self._jsonld_open=True;self._jsonld_buffer=[]
  elif tag=='h1':self.h1_count+=1
 def handle_endtag(self,tag):
  if tag=='title':self._in_title=False
  elif tag=='script' and self._jsonld_open:self.jsonld.append(''.join(self._jsonld_buffer).strip());self._jsonld_open=False;self._jsonld_buffer=[]
 def handle_data(self,data):
  if self._in_title:self.title+=data
  if self._jsonld_open:self._jsonld_buffer.append(data)

def meta(parser,*,name='',prop=''):
 for item in parser.metas:
  if name and item.get('name','').lower()==name.lower():return item.get('content','').strip()
  if prop and item.get('property','').lower()==prop.lower():return item.get('content','').strip()
 return ''
def canonical(parser):
 for item in parser.links:
  if 'canonical' in item.get('rel','').lower().split():return item.get('href','').strip()
 return ''
def fail(errors,message):errors.append(message)
def local_public_path(value):
 text=str(value or '')
 if text.startswith(BASE):text=text[len(BASE):]
 return text.split('?',1)[0].lstrip('/')
def validate_jsonld_images(errors,filename,payload):
 if isinstance(payload,dict):
  for key,value in payload.items():
   if key in {'image','contentUrl','thumbnailUrl'} and isinstance(value,str) and value.startswith(BASE):
    path=local_public_path(value)
    if path and not (ROOT/path).exists():fail(errors,f'{filename} JSON-LD 圖片不存在：{path}')
   validate_jsonld_images(errors,filename,value)
 elif isinstance(payload,list):
  for value in payload:validate_jsonld_images(errors,filename,value)
def unauthorized_soup_weights(text):
 found=[];labels=['龜鹿湯塊','龜鹿膠','龜鹿膏','鹿茸粉']
 for match in re.finditer(r'(?<!\d)(\d+(?:\.\d+)?)\s*g',text,re.I):
  value=float(match.group(1))
  if value<50:continue
  before=text[max(0,match.start()-80):match.start()];position,label=max((before.rfind(label),label) for label in labels)
  if position>=0 and label=='龜鹿湯塊' and abs(value-75.0)>0.001:found.append(match.group(0))
 return found

def main():
 errors=[]
 sitemap_path=ROOT/'sitemap.xml'
 if not sitemap_path.exists():print('ERROR 缺少 sitemap.xml');return 1
 ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'};tree=ET.parse(sitemap_path);urls=[node.text.strip() for node in tree.findall('.//sm:loc',ns) if node.text]
 if not urls:fail(errors,'sitemap.xml 沒有公開網址')
 if len(urls)!=len(set(urls)):fail(errors,'sitemap.xml 有重複網址')
 sitemap_pages={Path(urlparse(url).path).name or 'index.html' for url in urls};missing=sorted(REQUIRED_SITEMAP_PAGES-sitemap_pages)
 if missing:fail(errors,f'sitemap.xml 缺少主要canonical頁面：{missing}')

 for url in urls:
  parsed=urlparse(url)
  if not url.startswith(BASE):fail(errors,f'sitemap 非正式網域：{url}');continue
  filename=Path(parsed.path).name or 'index.html';path=ROOT/filename
  if not path.exists():fail(errors,f'sitemap 指向不存在頁面：{filename}');continue
  source=path.read_text('utf-8');parser=HeadParser();parser.feed(source);description=meta(parser,name='description');ai_summary=meta(parser,name='ai-summary');robots=meta(parser,name='robots');expected=f'{BASE}{filename}'
  if parser.html_lang!='zh-Hant-TW':fail(errors,f'{filename} lang 不是 zh-Hant-TW')
  if not parser.title.strip():fail(errors,f'{filename} 缺少 title')
  if not description:fail(errors,f'{filename} 缺少 meta description')
  if not ai_summary or len(ai_summary)<24:fail(errors,f'{filename} 缺少可獨立引用的 ai-summary')
  if canonical(parser)!=expected:fail(errors,f'{filename} canonical 錯誤：{canonical(parser)}')
  if 'index' not in robots or 'follow' not in robots:fail(errors,f'{filename} robots 未允許索引')
  if parser.h1_count!=1:fail(errors,f'{filename} H1 數量應為1，目前{parser.h1_count}')
  if '30cc玻璃瓶' in source or '小玻璃瓶' in source or '30cc／瓶' in source:fail(errors,f'{filename} 仍含30cc舊稱')
  bad=unauthorized_soup_weights(source)
  if bad:fail(errors,f'{filename} 出現未核准龜鹿湯塊重量：{bad}')
  if filename in PRIMARY_DECISION_PAGES:
   checks=[('og:title',meta(parser,prop='og:title')),('og:description',meta(parser,prop='og:description')),('og:image',meta(parser,prop='og:image')),('twitter:card',meta(parser,name='twitter:card')),('twitter:title',meta(parser,name='twitter:title')),('twitter:description',meta(parser,name='twitter:description')),('twitter:image',meta(parser,name='twitter:image'))]
   for label,value in checks:
    if not value:fail(errors,f'{filename} 缺少 {label}')
   for image_label,image_url in [('og:image',meta(parser,prop='og:image')),('twitter:image',meta(parser,name='twitter:image'))]:
    if image_url.startswith(BASE):
     image_path=local_public_path(image_url)
     if image_path and not (ROOT/image_path).exists():fail(errors,f'{filename} {image_label} 圖片不存在：{image_path}')
   if not parser.jsonld:fail(errors,f'{filename} 缺少 JSON-LD')
   for index,raw in enumerate(parser.jsonld,start=1):
    try:payload=json.loads(raw);validate_jsonld_images(errors,filename,payload)
    except json.JSONDecodeError as exc:fail(errors,f'{filename} JSON-LD #{index} 無效：{exc}')

 required=['robots.txt','llms.txt','llms-full.txt','public-product-master.json','ai-answers.json','catalog-public.json','geo-data.json','site-official-product-variants.js','content/public-post-library.json','content/public-asset-library.json','content/public-content-policy.json']
 for filename in required:
  if not (ROOT/filename).exists():fail(errors,f'缺少機器可讀或正式規格檔案：{filename}')
 robots_text=(ROOT/'robots.txt').read_text('utf-8')
 if f'Sitemap: {BASE}sitemap.xml' not in robots_text:fail(errors,'robots.txt 未指向正式 sitemap.xml')

 master=json.loads((ROOT/'public-product-master.json').read_text('utf-8'));mb={p.get('id'):p for p in master.get('products') or []}
 if master.get('authority')!='user-confirmed-current':fail(errors,'public-product-master不是目前使用者確認權威')
 if master.get('productCount')!=7 or set(mb)!=set(KNOWLEDGE_SPECS):fail(errors,'public-product-master不是目前七項產品文字權威')
 for pid,spec in KNOWLEDGE_SPECS.items():
  if mb.get(pid,{}).get('specification')!=spec:fail(errors,f'public-product-master規格錯誤：{pid}')
 if (mb.get('guilu-drink-30',{}).get('usage') or [None])[0]!=CURRENT_30:fail(errors,'public-product-master 30cc用法不是每日 1–2 罐')
 if (mb.get('guilu-drink-180',{}).get('usage') or [None])[0]!='每日一包':fail(errors,'public-product-master 180cc用法不是每日一包')

 llms=(ROOT/'llms.txt').read_text('utf-8');llms_full=(ROOT/'llms-full.txt').read_text('utf-8')
 for marker in ['龜鹿膏','龜鹿飲30cc玻璃罐',CURRENT_30,'龜鹿飲180cc鋁袋','每日一包','龜鹿湯塊',SOUP_MAIN_SPEC,'龜鹿膠',JIAO_MAIN_SPEC,'鹿茸粉',QIXUAN_NAME,QIXUAN_SPEC,'public-product-master.json','catalog-public.json','geo-data.json','llms-full.txt']:
  if marker not in llms:fail(errors,f'llms.txt 缺少：{marker}')
 for marker in [SOUP_MAIN_SPEC,SOUP_DETAIL,JIAO_MAIN_SPEC,JIAO_DETAIL,QIXUAN_NAME,QIXUAN_SPEC,CURRENT_30]:
  if marker not in llms_full:fail(errors,f'llms-full.txt 缺少目前正式資料：{marker}')
 for filename,text in [('llms.txt',llms),('llms-full.txt',llms_full)]:
  bad=unauthorized_soup_weights(text)
  if bad:fail(errors,f'{filename} 出現未核准龜鹿湯塊重量：{bad}')

 catalog=json.loads((ROOT/'catalog-public.json').read_text('utf-8'));products=catalog.get('products') or [];cb={p.get('id'):p for p in products}
 if catalog.get('publicTextAuthority')!='public-product-master.json':fail(errors,'catalog-public沒有宣告public-product-master為文字權威')
 if catalog.get('knowledgeProductCount')!=7 or catalog.get('approvedMediaProductCount')!=6:fail(errors,'catalog-public沒有正確區分七文字／六媒體')
 if set(cb)!=MEDIA_IDS:fail(errors,'catalog-public產品陣列應只含六項核准媒體產品')
 if (catalog.get('qixuanKnowledge') or {}).get('specification')!=QIXUAN_SPEC:fail(errors,'catalog-public缺柒玄茶正式文字知識')
 soup=cb.get('guilu-tangkuai')
 if not soup or soup.get('size')!=SOUP_MAIN_SPEC or soup.get('package')!='深藍正式盒裝':fail(errors,'catalog-public龜鹿湯塊主規格或包裝錯誤')
 if SOUP_DETAIL not in str((catalog.get('specificationRules') or {}).get('tangkuai') or ''):fail(errors,'catalog-public龜鹿湯塊詳細約重政策不同步')
 jiao=cb.get('guilu-jiao')
 if not jiao or jiao.get('size')!=JIAO_MAIN_SPEC or JIAO_DETAIL not in str((catalog.get('specificationRules') or {}).get('jiao') or ''):fail(errors,'catalog-public龜鹿膠目前規格／約重不同步')
 p30=cb.get('guilu-drink-30') or {}
 if p30.get('usagePrimary')!=CURRENT_30 or (p30.get('usage') or [None])[0]!=CURRENT_30:fail(errors,'catalog-public 30cc用法未同步每日 1–2 罐')

 geo_text=(ROOT/'geo-data.json').read_text('utf-8')
 for marker in ['仙加味','萬華','龜鹿膏','龜鹿飲',CURRENT_30,'每日一包','龜鹿湯塊',SOUP_MAIN_SPEC,SOUP_DETAIL,'龜鹿膠',JIAO_MAIN_SPEC,JIAO_DETAIL,'鹿茸粉',QIXUAN_NAME,QIXUAN_SPEC]:
  if marker not in geo_text:fail(errors,f'geo-data.json 缺少目前實體或規格：{marker}')
 bad_geo=unauthorized_soup_weights(geo_text)
 if bad_geo:fail(errors,f'geo-data.json 出現未核准龜鹿湯塊重量：{bad_geo}')

 runtime=(ROOT/'site-official-product-variants.js').read_text('utf-8')
 for marker in [SOUP_MAIN_SPEC,JIAO_MAIN_SPEC,SOUP_DETAIL,JIAO_DETAIL]:
  if marker not in runtime:fail(errors,f'正式規格顯示層缺目前主規格／詳細約重：{marker}')
 bad_runtime=unauthorized_soup_weights(runtime)
 if bad_runtime:fail(errors,f'正式規格顯示層出現未核准龜鹿湯塊重量：{bad_runtime}')

 posts_text=(ROOT/'content/public-post-library.json').read_text('utf-8')
 for marker in [CURRENT_30,'每日一包',SOUP_MAIN_SPEC,SOUP_DETAIL,JIAO_MAIN_SPEC,JIAO_DETAIL,QIXUAN_NAME,QIXUAN_SPEC]:
  if marker not in posts_text:fail(errors,f'公開貼文資料缺目前正式資料：{marker}')
 if '六個正式產品' in posts_text:fail(errors,'公開貼文資料仍含舊六產品總覽文案')
 bad_posts=unauthorized_soup_weights(posts_text)
 if bad_posts:fail(errors,f'公開貼文資料出現未核准龜鹿湯塊重量：{bad_posts}')

 aio=(ROOT/'ai-answers.json').read_text('utf-8')
 for marker in [CURRENT_30,'每日一包',QIXUAN_NAME,QIXUAN_SPEC]:
  if marker not in aio:fail(errors,f'ai-answers.json 缺目前正式資料：{marker}')

 if errors:
  print('AIO／SEO／GEO 正式合約失敗：')
  for error in errors:print(f'- {error}')
  return 1
 print(f'PASS AIO／SEO／GEO current authority: {len(urls)} canonical sitemap pages, seven-product text knowledge, six approved-media catalog, exact 30cc daily 1–2 cans, Qixuan text-only knowledge, current specs and structured/social metadata aligned.')
 return 0

if __name__=='__main__':raise SystemExit(main())
