#!/usr/bin/env python3
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    "index.html",
    "products.html",
    "choose.html",
    "combo.html",
    "guide.html",
    "recipes.html",
    "faq.html",
    "brand.html",
    "contact.html",
    "trial.html",
    "product-guilu-gao.html",
    "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html",
    "product-guilu-tangkuai.html",
    "product-guilu-jiao.html",
    "product-luerong-fen.html",
]

FORBIDDEN_VISIBLE = [
    "products-v2",
    "products-v3",
    "GitHub Web",
    "正式產品原圖為唯一產品本體來源",
    "核准原圖",
    "AI重畫",
    "實際尺寸鎖",
    "安全層",
    "runtime",
    "快取版本",
    "正式母本",
    "資料更新：2026-08-09",
]

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "template", "noscript"}:
            self.hidden_depth += 1

    def handle_endtag(self, tag):
        if tag in {"script", "style", "template", "noscript"} and self.hidden_depth:
            self.hidden_depth -= 1

    def handle_data(self, data):
        if not self.hidden_depth:
            text = " ".join(data.split())
            if text:
                self.parts.append(text)


def visible_text(path: Path) -> str:
    parser = VisibleText()
    parser.feed(path.read_text(encoding="utf-8"))
    return " ".join(parser.parts)


def req(ok: bool, message: str):
    if not ok:
        raise AssertionError(message)


def main():
    for rel in PUBLIC_PAGES:
        path = ROOT / rel
        req(path.exists(), f"缺少公開顧客頁：{rel}")
        text = visible_text(path)
        for phrase in FORBIDDEN_VISIBLE:
            req(phrase not in text, f"{rel} 可見文案仍含內部／開發用語：{phrase}")
        req("30cc玻璃瓶" not in text and "30cc／瓶" not in text, f"{rel} 又出現30cc瓶型舊稱")

    trial_path = ROOT / "trial.html"
    trial = trial_path.read_text(encoding="utf-8")
    trial_visible = visible_text(trial_path)
    req("<iframe" not in trial.lower(), "trial.html 不得再用iframe顯示正式試喝主圖，iPhone Safari曾出現灰屏")
    req("guilu-drink-trial-final-20260808-web.svg" in trial, "trial.html 未使用鎖定正式試喝主圖")
    req("<img" in trial and "trial-poster" in trial, "trial.html 正式試喝圖沒有使用一般img顯示")
    for phrase in [
        "3罐試喝品免費",
        "7-11 店到店",
        "運費 60元",
        "郵局宅配",
        "運費 100元",
        "30cc／罐（小玻璃罐）",
        "180cc／包（鋁袋）",
        "60元／罐",
        "11罐 600元",
        "200元／包",
        "11包 2,000元",
    ]:
        req(phrase in trial_visible, f"trial.html 缺少正式試喝資訊：{phrase}")

    product30 = visible_text(ROOT / "product-guilu-drink-30cc.html")
    req("裸罐、無貼紙、無外盒、無外袋、金色蓋" in product30, "30cc詳頁包裝事實不完整")
    products = visible_text(ROOT / "products.html")
    req("75g／盒｜8塊裝｜每塊約9.375g" in products, "產品總覽龜鹿湯塊規格錯誤")
    req("600g（1斤）／盒｜32塊裝｜每塊約18.75g" in products, "產品總覽龜鹿膠規格錯誤")

    print(f"PASS public customer pages: {len(PUBLIC_PAGES)} pages clean; no internal implementation dialogue; trial poster uses img and official trial facts")

if __name__ == "__main__":
    main()
