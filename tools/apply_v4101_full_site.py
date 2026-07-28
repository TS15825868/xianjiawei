#!/usr/bin/env python3
"""一次套用仙加味官網 v410.1：共用選單、圖片比例、防遮擋與年份時間軸。"""
from __future__ import annotations

import base64
import json
import re
import subprocess
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "410.1"
PAYLOAD_PARTS = sorted((ROOT / "tools").glob("v4101_payload_*.txt"))


def payload_text() -> str:
    if not PAYLOAD_PARTS:
        raise RuntimeError("缺少 v4101 payload 分段檔")
    return "".join(path.read_text(encoding="ascii").strip() for path in PAYLOAD_PARTS)


def unpack_payload() -> dict[str, str]:
    return json.loads(zlib.decompress(base64.b64decode(payload_text())).decode("utf-8"))


def write_if_changed(path: Path, content: str, changed: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old == content:
        return
    path.write_text(content, encoding="utf-8")
    changed.append(str(path.relative_to(ROOT)))


def patch_html(path: Path, changed: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    original = text
    text = re.sub(r'\s*<link[^>]+href=["\'][^"\']*site-ux-v(?:409|410)\.css[^"\']*["\'][^>]*>', '', text, flags=re.I)
    text = re.sub(r'\s*<script[^>]+src=["\'][^"\']*site-ux-v409\.js[^"\']*["\'][^>]*>\s*</script>', '', text, flags=re.I)
    css_tag = f'<link href="site-ux-v410.css?v={VERSION}" rel="stylesheet"/>'
    site_css = re.search(r'<link[^>]+href=["\']site\.css[^"\']*["\'][^>]*>', text, flags=re.I)
    if site_css:
        pos = site_css.end()
        text = text[:pos] + "\n" + css_tag + text[pos:]
    elif '</head>' in text:
        text = text.replace('</head>', css_tag + '\n</head>', 1)
    text = re.sub(r'<script\s+src=["\']site\.js[^"\']*["\']\s*>\s*</script>', f'<script src="site.js?v={VERSION}"></script>', text, flags=re.I)
    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))


def patch_site_js(changed: list[str]) -> None:
    path = ROOT / 'site.js'
    text = path.read_text(encoding='utf-8')
    original = text
    text = text.replace('全站統一正式版 v410.0', '全站統一正式版 v410.1')
    text = re.sub(r'const UX_VERSION = ["\']410\.0["\'];', 'const UX_VERSION = "410.1";', text)
    pattern = r'function renderBrandPage\(\) \{.*?\n\}\n\nfunction renderMobileCompareCards'
    replacement = (
        'function renderBrandPage() {\n'
        '  // 品牌故事採 brand.html 的完整靜態內容，避免動態覆蓋造成時間軸或版面不一致。\n'
        '}\n\nfunction renderMobileCompareCards'
    )
    text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1 and '品牌故事採 brand.html' not in text:
        raise RuntimeError('無法定位 site.js 的 renderBrandPage 函式')
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append('site.js')


def patch_css(css_append: str, changed: list[str]) -> None:
    path = ROOT / 'site-ux-v410.css'
    text = path.read_text(encoding='utf-8')
    original = text
    marker = '/* ===== v410.1｜全站文案、圖片比例與遮擋防護 ===== */'
    if marker in text:
        text = text[:text.index(marker)].rstrip() + '\n\n'
    text += css_append.rstrip() + '\n'
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append('site-ux-v410.css')


def patch_products(changed: list[str]) -> None:
    path = ROOT / 'products.html'
    text = path.read_text(encoding='utf-8')
    original = text
    text = text.replace('"dateModified":"2026-07-13"', '"dateModified":"2026-07-28"')
    old = '目前整理為五大產品型態、六項規格：龜鹿膏100g、龜鹿飲30cc、龜鹿飲180cc、龜鹿湯塊75g、龜鹿膠600g及鹿茸粉75g。'
    new = '目前整理為五大產品型態、六項規格：龜鹿膏100g、龜鹿飲30cc玻璃罐、龜鹿飲180cc鋁袋、龜鹿湯塊75g（8入）、龜鹿膠600g及鹿茸粉75g。龜鹿湯塊只有75g（8入）這一個正式規格。'
    text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append('products.html')


def patch_sitemap(changed: list[str]) -> None:
    path = ROOT / 'sitemap.xml'
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    updated = re.sub(r'<lastmod>[^<]+</lastmod>', '<lastmod>2026-07-28</lastmod>', text)
    if updated != text:
        path.write_text(updated, encoding='utf-8')
        changed.append('sitemap.xml')


def main() -> None:
    payload = unpack_payload()
    changed: list[str] = []
    for rel, content in payload.items():
        if rel == '__CSS_APPEND__':
            continue
        write_if_changed(ROOT / rel, content, changed)
    for path in sorted(ROOT.glob('*.html')):
        if 'site.js' in path.read_text(encoding='utf-8', errors='ignore'):
            patch_html(path, changed)
    patch_site_js(changed)
    patch_css(payload['__CSS_APPEND__'], changed)
    patch_products(changed)
    patch_sitemap(changed)
    subprocess.run([sys.executable, str(ROOT / 'tools/apply_v4091_official_packaging.py')], cwd=ROOT, check=True)
    unique = list(dict.fromkeys(changed))
    print(f'v410.1 套用完成，共直接更新 {len(unique)} 個檔案。')
    for item in unique:
        print(f'- {item}')


if __name__ == '__main__':
    main()
