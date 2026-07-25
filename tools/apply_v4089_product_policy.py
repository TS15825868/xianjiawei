#!/usr/bin/env python3
"""Apply the approved 2026-07-25 product and brand policy without changing layouts or images."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "408.9"
UPDATED = "2026-07-25"

TEXT_SUFFIXES = {".html", ".js", ".css", ".json", ".txt", ".xml", ".webmanifest"}

EXACT_REPLACEMENTS = {
    "每日可依個人習慣安排1～2次": "每天一次，每次一小匙",
    "每次取1～2小匙": "初次食用可先從半匙開始",
    "或加入約100～300mL熱水化開": "或加入熱水化開",
    "可依日常作息安排於早上或下午": "可安排於早上或空腹前後，並避免睡前食用",
    "可直接取用，也可取1～2小匙加入約100～300mL熱水化開，調至適合溫度後飲用；可依日常作息安排於早上或下午。": "每天一次，每次一小匙；初次可先從半匙開始。可直接食用，也可加入熱水化開後調至適合溫度飲用；可安排於早上或空腹前後，避免睡前食用。",
    "取1～2小匙": "取一小匙（初次可先從半匙開始）",
    "龜鹿膏1～2小匙": "龜鹿膏一小匙（初次可先從半匙開始）",
    "取1～2小匙龜鹿膏放入杯中。": "取一小匙龜鹿膏放入杯中，初次可先從半匙開始。",
    "龜鹿膏可安排於早上或下午；其他產品可依食用方式與個人習慣調整。": "龜鹿膏可安排於早上或空腹前後，避免睡前食用；其他產品可依食用方式與個人習慣調整。",
    "取龜鹿膏加入約100～300mL熱水化開，調至適合溫度後飲用。": "取一小匙龜鹿膏，可直接食用或加入熱水化開，調至適合溫度後飲用。",
    "仙加味品牌創立於2008": "仙加味品牌於2008年完成註冊",
    "仙加味品牌正式成立": "「仙加味」品牌完成註冊",
    "仙加味品牌 Founded 2008": "仙加味品牌註冊 2008",
}

HTML_REPLACEMENTS = {
    "可直接取用，也可取1～2小匙加入約100～300mL熱水化開，調至適合溫度後飲用；可依日常作息安排於早上或下午。": "每天一次，每次一小匙；初次可先從半匙開始。可直接食用，也可加入熱水化開後調至適合溫度飲用；可安排於早上或空腹前後，避免睡前食用。",
    "<li>每日可依個人習慣安排1～2次</li><li>每次取1～2小匙</li><li>可直接食用</li><li>或加入約100～300mL熱水化開</li><li>調至適合溫度後飲用</li><li>可依日常作息安排於早上或下午</li>": "<li>每天一次，每次一小匙</li><li>初次食用可先從半匙開始</li><li>可直接食用</li><li>或加入熱水化開</li><li>調至適合溫度後飲用</li><li>可安排於早上或空腹前後</li><li>避免睡前食用</li>",
    "龜鹿膏1～2小匙、熱水約100～300mL": "龜鹿膏一小匙（初次可先從半匙開始）、熱水適量",
    "可依日常作息安排於早上或下午，並依個人飲食習慣與產品標示使用。": "可安排於早上或空腹前後，並避免睡前食用；仍請依個人飲食習慣與產品標示使用。",
}


def replace_recursive(value):
    if isinstance(value, dict):
        return {key: replace_recursive(item) for key, item in value.items()}
    if isinstance(value, list):
        return [replace_recursive(item) for item in value]
    if isinstance(value, str):
        value = EXACT_REPLACEMENTS.get(value, value)
        for old, new in EXACT_REPLACEMENTS.items():
            value = value.replace(old, new)
        return value.replace("408.7", VERSION).replace("408.8", VERSION)
    return value


def update_product(product: dict) -> None:
    product_id = product.get("id")
    if product_id == "guilu-gao":
        product["usage"] = [
            "每天一次，每次一小匙",
            "初次食用可先從半匙開始",
            "可直接食用",
            "或加入熱水化開",
            "調至適合溫度後飲用",
            "可安排於早上或空腹前後",
            "避免睡前食用",
        ]
        product["purposeDirection"] = "適合希望建立固定日常節奏的人；可直接食用或以熱水化開，建議安排於早上或空腹前後，避免睡前食用。"
    elif product_id == "guilu-drink-30":
        product["usage"] = [
            "每日一瓶",
            "開瓶即可飲用",
            "可隔水加熱或溫熱後飲用",
            "避免冰飲",
            "開瓶後請儘速飲用完畢",
        ]
    elif product_id == "guilu-drink-180":
        product["usage"] = [
            "每日一包",
            "撕開包裝即可飲用",
            "可隔水加熱或溫熱後飲用",
            "避免冰飲",
            "開封後請儘速飲用完畢",
        ]


def normalize_structured_content(data: dict) -> None:
    for item in data.get("recommend", []):
        keyword = item.get("keyword")
        if keyword == "完整容量即飲食補":
            item["result"] = "龜鹿飲180cc"
            item["desc"] = "想一次飲用較完整容量、居家方便安排，可先看180cc鋁袋。"
        elif keyword == "固定日常食補":
            item["result"] = "龜鹿膏"
            item["desc"] = "每天一次，每次一小匙；初次可先從半匙開始。可安排於早上或空腹前後，避免睡前食用；可直接食用或加入熱水化開。"

    for faq in data.get("faq", []):
        question = faq.get("q")
        if question == "龜鹿食補什麼時間安排比較適合？":
            faq["a"] = "可依日常作息與飲食習慣安排。龜鹿膏可安排於早上或空腹前後，避免睡前食用；其他產品依正式使用方式與個人習慣調整。"
        elif question == "龜鹿飲怎麼喝？":
            faq["a"] = "30cc玻璃瓶每日一瓶；180cc鋁袋每日一包。可開封即飲，也可隔水加熱或溫熱後飲用，避免冰飲；開封後請儘速飲用完畢。"

    for item in data.get("pageContent", {}).get("guide", []):
        if item.get("title") == "龜鹿膏｜食用方式":
            item["desc"] = "【直接食用】\n每天一次，每次一小匙；初次可先從半匙開始。\n\n【熱飲】\n可加入熱水化開，調至適合溫度後飲用。\n\n【時間】\n可安排於早上或空腹前後，避免睡前食用。"
        elif item.get("title") == "龜鹿飲｜食用方式":
            item["desc"] = "30cc玻璃瓶每日一瓶；180cc鋁袋每日一包。開封即可飲用，也可隔水加熱或溫熱後飲用，避免冰飲；開封後請儘速飲用完畢。"

    brand = data.get("brandStory")
    if isinstance(brand, dict):
        brand["storyTitle"] = "仙加味品牌於2008年完成註冊"
        brand["story"] = "2008年，「仙加味」品牌完成註冊。第四代持續把多年工序與使用方式整理成膏、飲、湯塊、膠與粉等型態，讓現代人更容易理解。"
        for item in brand.get("timeline", []):
            title = str(item.get("title", ""))
            period = str(item.get("period", ""))
            if "2008" in title or "2008" in period:
                if "title" in item:
                    item["title"] = "2008 品牌完成註冊"
                if "desc" in item:
                    item["desc"] = "「仙加味」品牌完成註冊，開始以正式品牌名稱整理產品與日常使用資訊。"
                if "text" in item:
                    item["text"] = "「仙加味」品牌完成註冊，成為面向消費者的正式品牌名稱。"

    heritage = data.get("heritage")
    if isinstance(heritage, dict):
        short = "自1978延續至今｜仙加味品牌於2008年完成註冊"
        heritage["brandFounded"] = "2008"
        heritage["short"] = short
        heritage["footer"] = "SINCE 1978｜仙加味品牌註冊 2008｜萬華西昌街・傳統食補文化整理"
        heritage["headline"] = short


def update_json(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    data = replace_recursive(data)
    normalize_structured_content(data)
    for product in data.get("products", []):
        update_product(product)
    if path.name == "catalog-public.json":
        data["catalogVersion"] = VERSION
        data["updatedAt"] = UPDATED
    if path.name == "deploy-version.json":
        data["version"] = VERSION
        data["updated"] = UPDATED
        data["productPolicy"] = {
            "guiluGao": "每天一次一小匙；初次半匙；早上或空腹前後；避免睡前",
            "guiluDrink": "每日一份；可隔水加熱或溫熱飲用；避免冰飲",
            "images": "真實產品原圖，不重畫、不改包裝與規格",
        }
        data["brandPolicy"] = {
            "registration": "2008年「仙加味」品牌完成註冊",
            "heritage": "四代傳承，以已確認時間軸為準",
        }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_text(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in EXACT_REPLACEMENTS.items():
        text = text.replace(old, new)
    for old, new in HTML_REPLACEMENTS.items():
        text = text.replace(old, new)
    text = text.replace("408.7", VERSION).replace("408.8", VERSION)
    if text != original:
        path.write_text(text, encoding="utf-8")


def main() -> None:
    for name in ("data.json", "catalog-public.json", "deploy-version.json"):
        update_json(ROOT / name)

    for path in ROOT.iterdir():
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES and path.name not in {
            "data.json", "catalog-public.json", "deploy-version.json"
        }:
            update_text(path)

    changelog = ROOT / "CHANGELOG_v408.9.md"
    changelog.write_text(
        "# 仙加味官網 v408.9\n\n"
        "更新日期：2026-07-25\n\n"
        "- 龜鹿膏使用方式統一為每天一次、每次一小匙；初次可先從半匙開始。\n"
        "- 龜鹿膏可安排於早上或空腹前後，並避免睡前食用。\n"
        "- 龜鹿飲統一為每日一份，可隔水加熱或溫熱飲用，避免冰飲。\n"
        "- 修正180cc推薦、FAQ與使用導覽的結構化資料。\n"
        "- 2008年統一表述為「仙加味」品牌完成註冊。\n"
        "- 官網、FAQ、食譜、產品頁與機器可讀產品目錄同步。\n"
        "- 產品圖片維持真實原圖，不重畫、不改包裝文字與規格。\n",
        encoding="utf-8",
    )

    forbidden = (
        "1～2小匙",
        "1～2次",
        "仙加味品牌創立於2008",
        "仙加味品牌正式成立",
        "仙加味品牌 Founded 2008",
    )
    offenders = []
    for path in ROOT.iterdir():
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            text = path.read_text(encoding="utf-8", errors="ignore")
            if any(term in text for term in forbidden):
                offenders.append(path.name)
    if offenders:
        raise SystemExit(f"仍有舊版文字：{', '.join(sorted(offenders))}")

    print("仙加味官網 v408.9 產品與品牌規則同步完成")


if __name__ == "__main__":
    main()
