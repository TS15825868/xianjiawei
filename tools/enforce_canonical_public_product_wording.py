#!/usr/bin/env python3
"""Lock canonical public product wording and official specifications."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PUBLIC_TEXT_FILES = [
    *sorted(ROOT.glob("*.html")),
    ROOT / "data.json",
    ROOT / "catalog-public.json",
    ROOT / "geo-data.json",
    ROOT / "llms.txt",
    ROOT / "llms-full.txt",
]

REPLACEMENTS = {
    "30cc／瓶（小玻璃瓶）": "30cc／罐（小玻璃罐）",
    "30cc／玻璃瓶": "30cc／罐（小玻璃罐）",
    "30cc玻璃瓶": "30cc玻璃罐",
    "30cc小玻璃瓶": "30cc小玻璃罐",
    "小玻璃瓶裝": "小玻璃罐裝",
    "矮胖的小玻璃瓶裝": "小玻璃罐裝",
    "小玻璃瓶": "小玻璃罐",
    "輕巧瓶裝": "小玻璃罐輕巧方便",
    "每日一瓶": "每日一罐",
    "開瓶即可飲用": "開罐即可飲用",
    "開瓶後請儘速飲用完畢": "開罐後請儘速飲用完畢",
    "想開瓶或開袋即飲": "想開罐或開袋即飲",
    "180cc／鋁袋": "180cc／包（鋁袋）",
    "75g／8塊": "75g／盒｜8塊裝｜每塊約9.375g",
    "600g／32塊": "600g／盒（1斤）｜32塊裝｜每塊約18.75g",
    "600g（1斤）／盒｜32塊裝｜每塊約18.75g": "600g／盒（1斤）｜32塊裝｜每塊約18.75g",
    "600g（1斤）／盒": "600g／盒（1斤）",
}

EXPECTED = {
    "guilu-drink-30": ("龜鹿飲30cc玻璃罐", "30cc／罐（小玻璃罐）"),
    "guilu-drink-180": ("龜鹿飲180cc鋁袋", "180cc／包（鋁袋）"),
    "guilu-gao": ("龜鹿膏", "100g／罐"),
    "guilu-tangkuai": ("龜鹿湯塊", "75g／盒｜8塊裝｜每塊約9.375g"),
    "guilu-jiao": ("龜鹿膠", "600g／盒（1斤）｜32塊裝｜每塊約18.75g"),
    "luerong-fen": ("鹿茸粉", "75g／罐"),
}

OBSOLETE_30CC = (
    "30cc／瓶（小玻璃瓶）",
    "30cc／玻璃瓶",
    "30cc玻璃瓶",
    "30cc小玻璃瓶",
    "小玻璃瓶裝",
    "小玻璃瓶",
    "輕巧瓶裝",
    "每日一瓶",
    "開瓶即可飲用",
    "開瓶後請儘速飲用完畢",
    "想開瓶或開袋即飲",
)


def existing_public_files() -> list[Path]:
    return [path for path in PUBLIC_TEXT_FILES if path.exists()]


def normalize(write: bool) -> list[str]:
    changed: list[str] = []
    for path in existing_public_files():
        text = path.read_text(encoding="utf-8")
        updated = text
        for old, new in REPLACEMENTS.items():
            updated = updated.replace(old, new)
        if updated != text:
            changed.append(path.relative_to(ROOT).as_posix())
            if write:
                path.write_text(updated, encoding="utf-8")
    return changed


def validate_catalog() -> list[str]:
    errors: list[str] = []
    path = ROOT / "catalog-public.json"
    catalog = json.loads(path.read_text(encoding="utf-8"))
    products = catalog.get("products", [])
    ids = [item.get("id") for item in products]
    if ids != list(EXPECTED):
        errors.append(f"catalog-public.json 六項產品順序錯誤：{ids}")
    by_id = {item.get("id"): item for item in products}
    for product_id, (name, size) in EXPECTED.items():
        product = by_id.get(product_id)
        if not product:
            errors.append(f"catalog-public.json 缺少 {product_id}")
            continue
        if product.get("name") != name:
            errors.append(f"{product_id} 名稱錯誤：{product.get('name')!r}")
        if product.get("displayName") != name:
            errors.append(f"{product_id} displayName 錯誤：{product.get('displayName')!r}")
        if product.get("size") != size:
            errors.append(f"{product_id} 規格錯誤：{product.get('size')!r}")
    return errors


def validate_public_text() -> list[str]:
    errors: list[str] = []
    old_soup_patterns = [
        re.compile(r"龜鹿湯塊\s*(?:規格\s*[：:]?\s*|[：:]\s*|為\s*|有\s*)?(?:150\s*g|300\s*g|600\s*g)", re.I),
        re.compile(r"龜鹿湯塊\s*(?:規格\s*[：:]?\s*|[：:]\s*|為\s*|有\s*)?(?:16\s*塊|32\s*塊)"),
    ]
    for path in existing_public_files():
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(ROOT).as_posix()
        for phrase in OBSOLETE_30CC:
            if phrase in text:
                errors.append(f"{relative} 仍含龜鹿飲30cc舊稱：{phrase}")
        if "600g（1斤）／盒" in text:
            errors.append(f"{relative} 仍含龜鹿膠錯誤字序：600g（1斤）／盒")
        for pattern in old_soup_patterns:
            match = pattern.search(text)
            if match:
                errors.append(f"{relative} 仍含龜鹿湯塊舊規格：{match.group(0)}")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    changed = normalize(args.write)
    if changed and not args.write:
        raise SystemExit("需要正規化公開文案：" + ", ".join(changed))

    errors = [*validate_catalog(), *validate_public_text()]
    if errors:
        raise SystemExit("\n".join(errors))

    if changed:
        print("已正規化：" + ", ".join(changed))
    print("PASS 官網公開產品名稱、AIO/SEO來源與六項正式規格：30cc統一小玻璃罐，龜鹿膠固定600g／盒（1斤）")


if __name__ == "__main__":
    main()
