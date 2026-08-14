#!/usr/bin/env python3
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://ts15825868.github.io/xianjiawei/"

FORBIDDEN_PUBLIC = [
    "台興山產有限公司",
    "統一編號",
    "公司電話",
    "公司地址",
    "台北市萬華區西昌街 52 號",
    "台北市萬華區西昌街52號",
]
PRODUCT_PAGES = {
    "product-guilu-gao.html",
    "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html",
    "product-guilu-tangkuai.html",
    "product-guilu-jiao.html",
    "product-luerong-fen.html",
}


def sitemap_pages():
    root = ET.fromstring((ROOT / "sitemap.xml").read_text(encoding="utf-8"))
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    pages = []
    for loc in root.findall("s:url/s:loc", namespace):
        url = (loc.text or "").strip()
        if url.startswith(BASE):
            path = url[len(BASE):] or "index.html"
            if path.endswith("/"):
                path += "index.html"
            if path.endswith(".html"):
                pages.append(path)
    return sorted(set(pages))


def main():
    pages = sitemap_pages()
    assert pages, "sitemap沒有公開HTML頁"
    missing = [page for page in pages if not (ROOT / page).is_file()]
    assert not missing, f"sitemap指向不存在頁面：{missing}"

    for page in pages:
        source = (ROOT / page).read_text(encoding="utf-8")
        for phrase in FORBIDDEN_PUBLIC:
            assert phrase not in source, f"{page} 公開頁出現禁止公司／內部資訊：{phrase}"
        assert "龜鹿飲30cc玻璃瓶" not in source, f"{page} 仍把30cc稱玻璃瓶"
        assert "30cc／瓶" not in source, f"{page} 仍使用30cc／瓶"
        assert "小玻璃瓶" not in source, f"{page} 仍使用小玻璃瓶"
        if page in PRODUCT_PAGES:
            assert "images/dm-final/" not in source, f"{page} 正式產品主頁不應把詳細DM當產品主視覺"
        if page == "product-guilu-tangkuai.html":
            assert "75g／盒" in source
            assert "300g／盒" not in source
            assert "600g／盒" not in source
        if page == "product-guilu-jiao.html":
            assert "600g（1斤）／盒" in source
            assert "32塊裝" in source
        if page == "product-guilu-drink-30cc.html":
            for phrase in ["30cc／罐", "小玻璃罐", "裸罐", "無貼紙", "每日 1-2罐"]:
                assert phrase in source, f"30cc正式頁缺少目前硬規格／使用資訊：{phrase}"
        if page == "product-guilu-drink-180cc.html":
            assert "180cc／包" in source and "鋁袋" in source
            assert "每日一包；飲用時間可依個人使用習慣與作息時間安排" in source and "狹長" in source

    contact = (ROOT / "contact.html").read_text(encoding="utf-8")
    assert "lin.ee/sHZW7NkR" in contact, "聯絡頁缺少官方LINE"
    assert "@762jybnm" in contact or "官方 LINE" in contact or "官方LINE" in contact, "聯絡頁LINE身份不清楚"

    print(
        f"PASS public boundary: 已檢查 sitemap {len(pages)} 個公開頁；"
        "公司內部資訊、30cc罐型、湯塊舊容量、龜鹿膠1斤／32塊規格與產品頁媒體角色均未越界。"
    )


if __name__ == "__main__":
    main()
