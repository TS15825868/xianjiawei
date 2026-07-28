#!/usr/bin/env python3
"""Apply the official 2026-07-28 packaging and product-spec policy.

Rules:
- 龜鹿飲 30cc is a 小玻璃罐, never a 玻璃瓶.
- 龜鹿湯塊 has one official specification only: 75g（8入）.
- 龜鹿膠 600g／一斤裝 is a separate product and must not be altered.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {'.html', '.json', '.js', '.txt', '.xml', '.webmanifest', '.md'}
SKIP_DIRS = {'.git', '_site', 'node_modules', 'images'}

REPLACEMENTS = [
    ('龜鹿飲30cc玻璃瓶', '龜鹿飲30cc玻璃罐'),
    ('龜鹿飲 30cc 玻璃瓶', '龜鹿飲 30cc 玻璃罐'),
    ('龜鹿飲30cc 玻璃瓶', '龜鹿飲30cc 玻璃罐'),
    ('30cc／瓶（玻璃瓶）', '30cc／罐（小玻璃罐）'),
    ('30cc / 瓶（玻璃瓶）', '30cc／罐（小玻璃罐）'),
    ('30cc / 瓶 (玻璃瓶)', '30cc／罐（小玻璃罐）'),
    ('30cc／瓶 (玻璃瓶)', '30cc／罐（小玻璃罐）'),
    ('30cc玻璃小瓶', '30cc小玻璃罐'),
    ('30cc 玻璃小瓶', '30cc 小玻璃罐'),
    ('30cc玻璃瓶每日一瓶', '30cc玻璃罐每日一罐'),
    ('30cc玻璃瓶每日一罐', '30cc玻璃罐每日一罐'),
    ('30cc玻璃瓶較輕巧', '30cc小玻璃罐較輕巧'),
    ('30cc玻璃瓶體積小', '30cc小玻璃罐體積小'),
    ('玻璃小瓶較輕巧', '小玻璃罐較輕巧'),
    ('偏好小瓶即飲', '偏好小玻璃罐即飲'),
    ('小瓶即飲', '小玻璃罐即飲'),
]


def replace_text(value: str) -> str:
    for old, new in REPLACEMENTS:
        value = value.replace(old, new)
    value = value.replace('30cc玻璃瓶', '30cc玻璃罐')
    return value


def normalize_product_dict(item: dict) -> None:
    product_id = str(item.get('id', ''))
    name = str(item.get('name', ''))
    display = str(item.get('displayName', item.get('display_name', '')))
    joined = f'{product_id} {name} {display}'

    if product_id == 'guilu-drink-30' or ('龜鹿飲' in joined and '30cc' in joined):
        if 'name' in item:
            item['name'] = '龜鹿飲30cc玻璃罐'
        if 'displayName' in item:
            item['displayName'] = '龜鹿飲30cc玻璃罐'
        if 'display_name' in item:
            item['display_name'] = '龜鹿飲30cc玻璃罐'
        for key in ('size', 'specification', 'spec'):
            if key in item:
                item[key] = '30cc／罐（小玻璃罐）'
        if isinstance(item.get('usage'), list):
            item['usage'] = [
                '每日一罐' if str(text) == '每日一瓶' else replace_text(str(text)).replace('開瓶', '開罐')
                for text in item['usage']
            ]
        if isinstance(item.get('storage'), list):
            item['storage'] = [replace_text(str(text)).replace('開瓶', '開罐') for text in item['storage']]
        if 'description' in item:
            item['description'] = replace_text(str(item['description'])).replace('玻璃小瓶', '小玻璃罐')
        if 'purposeDirection' in item:
            item['purposeDirection'] = replace_text(str(item['purposeDirection'])).replace('小瓶', '小玻璃罐')
        if 'purpose_direction' in item:
            item['purpose_direction'] = replace_text(str(item['purpose_direction'])).replace('小瓶', '小玻璃罐')

    if product_id == 'guilu-tangkuai' or ('龜鹿湯塊' in joined):
        for key in ('size', 'specification', 'spec'):
            if key in item:
                item[key] = '75g／盒｜8塊裝｜每塊約9.375g'
        for key in ('sizes', 'variants', 'specifications'):
            if isinstance(item.get(key), list):
                filtered = []
                for value in item[key]:
                    text = json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else str(value)
                    if re.search(r'\b(?:300|600)\s*g\b', text, re.I):
                        continue
                    filtered.append(value)
                item[key] = filtered or ['75g（8入）']


def normalize_json(value):
    if isinstance(value, dict):
        for key in list(value):
            value[key] = normalize_json(value[key])
        normalize_product_dict(value)
        return value
    if isinstance(value, list):
        return [normalize_json(item) for item in value]
    if isinstance(value, str):
        return replace_text(value)
    return value


def process_json(path: Path) -> bool:
    try:
        original_text = path.read_text(encoding='utf-8')
        data = json.loads(original_text)
    except Exception:
        return False
    normalized = normalize_json(data)
    rendered = json.dumps(normalized, ensure_ascii=False, indent=2) + '\n'
    if rendered != original_text:
        path.write_text(rendered, encoding='utf-8')
        return True
    return False


def process_text(path: Path) -> bool:
    original = path.read_text(encoding='utf-8')
    updated = replace_text(original)
    if '龜鹿飲30cc玻璃罐' in updated or '30cc小玻璃罐' in updated or '30cc／罐（小玻璃罐）' in updated:
        updated = updated.replace('開瓶即可飲用', '開罐即可飲用')
        updated = updated.replace('開瓶後請儘速飲用完畢', '開罐後請儘速飲用完畢')
        updated = updated.replace('每日一瓶；180cc', '每日一罐；180cc')
        updated = updated.replace('30cc每日一瓶', '30cc每日一罐')
    if updated != original:
        path.write_text(updated, encoding='utf-8')
        return True
    return False


def main() -> None:
    changed = []
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.resolve() == Path(__file__).resolve():
            continue
        did_change = process_json(path) if path.suffix.lower() == '.json' else process_text(path)
        if did_change:
            changed.append(str(path.relative_to(ROOT)))

    violations = []
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        if '龜鹿飲30cc玻璃瓶' in text or '30cc／瓶（玻璃瓶）' in text:
            violations.append(f'{path.relative_to(ROOT)}：仍有玻璃瓶舊稱')
        if re.search(r'龜鹿湯塊.{0,40}(?:300|600)\s*g|(?:300|600)\s*g.{0,40}龜鹿湯塊', text, re.I | re.S):
            violations.append(f'{path.relative_to(ROOT)}：仍有龜鹿湯塊 300g／600g 舊規格')
    if violations:
        raise SystemExit('\n'.join(violations))

    print(f'官方包裝與規格同步完成，共更新 {len(changed)} 個檔案。')
    for path in changed:
        print(f'- {path}')


if __name__ == '__main__':
    main()

# workflow trigger: 2026-07-28 official naming refresh
