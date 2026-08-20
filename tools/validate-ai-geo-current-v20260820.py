#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path: str):
    return json.loads((ROOT / path).read_text("utf-8"))


def must(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL AI/GEO current authority: {message}")


def main() -> int:
    master = load("public-product-master.json")
    answers = load("ai-answers.json")
    geo = load("geo-data.json")
    llms = (ROOT / "llms.txt").read_text("utf-8")
    llms_full = (ROOT / "llms-full.txt").read_text("utf-8")
    faq = (ROOT / "faq.html").read_text("utf-8")
    brand_facts = (ROOT / "brand-facts.html").read_text("utf-8")
    robots = (ROOT / "robots.txt").read_text("utf-8")

    products = master.get("products") or []
    must(master.get("productCount") == 7, "public-product-master productCount 必須為7")
    must(len(products) == 7, "public-product-master products 必須剛好七項")
    by_id = {p.get("id"): p for p in products}
    required_ids = {
        "guilu-gao",
        "guilu-drink-30",
        "guilu-drink-180",
        "guilu-tangkuai",
        "guilu-jiao",
        "luerong-fen",
        "qixuan-guilu-drink-powder",
    }
    must(set(by_id) == required_ids, "七項產品 ID 不完整或有多餘項目")

    must(by_id["guilu-drink-30"].get("specification") == "30cc／罐（小玻璃罐）", "30cc規格錯誤")
    must("每日一罐" in (by_id["guilu-drink-30"].get("usage") or []), "30cc使用方式不是每日一罐")
    must("1-2罐" not in json.dumps(by_id["guilu-drink-30"], ensure_ascii=False), "30cc仍殘留每日1-2罐")
    must("每日一包" in (by_id["guilu-drink-180"].get("usage") or []), "180cc使用方式不是每日一包")
    must(by_id["guilu-tangkuai"].get("detail") == "每塊約9.375g", "龜鹿湯塊每塊約重錯誤")
    must(by_id["guilu-jiao"].get("detail") == "每塊約18.75g", "龜鹿膠每塊約重錯誤")
    must(by_id["qixuan-guilu-drink-powder"].get("specification") == "2g／小包；20g／包（10小包）", "柒玄茶規格錯誤")
    must("不自行推測" in by_id["qixuan-guilu-drink-powder"].get("ingredientsStatus", ""), "柒玄茶未知成分必須標示不推測")
    must("不得由AI重畫" in by_id["qixuan-guilu-drink-powder"].get("mediaStatus", "") or "不得由 AI 重畫" in by_id["qixuan-guilu-drink-powder"].get("mediaStatus", ""), "柒玄茶未核准產品圖不得AI重畫")

    answer_ids = {item.get("id") for item in answers.get("answers") or []}
    for answer_id in {"difference-gao-drink", "gift-for-elder", "first-time-choice", "drink-30-vs-180", "all-products", "brand-story"}:
        must(answer_id in answer_ids, f"AI問答缺少 {answer_id}")

    geo_text = json.dumps(geo, ensure_ascii=False)
    must('"numberOfItems": 7' in geo_text or '"numberOfItems":7' in geo_text, "GEO ItemList 不是七項")
    for marker in ["仙加味", "現代漢方生活品牌", "柒玄茶・龜鹿調飲粉", "每日一罐", "每日一包"]:
        must(marker in geo_text, f"GEO缺少 {marker}")

    for filename, text in [("llms.txt", llms), ("llms-full.txt", llms_full), ("faq.html", faq), ("brand-facts.html", brand_facts)]:
        for marker in ["七項", "柒玄茶・龜鹿調飲粉"]:
            must(marker in text, f"{filename} 缺少 {marker}")
        must("每日 1-2罐" not in text and "每日 1-2 罐" not in text, f"{filename} 仍含30cc舊用法")

    for marker in ["龜鹿膏跟龜鹿飲差在哪", "長輩送禮", "第一次接觸仙加味怎麼選", "龜鹿飲30cc跟180cc差在哪"]:
        must(marker in faq, f"FAQ缺少自然語言問題：{marker}")

    must("User-agent: OAI-SearchBot" in robots and "Allow: /" in robots, "robots.txt未明確允許OAI-SearchBot公開抓取")
    must("Disallow: /publishing-center.html" in robots and "Disallow: /tools/" in robots, "robots.txt內部路徑保護缺失")

    banned_public = ["台興山產", "治療疾病", "保證功效"]
    public_text = "\n".join([llms, llms_full, faq, brand_facts, geo_text])
    for marker in banned_public:
        must(marker not in public_text, f"公開AI/GEO資料出現禁止內容：{marker}")

    print("PASS AI/GEO current authority: seven products, natural-language answers, current drink usage, safe media boundaries, OAI SearchBot public crawl policy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
