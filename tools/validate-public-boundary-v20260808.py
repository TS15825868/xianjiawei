#!/usr/bin/env python3
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE='https://ts15825868.github.io/xianjiawei/'
CURRENT_30='每日 1–2 罐'
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED=('柒玄茶・龜鹿調飲粉','qixuan-guilu-drink-powder')
EXPECTED_SPECS={
 'guilu-gao':'100g／罐','guilu-drink-30':'30cc／罐（小玻璃罐）','guilu-drink-180':'180cc／包（鋁袋）',
 'guilu-tangkuai':'75g （2兩）／盒｜8塊裝','guilu-jiao':'600g （1斤）／盒｜32塊裝','luerong-fen':'75g／罐'
}
MEDIA_PRODUCT_PAGES={'product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html'}
FORBIDDEN_PUBLIC=['台興山產有限公司','統一編號','公司電話','公司地址','台北市萬華區西昌街 52 號','台北市萬華區西昌街52號']

def read(rel): return (ROOT/rel).read_text(encoding='utf-8')
def sitemap_pages():
    root=ET.fromstring(read('sitemap.xml'));ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};pages=[]
    for loc in root.findall('s:url/s:loc',ns):
        url=(loc.text or '').strip()
        if url.startswith(BASE):
            path=url[len(BASE):] or 'index.html'
            if path.endswith('/'):path+='index.html'
            if path.endswith('.html'):pages.append(path)
    return sorted(set(pages))

def main():
    master=json.loads(read('public-product-master.json'));products={p.get('id'):p for p in master.get('products') or []}
    assert master.get('authority')=='user-confirmed-current','公開母資料不是目前使用者確認權威'
    assert master.get('productCount')==6 and list(products)==PUBLIC_IDS,'公開母資料必須是目前六項官網產品'
    for pid,spec in EXPECTED_SPECS.items():assert products[pid].get('specification')==spec,f'{pid}規格未同步'
    assert products['guilu-drink-30'].get('usage',[None])[0]==CURRENT_30,'30cc用法不是每日 1–2 罐'
    assert products['guilu-drink-180'].get('usage',[None])[0]=='每日一包','180cc用法不是每日一包'

    pages=sitemap_pages();assert pages,'sitemap沒有公開HTML頁'
    missing=[p for p in pages if not (ROOT/p).is_file()];assert not missing,f'sitemap指向不存在頁面：{missing}'
    for page in pages:
        source=read(page)
        for phrase in FORBIDDEN_PUBLIC:assert phrase not in source,f'{page}公開頁出現禁止公司／內部資訊：{phrase}'
        for phrase in DEFERRED:assert phrase not in source,f'{page}重新公開目前暫不放官網的柒玄茶'
        for phrase in ['龜鹿飲30cc玻璃瓶','30cc／瓶','小玻璃瓶']:assert phrase not in source,f'{page}仍含30cc舊稱：{phrase}'
        if page in MEDIA_PRODUCT_PAGES:assert 'images/dm-final/' not in source,f'{page}不應把詳細DM當產品主視覺'
        if page=='product-guilu-gao.html':
            assert '食用時間可依個人使用習慣與作息時間安排' in source
            for retired in ['早上＋下午','早上+下午','每日早上及下午各一小匙','早晚各一小匙']:assert retired not in source,f'龜鹿膏詳頁仍含舊固定時段：{retired}'
            assert '時間依作息安排' in source,'龜鹿膏快捷標籤未同步目前用法'
        if page=='product-guilu-tangkuai.html':
            assert '75g （2兩）／盒｜8塊裝' in source and '每塊約9.375g' in source
            assert '300g／盒' not in source and '600g／盒' not in source
        if page=='product-guilu-jiao.html':assert '600g （1斤）／盒｜32塊裝' in source and re.search(r'每塊約18\.75\s*g',source)
        if page=='product-guilu-drink-30cc.html':
            for phrase in ['30cc／罐','小玻璃罐','裸罐','無貼紙',CURRENT_30]:assert phrase in source,f'30cc正式頁缺：{phrase}'
        if page=='product-guilu-drink-180cc.html':assert '180cc／包' in source and '鋁袋' in source and '每日一包' in source

    for page in ['index.html','products.html','guide.html']:
        source=read(page);assert '六項' in source,f'{page}未維持目前六項官網產品'
        for phrase in DEFERRED:assert phrase not in source,f'{page}仍含暫緩產品'

    contact=read('contact.html');assert 'lin.ee/sHZW7NkR' in contact,'聯絡頁缺官方LINE'
    print(f'PASS public boundary: {len(pages)} pages use six website products, current 30cc/180cc data, no fixed-time Guilu Gao chip, and no deferred Qixuan website exposure.')

if __name__=='__main__':main()
