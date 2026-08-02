#!/usr/bin/env python3
"""將公開內容統一為龜鹿飲 30cc 小玻璃瓶；不得刪除既有正式產品規格。"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUFFIXES = {'.html', '.json', '.js', '.txt', '.xml', '.webmanifest'}

REPLACE = (
    ('龜鹿飲30cc玻璃罐', '龜鹿飲30cc玻璃瓶'),
    ('龜鹿飲 30cc 玻璃罐', '龜鹿飲 30cc 小玻璃瓶'),
    ('30cc／罐（小玻璃罐）', '30cc／瓶（小玻璃瓶）'),
    ('30cc / 罐（小玻璃罐）', '30cc／瓶（小玻璃瓶）'),
    ('30cc / 罐 (小玻璃罐)', '30cc／瓶（小玻璃瓶）'),
    ('30cc玻璃小罐', '30cc小玻璃瓶'),
    ('30cc玻璃罐', '30cc玻璃瓶'),
    ('30cc小玻璃罐', '30cc小玻璃瓶'),
    ('30cc 小玻璃罐', '30cc 小玻璃瓶'),
    ('小玻璃罐較輕巧', '小玻璃瓶較輕巧'),
    ('偏好小玻璃罐即飲', '偏好小玻璃瓶即飲'),
    ('每日一罐', '每日一瓶'),
    ('開罐即可飲用', '開瓶即可飲用'),
    ('開罐後請儘速飲用完畢', '開瓶後請儘速飲用完畢'),
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
    result = text
    for old, new in REPLACE:
        result = result.replace(old, new)
    return result


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
        value['name'] = '龜鹿飲30cc玻璃瓶'
        value['displayName'] = '龜鹿飲30cc玻璃瓶'
        value['size'] = '30cc／瓶（小玻璃瓶）'
        if 'specification' in value:
            value['specification'] = '30cc／瓶（小玻璃瓶）'
        if 'spec' in value:
            value['spec'] = '30cc／瓶（小玻璃瓶）'
        if 'unit' in value:
            value['unit'] = '瓶'
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
    forbidden = ('龜鹿飲30cc玻璃罐', '30cc／罐（小玻璃罐）', '30cc小玻璃罐')
    remaining = [term for term in forbidden if term in text]
    if remaining:
        raise SystemExit('仍有龜鹿飲30cc舊稱：' + '、'.join(remaining))

    print(f'正式名稱同步完成：{len(changed)} 個檔案；既有產品規格完整保留。')
    for item in changed:
        print('-', item)


if __name__ == '__main__':
    main()
