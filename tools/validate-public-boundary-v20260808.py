#!/usr/bin/env python3
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://ts15825868.github.io/xianjiawei/"
CURRENT_30_USAGE = "每日 1–2 罐"

FORBIDDEN_PUBLIC = [
    "台興山產有限公司",
    "統一編號",
    "公司電話",
    "公司地址",
    "台北市萬華區西昌街 52 號",
    "台北市萬華區西昌街52號",
]

# 目前只有六項具核准正式產品實物圖與顧客產品頁；
# 第七項「柒玄茶・龜鹿調飲粉」屬正式文字知識，待核准實物原圖後再建立媒體頁。
MEDIA_PRODUCT_PAGES = {
    "product-guilu-gao.html",
    "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html",
    "product-guilu-tangkuai.html",
    "product-guilu-jiao.html",
    "product-luerong-fen.html",
}

EXPECTED_SPECS = {
    "guilu-gao": "100g／罐",
    "guilu-drink-30": "30cc／罐（小玻璃罐）",
    "guilu-drink-180": "180cc／包（鋁袋）",
    "guilu-tangkuai": "75g （2兩）／盒｜8塊裝",
    "guilu-jiao": "600g （1斤）／盒｜32塊裝",
    "luerong-fen": "75g／罐",
    "qixuan-guilu-drink-powder": "2g／小包；20g／包（10小包）",
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


def validate_current_authority():
    master = json.loads((ROOT / "public-product-master.json").read_text(encoding="utf-8"))
    products = {p.get("id"): p for p in master.get("products", []) if p.get("id")}
    assert master.get("authority") == "user-confirmed-current", "公開母資料不是目前使用者確認權威"
    assert master.get("productCount") == 7 and set(products) == set(EXPECTED_SPECS), "公開母資料不是目前七項產品"
    for product_id, spec in EXPECTED_SPECS.items():
        assert products[product_id].get("specification") == spec, f"{product_id} 規格未同步目前權威"
    assert products["guilu-drink-30"].get("usage", [None])[0] == CURRENT_30_USAGE, "30cc用法不是每日 1–2 罐"
    assert products["guilu-drink-180"].get("usage", [None])[0] == "每日一包", "180cc用法不是每日一包"


def main():
    validate_current_authority()

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

        if page in MEDIA_PRODUCT_PAGES:
            assert "images/dm-final/" not in source, f"{page} 正式產品主頁不應把詳細DM當產品主視覺"

        if page == "product-guilu-tangkuai.html":
            assert "75g （2兩）／盒｜8塊裝" in source
            assert "每塊約9.375g" in source
            assert "300g／盒" not in source
            assert "600g／盒" not in source

        if page == "product-guilu-jiao.html":
            assert "600g （1斤）／盒｜32塊裝" in source
            assert re.search(r"每塊約18\.75\s*g", source)

        if page == "product-guilu-drink-30cc.html":
            for phrase in ["30cc／罐", "小玻璃罐", "裸罐", "無貼紙", CURRENT_30_USAGE]:
                assert phrase in source, f"30cc正式頁缺少目前硬規格／使用資訊：{phrase}"
            for retired in ["每日1-2罐", "每日 1-2罐", "每日 1-2 罐", "每日1～2罐", "每日 1～2罐", "每日 1～2 罐"]:
                assert retired not in source, f"30cc正式頁仍含舊格式：{retired}"

        if page == "product-guilu-drink-180cc.html":
            assert "180cc／包" in source and "鋁袋" in source
            assert "每日一包" in source and "狹長" in source

    for page in ["index.html", "products.html"]:
        source = (ROOT / page).read_text(encoding="utf-8")
        for retired in ["提供六項正式產品", "目前六項正式產品", "看六項產品", "六項產品，一次看懂"]:
            assert retired not in source, f"{page} 仍以六項產品當成完整產品知識：{retired}"
        assert "柒玄茶・龜鹿調飲粉" in source, f"{page} 缺少第七項正式文字知識"

    contact = (ROOT / "contact.html").read_text(encoding="utf-8")
    assert "lin.ee/sHZW7NkR" in contact, "聯絡頁缺少官方LINE"
    assert "@762jybnm" in contact or "官方 LINE" in contact or "官方LINE" in contact, "聯絡頁LINE身份不清楚"

    print(
        f"PASS public boundary: 已檢查 sitemap {len(pages)} 個公開頁；"
        "七項文字權威、六項核准媒體、30cc每日 1–2 罐、180cc每日一包、"
        "湯塊75g（2兩）／8塊、龜鹿膠600g（1斤）／32塊與公開品牌邊界一致。"
    )


if __name__ == "__main__":
    main()
