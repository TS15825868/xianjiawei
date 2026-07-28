#!/usr/bin/env python3
"""套用 2026-07-28 正式包裝與產品規格。

正式規則：
- 龜鹿飲 30cc：玻璃罐，規格為 30cc／罐（小玻璃罐）。
- 龜鹿湯塊：只有 75g（8入）一個正式規格。
- 龜鹿膠 600g／一斤裝是另一項產品，不得誤刪或改成湯塊。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {'.html', '.json', '.js', '.txt', '.xml', '.webmanifest'}
ACTIVE_DIRS = ('data', 'content')

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


def active_files():
    for path in ROOT.iterdir():
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path
    for dirname in ACTIVE_DIRS:
        base = ROOT / dirname
        if not base.exists():
            continue
        for path in base.rglob('*'):
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                yield path


def replace_text(value: str) -> str:
    for old, new in REPLACEMENTS:
        value = value.replace(old, new)
    value = value.replace('30cc玻璃瓶', '30cc玻璃罐')
    return value


def normalize_product(item: dict) -> None:
    product_id = str(item.get('id', ''))
    name = str(item.get('name', ''))
    display = str(item.get('displayName', item.get('display_name', '')))
    joined = f'{product_id} {name} {display}'

    if product_id == 'guilu-drink-30' or ('龜鹿飲' in joined and '30cc' in joined):
        item['name'] = '龜鹿飲30cc玻璃罐'
        item['displayName'] = '龜鹿飲30cc玻璃罐'
        if 'display_name' in item:
            item['display_name'] = '龜鹿飲30cc玻璃罐'
        item['size'] = '30cc／罐（小玻璃罐）'
        if 'specification' in item:
            item['specification'] = '30cc／罐（小玻璃罐）'
        if 'spec' in item:
            item['spec'] = '30cc／罐（小玻璃罐）'
        if isinstance(item.get('usage'), list):
            item['usage'] = [
                '每日一罐' if str(text) == '每日一瓶' else replace_text(str(text)).replace('開瓶', '開罐')
                for text in item['usage']
            ]
        if isinstance(item.get('storage'), list):
            item['storage'] = [replace_text(str(text)).replace('開瓶', '開罐') for text in item['storage']]
        if 'description' in item:
            item['description'] = replace_text(str(item['description']))
        if 'purposeDirection' in item:
            item['purposeDirection'] = replace_text(str(item['purposeDirection'])).replace('小瓶', '小玻璃罐')
        if 'purpose_direction' in item:
            item['purpose_direction'] = replace_text(str(item['purpose_direction'])).replace('小瓶', '小玻璃罐')

    if product_id == 'guilu-tangkuai' or name == '龜鹿湯塊' or display == '龜鹿湯塊':
        item['size'] = '75g／盒｜8塊裝｜每塊約9.375g'
        if 'specification' in item:
            item['specification'] = '75g／盒｜8塊裝｜每塊約9.375g'
        if 'spec' in item:
            item['spec'] = '75g／盒｜8塊裝｜每塊約9.375g'
        for key in ('sizes', 'variants', 'specifications'):
            if isinstance(item.get(key), list):
                kept = [value for value in item[key] if not re.search(r'\b(?:300|600)\s*g\b', json.dumps(value, ensure_ascii=False), re.I)]
                item[key] = kept or ['75g（8入）']


def normalize_json(value):
    if isinstance(value, dict):
        for key in list(value):
            value[key] = normalize_json(value[key])
        normalize_product(value)
        return value
    if isinstance(value, list):
        return [normalize_json(item) for item in value]
    if isinstance(value, str):
        return replace_text(value)
    return value


def process(path: Path) -> bool:
    original = path.read_text(encoding='utf-8')
    if path.suffix.lower() == '.json':
        try:
            updated = json.dumps(normalize_json(json.loads(original)), ensure_ascii=False, indent=2) + '\n'
        except Exception:
            updated = replace_text(original)
    else:
        updated = replace_text(original)
        if '龜鹿飲30cc玻璃罐' in updated or '30cc／罐（小玻璃罐）' in updated:
            updated = updated.replace('開瓶即可飲用', '開罐即可飲用')
            updated = updated.replace('開瓶後請儘速飲用完畢', '開罐後請儘速飲用完畢')
            updated = updated.replace('每日一瓶；180cc', '每日一罐；180cc')
            updated = updated.replace('30cc每日一瓶', '30cc每日一罐')
    if updated == original:
        return False
    path.write_text(updated, encoding='utf-8')
    return True


def main() -> None:
    paths = list(dict.fromkeys(active_files()))
    changed = [str(path.relative_to(ROOT)) for path in paths if process(path)]

    violations = []
    for path in paths:
        text = path.read_text(encoding='utf-8', errors='ignore')
        if '龜鹿飲30cc玻璃瓶' in text or '30cc／瓶（玻璃瓶）' in text:
            violations.append(f'{path.relative_to(ROOT)}：仍有玻璃瓶舊稱')
        # 僅禁止把 300g／600g 寫成「龜鹿湯塊」；龜鹿膠 600g 保留。
        if re.search(r'龜鹿湯塊.{0,40}(?:300|600)\s*g|(?:300|600)\s*g.{0,40}龜鹿湯塊', text, re.I | re.S):
            violations.append(f'{path.relative_to(ROOT)}：仍有龜鹿湯塊 300g／600g 舊規格')
    if violations:
        raise SystemExit('\n'.join(violations))

    print(f'官方包裝與規格同步完成，共更新 {len(changed)} 個檔案。')
    for path in changed:
        print(f'- {path}')


if __name__ == '__main__':
    main()
