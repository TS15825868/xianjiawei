#!/usr/bin/env python3
"""Apply the approved drink-led acquisition strategy to public site data and homepage."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESIRED_ORDER = [
    "guilu-drink-30",
    "guilu-drink-180",
    "guilu-gao",
    "guilu-tangkuai",
    "guilu-jiao",
    "luerong-fen",
]


def dump_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def reorder_products(products: list[dict]) -> list[dict]:
    by_id = {str(item.get("id", "")): item for item in products}
    missing = [product_id for product_id in DESIRED_ORDER if product_id not in by_id]
    if missing:
        raise SystemExit("缺少正式產品，不能套用龜鹿飲主打排序：" + ", ".join(missing))
    extras = [item for item in products if str(item.get("id", "")) not in DESIRED_ORDER]
    return [by_id[product_id] for product_id in DESIRED_ORDER] + extras


def update_json_files(write: bool) -> list[str]:
    changed: list[str] = []
    for relative in ("data.json", "catalog-public.json"):
        path = ROOT / relative
        value = json.loads(path.read_text(encoding="utf-8"))
        original = json.dumps(value, ensure_ascii=False, sort_keys=True)
        value["products"] = reorder_products(list(value.get("products", [])))
        if relative == "catalog-public.json":
            value["catalogVersion"] = "410.4"
            value["updatedAt"] = "2026-08-04"
        updated = json.dumps(value, ensure_ascii=False, sort_keys=True)
        if updated != original:
            changed.append(relative)
            if write:
                dump_json(path, value)
    return changed


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f"首頁找不到待更新區塊：{label}")
    if text.count(old) != 1:
        raise SystemExit(f"首頁待更新區塊數量異常：{label}（{text.count(old)}）")
    return text.replace(old, new, 1)


def update_homepage(write: bool) -> list[str]:
    path = ROOT / "index.html"
    original = path.read_text(encoding="utf-8")
    updated = original

    updated = replace_once(
        updated,
        "<p>依生活方式認識膏、飲、湯塊、膠與粉。先看使用情境，再比較正式規格，不必一次讀完所有資料。</p>",
        "<p>想省時間，可以先從開罐即飲的龜鹿飲開始；再依固定取用、沖泡燉湯或自行搭配，找到適合自己的日常方式。</p>",
        "首頁主視覺說明",
    )

    old_choice = """    <div class=\"section-heading\">\n      <p class=\"eyebrow\">先從生活方式開始</p>\n      <h2>你平常最容易做到哪一種？</h2>\n      <p>不用先記產品名稱，依照固定取用、方便飲用、沖泡燉湯或自行搭配，快速找到入口。</p>\n    </div>\n    <div class=\"home-choice-grid\">\n      <article class=\"card choice-card reveal\">\n        <span class=\"choice-card__index\">01</span>\n        <h3>固定節奏</h3>\n        <p>偏好小匙取用，或以熱水化開安排日常。</p>\n        <a class=\"text-link\" href=\"product-guilu-gao.html\">看龜鹿膏 →</a>\n      </article>\n      <article class=\"card choice-card reveal\">\n        <span class=\"choice-card__index\">02</span>\n        <h3>方便飲用</h3>\n        <p>想開瓶或開袋即飲，也能溫熱後飲用。</p>\n        <a class=\"text-link\" href=\"products.html#guilu-drink\">看龜鹿飲 →</a>\n      </article>"""

    new_choice = """    <div class=\"section-heading\">\n      <p class=\"eyebrow\">先從最省時間的入口開始</p>\n      <h2>不想多花時間，就先看龜鹿飲</h2>\n      <p>30cc小玻璃罐適合第一次接觸與隨身攜帶；180cc鋁袋適合居家與持續安排。龜鹿膏保留給希望建立固定取用節奏的人。</p>\n    </div>\n    <div class=\"home-choice-grid\">\n      <article class=\"card choice-card reveal\">\n        <span class=\"choice-card__index\">01</span>\n        <h3>方便飲用</h3>\n        <p>想開罐或開袋即飲，也能溫熱後飲用。</p>\n        <a class=\"text-link\" href=\"products.html#guilu-drink\">看龜鹿飲 →</a>\n      </article>\n      <article class=\"card choice-card reveal\">\n        <span class=\"choice-card__index\">02</span>\n        <h3>固定節奏</h3>\n        <p>偏好小匙取用，或以熱水化開安排日常。</p>\n        <a class=\"text-link\" href=\"product-guilu-gao.html\">看龜鹿膏 →</a>\n      </article>"""
    updated = replace_once(updated, old_choice, new_choice, "生活方式入口與前兩張卡片")

    old_rows = """          <tr><th scope=\"row\"><a href=\"product-guilu-gao.html\">龜鹿膏</a></th><td>固定日常</td><td>100g／罐</td><td>小匙取用或熱水化開</td></tr>\n          <tr><th scope=\"row\"><a href=\"product-guilu-drink-30cc.html\">龜鹿飲30cc</a></th><td>輕巧即飲</td><td>30cc／罐（小玻璃罐）</td><td>外出攜帶與工作空檔</td></tr>\n          <tr><th scope=\"row\"><a href=\"product-guilu-drink-180cc.html\">龜鹿飲180cc</a></th><td>完整份量即飲</td><td>180cc／包（鋁袋）</td><td>居家或工作時安排</td></tr>"""

    new_rows = """          <tr><th scope=\"row\"><a href=\"product-guilu-drink-30cc.html\">龜鹿飲30cc</a></th><td>輕巧即飲</td><td>30cc／罐（小玻璃罐）</td><td>第一次接觸、外出攜帶與工作空檔</td></tr>\n          <tr><th scope=\"row\"><a href=\"product-guilu-drink-180cc.html\">龜鹿飲180cc</a></th><td>完整份量即飲</td><td>180cc／包（鋁袋）</td><td>居家、工作時段與持續安排</td></tr>\n          <tr><th scope=\"row\"><a href=\"product-guilu-gao.html\">龜鹿膏</a></th><td>固定日常</td><td>100g／罐</td><td>小匙取用或熱水化開</td></tr>"""
    updated = replace_once(updated, old_rows, new_rows, "首頁快速比較前三項")

    updated = updated.replace('"dateModified":"2026-08-02"', '"dateModified":"2026-08-04"')

    if updated != original:
        if write:
            path.write_text(updated, encoding="utf-8")
        return ["index.html"]
    return []


