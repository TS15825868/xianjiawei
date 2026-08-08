#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://ts15825868.github.io/xianjiawei/"

IMAGES = {
    "guilu-gao": "images/products-v2/guilu-gao.jpeg",
    "guilu-drink-30": "images/products-v2/guilu-drink-30.jpeg",
    "guilu-drink-180": "images/products-v2/guilu-drink-180.jpeg",
    "guilu-tangkuai": "images/products-v2/guilu-tangkuai.jpeg",
    "guilu-jiao": "images/products-v2/guilu-jiao-open-new.jpg",
    "luerong-fen": "images/products-v2/luerong-fen.jpeg",
}
LEGACY_PROMO = {
    "guilu-gao": "products-v3/guilu-gao.jpg",
    "guilu-drink-30": "products-v3/guilu-drink-30.jpg",
    "guilu-drink-180": "products-v3/guilu-drink-180.jpg",
    "guilu-tangkuai": "products-v3/guilu-tangkuai.jpg",
    "guilu-jiao": "products-v3/guilu-jiao.jpg",
    "luerong-fen": "products-v3/luerong-fen.jpg",
}
PAGES = [
    "product-guilu-gao.html",
    "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html",
    "product-guilu-tangkuai.html",
    "product-guilu-jiao.html",
    "product-luerong-fen.html",
    "dm.html",
]


def normalize(value):
    value = str(value or "").split("?", 1)[0]
    if value.startswith(BASE):
        value = value[len(BASE):]
    return value.lstrip("/")


def main():
    catalog = json.loads((ROOT / "catalog-public.json").read_text(encoding="utf-8"))
    products = {item["id"]: item for item in catalog["products"]}
    assert set(products) == set(IMAGES), "catalog不是六項正式產品"

    for product_id, expected in IMAGES.items():
        item = products[product_id]
        assert normalize(item.get("image")) == expected, f"{product_id}.image不是products-v2實際產品照片"
        assert normalize(item.get("dmImage")) == expected, f"{product_id}.dmImage未回退到實際產品照片"
        assert (ROOT / expected).is_file(), f"缺少實際產品照片：{expected}"

    for page in PAGES:
        source = (ROOT / page).read_text(encoding="utf-8")
        assert "images/dm-final/" not in source, f"{page} 仍直接引用歷史DM"
        assert "object-fit:cover" not in source, f"{page} 產品圖疑似使用cover裁切"

    safety = (ROOT / "site-product-image-safety.js").read_text(encoding="utf-8")
    for expected in IMAGES.values():
        assert expected in safety, f"共用圖片安全層缺少實際照片：{expected}"
    for old in LEGACY_PROMO.values():
        assert old in safety, f"共用圖片安全層未攔截宣傳版面：{old}"
    for legacy in ["01_guilu-gao-100g-dm", "03_guilu-drink-180cc-dm", "04_luerong-fen-75g-dm", "05_guilu-tangkuai-75g-dm", "06_guilu-jiao-600g-dm"]:
        assert legacy in safety, f"共用圖片安全層未攔截歷史DM：{legacy}"
    assert "forceKnownSurfaces" in safety and "product-card[data-product-id]" in safety, "產品卡沒有依產品ID強制實際照片"
    assert "product-detail-hero__media" in safety, "產品詳頁沒有強制實際照片"

    variants = (ROOT / "site-official-product-variants.js").read_text(encoding="utf-8")
    assert 'term.textContent = "出貨"' in variants, "手機比較卡仍可能把出貨資訊誤標成適合"

    print("PASS actual product photos: catalog uses products-v2 actual photos; products-v3/DM are blocked; mobile fulfillment label is 出貨.")


if __name__ == "__main__":
    main()
