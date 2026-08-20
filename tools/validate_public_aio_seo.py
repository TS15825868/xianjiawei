#!/usr/bin/env python3
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE='https://ts15825868.github.io/xianjiawei/'
CURRENT_30='每日 1–2 罐'
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED=('柒玄茶・龜鹿調飲粉','qixuan-guilu-drink-powder')
SPECS={
 'guilu-gao':'100g／罐','guilu-drink-30':'30cc／罐（小玻璃罐）','guilu-drink-180':'180cc／包（鋁袋）',
 'guilu-tangkuai':'75g （2兩）／盒｜8塊裝','guilu-jiao':'600g （1斤）／盒｜32塊裝','luerong-fen':'75g／罐'
}
PRIMARY={'index.html','products.html','choose.html','combo.html','guide.html','faq.html','trial.html','brand.html','product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html'}

class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__();self.title='';self.in_title=False;self.metas=[];self.links=[];self.jsonld=[];self.in_json=False;self.buffer=[];self.lang='';self.h1=0
    def handle_starttag(self,tag,attrs):
        d={str(k).lower():str(v or '') for k,v in attrs}
        if tag=='html':self.lang=d.get('lang','')
        elif tag=='title':self.in_title=True
        elif tag=='meta':self.metas.append(d)
        elif tag=='link':self.links.append(d)
        elif tag=='script' and d.get('type','').lower()=='application/ld+json':self.in_json=True;self.buffer=[]
        elif tag=='h1':self.h1+=1
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
        elif tag=='script' and self.in_json:self.jsonld.append(''.join(self.buffer).strip());self.in_json=False;self.buffer=[]
    def handle_data(self,data):
        if self.in_title:self.title+=data
        if self.in_json:self.buffer.append(data)

def meta(p,name='',prop=''):
    for item in p.metas:
        if name and item.get('name','').lower()==name.lower():return item.get('content','').strip()
        if prop and item.get('property','').lower()==prop.lower():return item.get('content','').strip()
    return ''
def canonical(p):
    for item in p.links:
        if 'canonical' in item.get('rel','').lower().split():return item.get('href','').strip()
    return ''
def read(rel):return (ROOT/rel).read_text(encoding='utf-8')
def load(rel):return json.loads(read(rel))
def fail(errors,msg):errors.append(msg)

def main():
    errors=[]
    ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'};tree=ET.parse(ROOT/'sitemap.xml');urls=[n.text.strip() for n in tree.findall('.//sm:loc',ns) if n.text]
    if not urls:fail(errors,'sitemap.xml沒有公開網址')
    for url in urls:
        if not url.startswith(BASE):fail(errors,f'sitemap非正式網域：{url}');continue
        filename=Path(urlparse(url).path).name or 'index.html';path=ROOT/filename
        if not path.exists():fail(errors,f'sitemap指向不存在頁面：{filename}');continue
        source=path.read_text(encoding='utf-8');p=HeadParser();p.feed(source)
        if p.lang!='zh-Hant-TW':fail(errors,f'{filename} lang不是zh-Hant-TW')
        if not p.title.strip():fail(errors,f'{filename}缺title')
        if not meta(p,name='description'):fail(errors,f'{filename}缺meta description')
        if canonical(p)!=f'{BASE}{filename}':fail(errors,f'{filename} canonical錯誤')
        if p.h1!=1:fail(errors,f'{filename} H1數量應為1，目前{p.h1}')
        for marker in DEFERRED:
            if marker in source:fail(errors,f'{filename}重新公開暫緩產品：{marker}')
        if '30cc玻璃瓶' in source or '小玻璃瓶' in source or '30cc／瓶' in source:fail(errors,f'{filename}仍含30cc舊稱')
        if filename in PRIMARY:
            if not meta(p,name='ai-summary'):fail(errors,f'{filename}缺ai-summary')
            for label,value in [('og:title',meta(p,prop='og:title')),('og:description',meta(p,prop='og:description')),('og:image',meta(p,prop='og:image'))]:
                if not value:fail(errors,f'{filename}缺{label}')
            if not p.jsonld:fail(errors,f'{filename}缺JSON-LD')
            for i,raw in enumerate(p.jsonld,1):
                try:json.loads(raw)
                except json.JSONDecodeError as exc:fail(errors,f'{filename} JSON-LD #{i}無效：{exc}')

    master=load('public-product-master.json');mb={p.get('id'):p for p in master.get('products') or []}
    if master.get('authority')!='user-confirmed-current':fail(errors,'public-product-master不是目前使用者確認權威')
    if master.get('productCount')!=6 or list(mb)!=PUBLIC_IDS:fail(errors,'public-product-master不是目前六項官網產品權威')
    for pid,spec in SPECS.items():
        if mb.get(pid,{}).get('specification')!=spec:fail(errors,f'public-product-master規格錯誤：{pid}')
    if (mb.get('guilu-drink-30',{}).get('usage') or [None])[0]!=CURRENT_30:fail(errors,'public-product-master 30cc用法不是每日 1–2 罐')
    if (mb.get('guilu-drink-180',{}).get('usage') or [None])[0]!='每日一包':fail(errors,'public-product-master 180cc用法不是每日一包')

    for rel in ['llms.txt','llms-full.txt','ai-answers.json','geo-data.json','catalog-public.json','content/public-post-library.json']:
        text=read(rel)
        for marker in DEFERRED:
            if marker in text:fail(errors,f'{rel}重新把暫緩產品放到公開AI/GEO/貼文層：{marker}')
    for marker in ['龜鹿膏','龜鹿飲30cc玻璃罐',CURRENT_30,'龜鹿飲180cc鋁袋','每日一包','龜鹿湯塊','75g （2兩）／盒｜8塊裝','龜鹿膠','600g （1斤）／盒｜32塊裝','鹿茸粉']:
        if marker not in read('llms.txt'):fail(errors,f'llms.txt缺少：{marker}')
    gao=read('product-guilu-gao.html')
    for retired in ['早上＋下午','早上+下午','每日早上及下午各一小匙','早晚各一小匙']:
        if retired in gao:fail(errors,f'龜鹿膏詳頁仍含舊固定時段：{retired}')
    if '時間依作息安排' not in gao:fail(errors,'龜鹿膏快捷標籤未同步目前使用方式')

    if errors:
        print('\n'.join('ERROR '+e for e in errors));return 1
    print(f'PASS AIO/SEO/GEO: {len(urls)} sitemap URLs, six website products, current 30cc use, no fixed-time Guilu Gao chip, deferred Qixuan absent from website/public AI surfaces.')
    return 0

if __name__=='__main__':raise SystemExit(main())
