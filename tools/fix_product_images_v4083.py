from pathlib import Path
import json
import re

VERSION = "408.3"

DM_TO_PRODUCT = {
    "images/dm-final/01_guilu-gao-100g-dm.jpg": "images/products-v3/guilu-gao.jpg",
    "images/dm-final/02_guilu-drink-30cc-dm.jpg": "images/products-v3/guilu-drink-30.jpg",
    "images/dm-final/03_guilu-drink-180cc-dm.jpg": "images/products-v3/guilu-drink-180.jpg",
    "images/dm-final/04_luerong-fen-75g-dm.jpg": "images/products-v3/luerong-fen.jpg",
    "images/dm-final/05_guilu-tangkuai-75g-dm.jpg": "images/products-v3/guilu-tangkuai.jpg",
    "images/dm-final/06_guilu-jiao-600g-dm.jpg": "images/products-v3/guilu-jiao.jpg",
}


def versioned(path: str) -> str:
    return f"{path.split('?')[0]}?v={VERSION}"


def update_data() -> None:
    path = Path("data.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    products = data.get("products", [])
    assert len(products) == 6, len(products)

    for product in products:
        base = product["image"].split("?")[0]
        assert base.startswith("images/products-v3/"), (product.get("id"), base)
        assert Path(base).is_file(), base
        real = versioned(base)
        product["image"] = real
        product["dmImage"] = real
        product["detailImages"] = [real]

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def update_active_text_files() -> None:
    targets = list(Path(".").glob("*.html")) + [Path("site.js"), Path("site.css")]
    version_pattern = re.compile(
        r"(\.(?:css|js|json|jpg|jpeg|png|webp|avif))\?v=[0-9.]+"
    )

    for path in targets:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for old, new in DM_TO_PRODUCT.items():
            text = text.replace(old, new)
        text = version_pattern.sub(lambda m: m.group(1) + f"?v={VERSION}", text)
        text = text.replace("產品DM", "產品圖文整理")
        text = text.replace("六項產品 DM", "六項產品圖文整理")
        text = text.replace("整合正式版 v408.2", "整合正式版 v408.3")
        path.write_text(text, encoding="utf-8")


def update_deploy_manifest() -> None:
    deploy = {
        "version": VERSION,
        "updated": "2026-07-13",
        "status": "production-ready",
        "catalog": "five-types-six-specifications",
        "imagePolicy": {
            "productCards": "verified-original-product-image",
            "quickViewModal": "verified-original-product-image",
            "detailHero": "verified-original-product-image",
            "detailGallery": "verified-original-product-image",
            "detailMascot": "approved-page-specific-mascot",
            "dmPage": "verified-original-product-image-with-live-text",
        },
        "frontend": "single-site-js-and-single-site-css",
        "automation": "main-only-auto-deploy-and-trusted-pr-auto-merge",
        "safety": "no-redrawn-product-packaging-in-active-display",
    }
    Path("deploy-version.json").write_text(
        json.dumps(deploy, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def update_deploy_workflow() -> None:
    path = Path(".github/workflows/deploy-pages.yml")
    text = path.read_text(encoding="utf-8").replace("408.2", VERSION)

    text = re.sub(
        r"\n\s*dm_files=\[.*?\n\s*\]\n",
        "\n          dm_files=[]\n",
        text,
        count=1,
        flags=re.S,
    )

    old_assert = "assert product['dmImage'].endswith('.jpg?v=408.3'), product['dmImage']"
    new_assert = (
        "assert product['dmImage'] == product['image'], product\n"
        "              assert product.get('detailImages') == [product['image']], product"
    )
    text = text.replace(old_assert, new_assert)
    text = text.replace(
        "正式驗收完成：15張小老闆、6張產品主圖、6張DM、單一JS/CSS",
        "正式驗收完成：15張小老闆、6張真實產品主圖、快速查看及圖文頁均使用真實產品圖、單一JS/CSS",
    )
    path.write_text(text, encoding="utf-8")


def remove_wrong_dm_files() -> None:
    for path in DM_TO_PRODUCT:
        Path(path).unlink(missing_ok=True)


def validate() -> None:
    data = json.loads(Path("data.json").read_text(encoding="utf-8"))
    assert len(data["products"]) == 6
    for product in data["products"]:
        assert product["image"].startswith("images/products-v3/")
        assert product["image"].endswith(f"?v={VERSION}")
        assert product["dmImage"] == product["image"]
        assert product["detailImages"] == [product["image"]]
        source = Path(product["image"].split("?")[0])
        assert source.is_file() and source.stat().st_size > 10000, source

    active_files = [*Path(".").glob("*.html"), Path("site.js"), Path("data.json")]
    active = "\n".join(
        p.read_text(encoding="utf-8") for p in active_files if p.exists()
    )
    assert "images/dm-final/" not in active
    assert "整合正式版 v408.3" in Path("site.js").read_text(encoding="utf-8")


if __name__ == "__main__":
    update_data()
    update_active_text_files()
    update_deploy_manifest()
    update_deploy_workflow()
    remove_wrong_dm_files()
    validate()
    print("PASS: active product displays use verified original product images")
