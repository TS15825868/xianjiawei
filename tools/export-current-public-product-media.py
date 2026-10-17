#!/usr/bin/env python3
"""Export currently approved Xianjiawei product photos from up-to-date main.

Only actual referenced photos from the current published product catalogs and
product HTML are exported. Nothing is written to the live site. No AI synthesis.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
DATE = '20261017'
OUT = ROOT / 'dist' / f'xianjiawei-current-approved-product-media-{DATE}.zip'

class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ('src', 'href'):
            path = local_image(a.get(key, ''))
            if path:
                self.paths.add(path)

def local_image(s):
    if not isinstance(s, str):
        return None
    v = urlsplit(s)
    if v.scheme or v.netloc or s.startswith('//'):
        return None
    p = unquote(v.path).lstrip('/')
    if not p.startswith('images/') or '..' in Path(p).parts:
        return None
    if Path(p).suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp', '.gif'):
        return None
    return p

def parse_json(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))

def main():
    own = parse_json('public-product-master.json')['products']
    media = parse_json('data/product-media-authority.json')['products']
    partners = [p for p in parse_json('partner-catalog.json')['products'] if p.get('public') is True]
    assert len(own) > 0 and len(partners) > 0, 'No approved public product definitions'
    records = []
    owners = {}
    def mark(path, name, kind):
        path = local_image(path)
        if not path:
            raise ValueError(f'Unsafe or nonimage reference: {name}:{kind}:{path}')
        full = ROOT / path
        if not full.is_file() or full.stat().st_size < 128:
            raise FileNotFoundError(f'Missing approved published photo: {path}')
        owners.setdefault(path, set()).add(name + '/' + kind)
        records.append((name, kind, path))

    for p in own:
        pid = p['id']
        m = media[pid]
        mark(m['mainImage'], pid, '商品主圖')
        for a in m.get('detailImages', []):
            mark(a, pid, '詳細圖')
        page = p.get('page')
        if page:
            parts = urlsplit(page)
            if parts.scheme:
                if parts.scheme != 'https' or parts.netloc != 'ts15825868.github.io' or not parts.path.startswith('/xianjiawei/'):
                    raise ValueError('Unexpected external product detail page: ' + page)
                page = parts.path.removeprefix('/xianjiawei/')
            if '..' in Path(page).parts or page.startswith('/') or not page.endswith('.html'):
                raise ValueError('Unsafe product detail page: ' + page)
            if not (ROOT / page).is_file():
                raise FileNotFoundError('Missing approved own detail page: ' + page)
            parser = Images()
            parser.feed((ROOT / page).read_text(encoding='utf-8'))
            for a in sorted(parser.paths):
                mark(a, pid, '頁面實際引用')

    for p in partners:
        pid = p['id']
        mark(p['image'], pid, '商品主圖')
        for a in p.get('detailImages', []):
            mark(a, pid, '詳細圖')
        for variant in p.get('variants', []):
            name = variant['id']
            mark(variant['image'], name, '品項主圖')
            for a in variant.get('detailImages', []):
                mark(a, name, '品項詳細圖')
            if variant.get('originalFrontPhoto'):
                mark(variant['originalFrontPhoto'], name, '原始正面照片')
        page = p.get('page')
        if page:
            parts = urlsplit(page)
            if parts.scheme:
                if parts.scheme != 'https' or parts.netloc != 'ts15825868.github.io' or not parts.path.startswith('/xianjiawei/'):
                    raise ValueError('Unexpected external product detail page: ' + page)
                page = parts.path.removeprefix('/xianjiawei/')
            if '..' in Path(page).parts or page.startswith('/') or not page.endswith('.html'):
                raise ValueError('Unsafe product detail page: ' + page)
            if not (ROOT / page).is_file():
                raise FileNotFoundError('Missing approved partner detail page: ' + page)
            parser = Images()
            parser.feed((ROOT / page).read_text(encoding='utf-8'))
            for a in sorted(parser.paths):
                mark(a, pid, '頁面實際引用')

    # All new actual-cutouts included, including original-photo provenance.
    evidence = ROOT / 'images/catalog-user-original-v20261017/source-integrity.json'
    if evidence.is_file():
        source = json.loads(evidence.read_text(encoding='utf-8'))
        for entry in source['photos']:
            # Original source photos remain hash-verifiable even after a newer
            # owner-approved detail image replaces their published gallery use.
            # The published ZIP still exports ONLY currently referenced images.
            file_path = ROOT / entry['file']
            if not file_path.is_file():
                raise FileNotFoundError('Original photo provenance missing: ' + entry['file'])
            checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
            if checksum != entry['mediaSha256']:
                raise RuntimeError('Altered owner-origin photo: ' + entry['file'])

    files = sorted(owners)
    manifest = {
        'catalogAuthority': 'current main public-product-master.json + partner-catalog.json',
        'generatedFromCurrentGitCheckout': True,
        'date': DATE,
        'ownApprovedProducts': [p['id'] for p in own],
        'partnerApprovedProducts': [p['id'] for p in partners],
        'teaApprovedVariants': [v['id'] for p in partners for v in p.get('variants', [])],
        'totalDistinctImageAssets': len(files),
        'files': [
            {'path': path, 'bytes': (ROOT / path).stat().st_size,
             'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest(),
             'uses': sorted(owners[path])}
            for path in files
        ],
        'publishSafeguards': [
            'Only approved currently public product and detail page photo refs are exported',
            'Hidden and retired products cannot enter this export by their existence alone',
            'Real original packaged products and existing product pixels are not AI regenerated',
            'Actual back package labels remain tied to their own product only',
            'Any missing whole-package photo remains pending, not synthesized',
            'The shown 8-piece tray is just one tray; 64 pieces is the whole carton spec',
            'Only rose-fruit tea has a verified triangular teabag content image'
        ]
    }
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(['商品ID', '圖片用途', '實際官網圖片路徑'])
    for row in sorted(set(records)):
        writer.writerow(row)

    readme = (
        '仙加味｜正式官網產品包裝與內容物圖片整理\n'
        '================================================\n'
        f'目前正式公開自有商品：{len(own)} 款；其他來源公開商品／系列：{len(partners)} 款／組；'
        f'丹參茶系列子品項：{len(manifest["teaApprovedVariants"])} 款。\n'
        f'依正式 main 最新公開目錄匯出，共 {len(files)} 個不同圖片檔。\n\n'
        '「正式官網圖片/」保留原有路徑與檔名，不可隨意互換不同產品圖片。\n'
        '「商品圖片對照表.csv」列出主圖、詳細圖、真實內容物圖與在商品頁上引用的圖片。\n'
        '「原圖核對/」保留新製作素材的來源 SHA-256 與製作身分。\n'
        '本包不含後台成本、報價、私人對話或需檢核的未公開商品。\n'
        '如真實外盒存在缺角、漏拍或遮蔽物，只使用合格已有照片；不得用 AI 補造。\n'
        '封存、未經審核的產品不因 ZIP 含有檔案而自動公開。\n'
        '本 ZIP 只是內容與圖片核對包，不可拿它直接覆蓋較新的 GitHub main。\n'
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT, 'w', ZIP_DEFLATED, compresslevel=6) as z:
        z.writestr('使用說明_先看我.txt', readme)
        z.writestr('商品圖片對照表.csv', '\ufeff' + csv_buffer.getvalue())
        z.writestr('來源驗證與圖片總表.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        if evidence.is_file():
            z.write(evidence, '原圖核對/20261017來源指紋.json')
        for path in files:
            z.write(ROOT / path, '正式官網圖片/' + path)
        for filename in ('public-product-master.json', 'partner-catalog.json', 'data/product-media-authority.json'):
            z.write(ROOT / filename, '正式目錄核對/' + filename)
    with ZipFile(OUT) as z:
        damaged = z.testzip()
        if damaged:
            raise RuntimeError('Corrupt image in generated ZIP: ' + damaged)
    print(json.dumps({'zip': str(OUT), 'photos': len(files), 'own': len(own),
                      'partner': len(partners), 'teaVariants': len(manifest['teaApprovedVariants']),
                      'zipBytes': OUT.stat().st_size}, ensure_ascii=False))

if __name__ == '__main__':
    main()