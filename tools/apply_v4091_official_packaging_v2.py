#!/usr/bin/env python3
"""同步正式包裝名稱：30cc 小玻璃罐；湯塊只保留 75g（8入）。"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUFFIXES = {'.html', '.json', '.js', '.txt', '.xml', '.webmanifest'}

REPLACE = (
    ('龜鹿飲30cc玻璃瓶', '龜鹿飲30cc玻璃罐'),
    ('龜鹿飲 30cc 玻璃瓶', '龜鹿飲 30cc 玻璃罐'),
    ('30cc／瓶（玻璃瓶）', '30cc／罐（小玻璃罐）'),
    ('30cc / 瓶（玻璃瓶）', '30cc／罐（小玻璃罐）'),
    ('30cc / 瓶 (玻璃瓶)', '30cc／罐（小玻璃罐）'),
    ('30cc玻璃小瓶', '30cc小玻璃罐'),
    ('玻璃小瓶較輕巧', '小玻璃罐較輕巧'),
    ('偏好小瓶即飲', '偏好小玻璃罐即飲'),
)


def files():
    for path in ROOT.iterdir():
        if path.is_file() and path.suffix.lower() in SUFFIXES:
            yield path
    for folder in ('data', 'content'):
        base = ROOT / folder
        if base.exists():
            yield from (p for p in base.rglob('*') if p.is_file() and p.suffix.lower() in SUFFIXES)


def replace_text(text: str) -> str:
    for old, new in REPLACE:
        text = text.replace(old, new)
    text = text.replace('30cc玻璃瓶', '30cc玻璃罐')
    if '龜鹿飲30cc玻璃罐' in text or '30cc／罐（小玻璃罐）' in text:
        text = text.replace('30cc每日一瓶', '30cc每日一罐')
        text = text.replace('每日一瓶；180cc', '每日一罐；180cc')
        text = text.replace('開瓶即可飲用', '開罐即可飲用')
        text = text.replace('開瓶後請儘速飲用完畢', '開罐後請儘速飲用完畢')
    return text


def normalize(value):
    if isinstance(value, list):
        return [normalize(item) for item in value]
    if not isinstance(value, dict):
        return replace_text(value) if isinstance(value, str) else value

    for key in list(value):
        value[key] = normalize(value[key])

    product_id = str(value.get('id', ''))
    name = str(value.get('name', ''))
    if product_id == 'guilu-drink-30' or ('龜鹿飲' in name and '30cc' in name):
        value['name'] = '龜鹿飲30cc玻璃罐'
        value['displayName'] = '龜鹿飲30cc玻璃罐'
        value['size'] = '30cc／罐（小玻璃罐）'
        if isinstance(value.get('usage'), list):
            value['usage'] = ['每日一罐' if item == '每日一瓶' else str(item).replace('開瓶', '開罐') for item in value['usage']]
        if isinstance(value.get('storage'), list):
            value['storage'] = [str(item).replace('開瓶', '開罐') for item in value['storage']]
        if 'purposeDirection' in value:
            value['purposeDirection'] = str(value['purposeDirection']).replace('小瓶', '小玻璃罐')

    if product_id == 'guilu-tangkuai' or name == '龜鹿湯塊':
        value['size'] = '75g／盒｜8塊裝｜每塊約9.375g'
        for field in ('sizes', 'variants', 'specifications'):
            if isinstance(value.get(field), list):
                kept = [item for item in value[field] if not re.search(r'\b(?:300|600)\s*g\b', json.dumps(item, ensure_ascii=False), re.I)]
                value[field] = kept or ['75g（8入）']
    return value


def main():
    active = list(dict.fromkeys(files()))
    changed = []
    for path in active:
        old = path.read_text(encoding='utf-8')
        if path.suffix.lower() == '.json':
            try:
                new = json.dumps(normalize(json.loads(old)), ensure_ascii=False, indent=2) + '\n'
            except Exception:
                new = replace_text(old)
        else:
            new = replace_text(old)
        if new != old:
            path.write_text(new, encoding='utf-8')
            changed.append(str(path.relative_to(ROOT)))

    text = '\n'.join(path.read_text(encoding='utf-8', errors='ignore') for path in active)
    if '龜鹿飲30cc玻璃瓶' in text or '30cc／瓶（玻璃瓶）' in text:
        raise SystemExit('仍有龜鹿飲30cc玻璃瓶舊稱')
    if re.search(r'龜鹿湯塊\s*(?:300|600)\s*g', text, re.I):
        raise SystemExit('仍有龜鹿湯塊300g／600g舊規格')

    print(f'同步完成：{len(changed)} 個檔案')
    for item in changed:
        print('-', item)


if __name__ == '__main__':
    main()