def validate() -> None:
    for relative in ("data.json", "catalog-public.json"):
        value = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        ids = [str(item.get("id", "")) for item in value.get("products", [])[: len(DESIRED_ORDER)]]
        if ids != DESIRED_ORDER:
            raise SystemExit(f"{relative} 龜鹿飲主打排序不正確：{ids}")

    homepage = (ROOT / "index.html").read_text(encoding="utf-8")
    required = [
        "先從最省時間的入口開始",
        "不想多花時間，就先看龜鹿飲",
        "30cc小玻璃罐適合第一次接觸與隨身攜帶",
        '<span class="choice-card__index">01</span>\n        <h3>方便飲用</h3>',
        '<span class="choice-card__index">02</span>\n        <h3>固定節奏</h3>',
        "第一次接觸、外出攜帶與工作空檔",
    ]
    for marker in required:
        if marker not in homepage:
            raise SystemExit(f"首頁缺少龜鹿飲主打標記：{marker}")
    if "想開瓶或開袋即飲" in homepage:
        raise SystemExit("首頁仍含30cc開瓶舊稱")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    changed = [*update_json_files(args.write), *update_homepage(args.write)]
    if changed and not args.write:
        raise SystemExit("需要套用龜鹿飲主打策略：" + ", ".join(changed))
    validate()
    print("PASS 龜鹿飲主打策略：30cc消費者入口、180cc持續安排、龜鹿膏品牌深度；官網不顯示價格。")


if __name__ == "__main__":
    main()
