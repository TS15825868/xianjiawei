#!/usr/bin/env python3
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from current_product_authority import current_public_ids, current_media_ids

ROOT = Path(__file__).resolve().parents[1]
CURRENT_30 = '每日 1–2 罐'
PUBLIC_IDS=current_public_ids(ROOT)
DEFERRED_ID = 'qixuan-guilu-drink-powder'
DEFERRED_NAME = '柒玄茶・龜鹿調飲粉'
PUBLIC_PAGES = [
    'index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html',
    'brand.html','brand-facts.html','ingredients.html','quality.html','craft.html','knowledge.html','video.html',
    'hanfang-baike.html','sources.html','contact.html','trial.html','product-guilu-gao.html',
    'product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html',
    'product-guilu-jiao.html','product-luerong-fen.html'
]
TECHNICAL_VISIBLE = ['products-v2','products-v3','GitHub Web','runtime','快取版本','機器可讀產品母本','/mnt/data/','ERP秘密','Token','Secret']
RETIRED_VISIBLE = ['30cc玻璃瓶','30cc／瓶','30cc瓶裝','一天一次一小匙','早晚各一小匙']

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(); self.hidden_depth = 0; self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in {'script','style','template','noscript'}: self.hidden_depth += 1
    def handle_endtag(self, tag):
        if tag in {'script','style','template','noscript'} and self.hidden_depth: self.hidden_depth -= 1
    def handle_data(self, data):
        if not self.hidden_depth:
            value = ' '.join(data.split())
            if value: self.parts.append(value)

def visible(rel):
    parser = VisibleText(); parser.feed((ROOT/rel).read_text(encoding='utf-8')); return ' '.join(parser.parts)
def req(ok, msg):
    if not ok: raise AssertionError(msg)
def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def compact(value): return ''.join(str(value or '').split())
def local(path): return str(path or '').split('?',1)[0].lstrip('/')

def main():
    for rel in PUBLIC_PAGES:
        req((ROOT/rel).exists(), f'缺少公開顧客頁：{rel}')
        text = visible(rel)
        for phrase in TECHNICAL_VISIBLE: req(phrase not in text, f'{rel} 可見文案仍含內部／技術用語：{phrase}')
        for phrase in RETIRED_VISIBLE: req(phrase not in text, f'{rel} 可見文案仍含退役正式資料：{phrase}')

    master = load('public-product-master.json')
    ids = [p.get('id') for p in master.get('products') or []]
    req(master.get('authority') == 'user-confirmed-current', '公開產品母資料 authority 錯誤')
    req(master.get('productCount') ==len(PUBLIC_IDS) and ids == PUBLIC_IDS, '官網公開產品必須符合目前母資料')

    # 柒玄茶目前只是不放官網；ERP／LINE可另行保留資料，但官網公開表面不得出現。
    for rel in ['public-product-master.json','index.html','products.html','guide.html','faq.html','brand-facts.html','ai-answers.json','geo-data.json']:
        raw = (ROOT/rel).read_text(encoding='utf-8')
        req(DEFERRED_ID not in raw and DEFERRED_NAME not in raw, f'{rel} 重新把柒玄茶公開到官網')

    home = visible('index.html'); products = visible('products.html'); guide = visible('guide.html'); faq = visible('faq.html')
    req(all(Path(p['page']).name in (ROOT/'index.html').read_text() for p in master['products']), '首頁未說明目前六項官網產品')
    req(all(p['id'] in (ROOT/'products.html').read_text() for p in master['products']), '產品總覽未維持六項官網產品')

    gao = visible('product-guilu-gao.html')
    req('食用時間可依個人使用習慣與作息時間安排' in gao, '龜鹿膏詳頁未顯示目前使用方式')
    req('早上＋下午' not in gao and '早上+下午' not in gao and '早晚' not in gao, '龜鹿膏詳頁仍有舊固定時段標籤')
    req(gao.count('食用時間可依個人使用習慣與作息時間安排') <= 2, '龜鹿膏詳頁使用時間文案重複過多')
    req('食用時間可依個人使用習慣與作息時間安排' in gao, '龜鹿膏快捷標籤未同步目前使用方式')
    req('食用時間可依個人使用習慣與作息時間安排' in guide, '使用方式頁未同步龜鹿膏目前用法')

    p30 = visible('product-guilu-drink-30cc.html')
    req('30cc／罐（小玻璃罐）' in p30 and '裸罐' in p30 and '無貼紙' in p30, '30cc詳頁包裝事實不完整')
    req(CURRENT_30 in p30 and CURRENT_30 in faq and CURRENT_30 in guide and CURRENT_30 in (ROOT/'products.html').read_text(), '30cc目前正式用法未同步產品頁／FAQ／指南／總覽')
    p180 = visible('product-guilu-drink-180cc.html')
    req('180cc／包（鋁袋）' in p180 and '每日一包' in p180, '180cc詳頁規格／使用方式不完整')

    req(not set(ids) & {'guilu-tangkuai','guilu-jiao'},'暫緩產品回流公開')

    dm = visible('dm.html')
    req('DM' in dm, '產品DM頁應維持六項已有核准DM')
    req('待審核' not in dm and '毫米尺寸未知' not in dm, '產品DM頁仍露出內部審核／製圖說明')

    formal = load('data/formal-media-authority-v20260810.json')
    req(len(current_media_ids(ROOT)) ==len(PUBLIC_IDS), '正式公開產品媒體须符合目前清單；歷史素材保留')
    trial_authority = formal.get('trial') or {}
    trial_media = local(trial_authority.get('image') or trial_authority.get('path'))
    req(trial_authority.get('status') == 'approved_user_original' and trial_authority.get('render_mode') == 'poster' and trial_media, '目前試喝正式圖權威不完整')
    trial_source = (ROOT/'trial.html').read_text(encoding='utf-8'); trial = visible('trial.html'); trial_compact = compact(trial)
    req('<iframe' not in trial_source.lower(), 'trial.html 不得使用 iframe')
    approved_30_main = load('data/product-media-authority.json')['products']['guilu-drink-30']['mainImage']
    req(trial_media in trial_source or approved_30_main in trial_source, 'trial.html 必須使用已核准試喝圖或正式30cc實物主圖')
    for phrase in ['龜鹿飲試喝組','3罐','試喝品免費','運費自付','60元','100元','30cc小玻璃罐','180cc／包（鋁袋）']:
        req(phrase in trial, f'trial.html 缺少目前核准資訊：{phrase}')
    for phrase in ['正式售價60元／罐','11罐600元','單包200元','11包2,000元']:
        req(phrase not in trial_compact, f'trial.html 不得公開商品價格：{phrase}')

    print(f'PASS public customer pages: {len(PUBLIC_PAGES)} pages follow current website product authority, exact 30cc daily 1–2 cans, no retired fixed-time Guilu Gao chip, and current formal media.')

if __name__ == '__main__': main()

