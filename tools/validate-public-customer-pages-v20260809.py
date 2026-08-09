#!/usr/bin/env python3
from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    "index.html",
    "products.html",
    "dm.html",
    "choose.html",
    "combo.html",
    "guide.html",
    "recipes.html",
    "faq.html",
    "brand.html",
    "brand-facts.html",
    "ingredients.html",
    "quality.html",
    "craft.html",
    "knowledge.html",
    "video.html",
    "hanfang-baike.html",
    "sources.html",
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
    "機器可讀產品母本",
    "catalog-public.json",
    "geo-data.json",
    "llms-full.txt",
    "官網、LINE OA、ERP 使用同一套正式資料",
]
PRIVATE_PRICE_RE = re.compile(r"(?<!\d)(?:60|100|200|600|1,500|1500|1,600|1600|1,800|1800|2,000|2000|2,100|2100|9,600|9600|12,000|12000)\s*元")

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
        req("正式售價" not in text and "優惠價" not in text, f"{rel} 不得公開顯示商品售價／優惠價")
        match = PRIVATE_PRICE_RE.search(text)
        req(match is None, f"{rel} 洩漏LINE／私訊銷售或配送金額：{match.group(0) if match else ''}")

    # 允許歷史型知識頁原始HTML仍帶舊的page-updated節點，但現役清理器必須在前台移除；
    # 已重寫的核心顧客頁則不得再有這種版本對話。
    source_clean_pages = ["index.html","products.html","dm.html","knowledge.html","ingredients.html","quality.html","brand-facts.html","faq.html","trial.html"]
    for rel in source_clean_pages:
        text = visible_text(ROOT / rel)
        req("資料更新：" not in text and "內容版本" not in text, f"{rel} 原始顧客文案仍含資料更新／內容版本說明")

    cleanup = (ROOT / "site-public-content-cleanup-v20260809.js").read_text(encoding="utf-8")
    req(".page-updated" in cleanup and "removeUpdatedNotes" in cleanup, "舊知識頁的資料更新註記沒有前台防回退清理")
    req("cleanVideoCopy" in cleanup, "影音頁仍缺少網站改版對話清理")

    trial_path = ROOT / "trial.html"
    trial = trial_path.read_text(encoding="utf-8")
    trial_visible = visible_text(trial_path)
    req("<iframe" not in trial.lower(), "trial.html 不得再用iframe顯示正式試喝主圖，iPhone Safari曾出現灰屏")
    req("guilu-drink-trial-final-20260808-web.svg" in trial, "trial.html 未使用鎖定正式試喝主圖")
    req("<img" in trial and "trial-poster" in trial, "trial.html 正式試喝圖沒有使用一般img顯示")
    for phrase in ["試喝品免費","運費自付","7-11 店到店","郵局宅配","配送費用由官方 LINE 確認","30cc／罐（小玻璃罐）","180cc／包（鋁袋）","產品售價、活動與實際購買方式統一由官方 LINE 最新回覆為準"]:
        req(phrase in trial_visible, f"trial.html 缺少正式試喝資訊：{phrase}")
    for forbidden in ["運費 60元","運費 100元","60元／罐","11罐 600元","200元／包","11包 2,000元","買10送1"]:
        req(forbidden not in trial_visible, f"trial.html 不得公開顯示價格／活動：{forbidden}")

    product30 = visible_text(ROOT / "product-guilu-drink-30cc.html")
    req("裸罐、無貼紙、無外盒、無外袋、金色蓋" in product30, "30cc詳頁包裝事實不完整")
    products = visible_text(ROOT / "products.html")
    req("75g／盒｜8塊裝｜每塊約9.375g" in products, "產品總覽龜鹿湯塊規格錯誤")
    req("600g（1斤）／盒｜32塊裝｜每塊約18.75g" in products, "產品總覽龜鹿膠規格錯誤")
    dm = visible_text(ROOT / "dm.html")
    req("六項產品實際包裝與規格" in dm, "產品實品照頁不是顧客版圖鑑")
    req("待審核" not in dm and "毫米尺寸未知" not in dm, "產品實品照頁仍露出內部審核／製圖說明")
    quality = visible_text(ROOT / "quality.html")
    req("ERP" not in quality and "產品資訊與實品一致" in quality, "品質頁仍把內部平台管理當成顧客內容")

    print(f"PASS public customer pages: {len(PUBLIC_PAGES)} pages audited; all public product/配送 prices hidden; core pages source-clean; trial poster uses img")

if __name__ == "__main__":
    main()
