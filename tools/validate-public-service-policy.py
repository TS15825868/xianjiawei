#!/usr/bin/env python3
"""Read-only public-service regression guard. Legal disclosure is preserved."""
import json
import re
import unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://ts15825868.github.io/xianjiawei/'
def read(path):
    return (ROOT / path).read_text(encoding='utf-8')
def load(path):
    return json.loads(read(path))

def main():
    policy = load('config/public-content-policy.json')
    service = policy['serviceHours']
    assert service['publicMode'] == 'line_individual_confirmation'
    assert service['publicStorefrontHours'] is False
    assert service['storefront'] is None and service['closed'] is None
    assert '官方 LINE' in service['lineOA'] and '依序回覆' in service['lineOA']
    identity = policy['businessDisclosure']
    assert identity['publicBrandName'] == policy['brandNaming']['publicBrandName']
    approved = f"{identity['salesEntityName']}｜統一編號：{identity['uniformBusinessNumber']}"
    for path in ('contact.html', 'site-core-v410.js'):
        assert approved in read(path), f'{path}: missing verified business disclosure'
    assert policy['contactRouting']['primaryChannel'] == '仙加味官方 LINE OA'
    line_url = policy['contactRouting']['lineUrl']
    for path in ('contact.html','links.html'):
        assert line_url in read(path), f'{path}: missing official LINE route'
    ai = load('ai-answers.json')
    answer = next(x for x in ai['answers'] if x['id'] == 'business-hours')
    assert '官方 LINE' in answer['answer'] and '個別確認' in answer['answer']
    pages = {'links.html','contact.html','faq.html','site-core-v410.js','site.js','ai-answers.json','geo-data.json','llms.txt','llms-full.txt'}
    for loc in ET.fromstring(read('sitemap.xml')).findall('.//{*}loc'):
        url = (loc.text or '').strip()
        if url.startswith(BASE):
            rel = url[len(BASE):] or 'index.html'
            if rel.endswith('/'):
                rel += 'index.html'
            if rel.endswith('.html'):
                pages.add(rel)
    retired = re.compile(r'10:00\s*[-－–—~～至]\s*20:00|週六.{0,20}(?:取貨|自取|面交)|週日(?:休息|公休)|下一個營業時段|非服務時間一律下一營業日回覆')
    for path in sorted(pages):
        assert not retired.search(unicodedata.normalize('NFKC',read(path))), f'{path}: retired public storefront claim'
    print(f'PASS public service policy: {len(pages)} current sources; LINE routing and business disclosure retained.')
if __name__ == '__main__':
    main()
