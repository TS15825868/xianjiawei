#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://ts15825868.github.io/xianjiawei/"

IMAGES = {
    "guilu-gao": "images/products-v3/guilu-gao.jpg",
    "guilu-drink-30": "images/products-v3/guilu-drink-30.jpg",
    "guilu-drink-180": "images/products-v3/guilu-drink-180.jpg",
    "guilu-tangkuai": "images/products-v3/guilu-tangkuai.jpg",
    "guilu-jiao": "images/products-v3/guilu-jiao.jpg",
    "luerong-fen": "images/products-v3/luerong-fen.jpg",
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
        assert normalize(item.get("image")) == expected, f"{product_id}.image不是正式原圖"
        assert normalize(item.get("dmImage")) == expected, f"{product_id}.dmImage不是正式原圖回退"
        assert (ROOT / expected).is_file(), f"缺少正式產品原圖：{expected}"

    for page in PAGES:
        source = (ROOT / page).read_text(encoding="utf-8")
        assert "images/dm-final/" not in source, f"{page} 仍直接引用歷史DM"
        assert "object-fit:cover" not in source, f"{page} 產品圖疑似使用cover裁切"

    dm = (ROOT / "dm.html").read_text(encoding="utf-8")
    for expected in IMAGES.values():
        assert expected in dm, f"dm.html缺少正式原圖：{expected}"
    assert "舊版DM" in dm and "不再作為目前正式產品依據" in dm, "dm.html缺少舊DM隔離說明"

    safety = (ROOT / "site-product-image-safety.js").read_text(encoding="utf-8")
    for expected in IMAGES.values():
        assert expected in safety, f"共用圖片安全層缺少：{expected}"
    for legacy in ["01_guilu-gao-100g-dm", "03_guilu-drink-180cc-dm", "04_luerong-fen-75g-dm", "05_guilu-tangkuai-75g-dm", "06_guilu-jiao-600g-dm"]:
        assert legacy in safety, f"共用圖片安全層未攔截歷史DM：{legacy}"

    print("PASS official originals: 六項正式產品與DM回退皆使用products-v3原圖；正式產品頁不直接引用歷史DM。")


if __name__ == "__main__":
    main()
