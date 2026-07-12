from __future__ import annotations

import json
import re
import shutil
import struct
import zlib
from pathlib import Path

from PIL import Image

VERSION = "406.0"
ROOT = Path.cwd()
ARCHIVE = Path("/tmp/approved-v405-partial.zip")
OUT = ROOT / "images/brand/approved-v405"
TEMP = Path("/tmp/approved-originals")

RECOVERED_MAP = {
    "220827BE-A699-4CEE-8E03-93B00460BFC6.PNG": "faq.webp",
    "58A23A88-E70D-42E3-AE4D-A8328D868778.PNG": "product-guilu-tangkuai-75g.webp",
    "6FB7E7F6-81D1-45DB-AF35-29B418F22B61.PNG": "brand-story.webp",
    "73E8E13D-A347-4DCA-AC1F-5CC855F6C5B9.PNG": "product-guilu-jiao-600g.webp",
    "1DB73ACE-5051-4E6D-9B60-8914A77BE4EF.PNG": "recipes.webp",
    "7D2D344F-15E6-4734-A496-06A51CA88E64.PNG": "products-all.webp",
    "C62F7F09-7C89-4483-BABB-9D1FD2CEEAD6.PNG": "product-guilu-drink-180cc.webp",
    "CCCF7C46-1FB1-47D3-8CC5-4FC209DED7C3.PNG": "home-brand.webp",
    "2992D44D-8912-4F3E-A44E-5F19C79CD4A8.PNG": "contact-line.webp",
    "DCF43E0D-88CF-40C3-8C7D-726A7C252C29.PNG": "combo.webp",
    "0B096D87-8251-40D9-8986-F534D69900CD.PNG": "guide-how-to-use.webp",
    "6C25417A-4CE0-4B14-B602-47F553F0EC01.PNG": "product-luerong-fen-75g.webp",
}

DIRECT_FILES = {
    "choose.webp",
    "product-guilu-gao-100g.webp",
    "product-guilu-drink-30cc.webp",
}

EXPECTED = {
    "home-brand.webp",
    "products-all.webp",
    "choose.webp",
    "combo.webp",
    "guide-how-to-use.webp",
    "recipes.webp",
    "brand-story.webp",
    "faq.webp",
    "contact-line.webp",
    "product-guilu-gao-100g.webp",
    "product-guilu-drink-30cc.webp",
    "product-guilu-drink-180cc.webp",
    "product-guilu-tangkuai-75g.webp",
    "product-guilu-jiao-600g.webp",
    "product-luerong-fen-75g.webp",
}


def recover_local_zip_entries() -> dict[str, Path]:
    archive = ARCHIVE.read_bytes()
    TEMP.mkdir(parents=True, exist_ok=True)
    recovered: dict[str, Path] = {}
    pos = 0
    while True:
        idx = archive.find(b"PK\x03\x04", pos)
        if idx < 0 or idx + 30 > len(archive):
            break
        (_, _, _, method, _, _, _, compressed_size, _, name_len, extra_len) = struct.unpack_from(
            "<IHHHHHIIIHH", archive, idx
        )
        name_start = idx + 30
        name_end = name_start + name_len
        data_start = name_end + extra_len
        if data_start > len(archive):
            break
        name = archive[name_start:name_end].decode("utf-8", "replace")
        if method == 0:
            pos = max(data_start + compressed_size, idx + 4)
            continue
        if method != 8:
            pos = idx + 4
            continue
        inflater = zlib.decompressobj(-15)
        raw = inflater.decompress(archive[data_start:]) + inflater.flush()
        if not inflater.eof:
            break
        consumed = (len(archive) - data_start) - len(inflater.unused_data)
        basename = Path(name).name
        if basename in RECOVERED_MAP and "__MACOSX" not in name:
            destination = TEMP / basename
            destination.write_bytes(raw)
            recovered[basename] = destination
        pos = data_start + consumed

    missing = sorted(set(RECOVERED_MAP) - set(recovered))
    if missing:
        raise RuntimeError(f"Missing approved originals in repository history: {missing}")
    return recovered


def build_images(recovered: dict[str, Path]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in DIRECT_FILES:
        path = OUT / name
        if not path.is_file():
            raise RuntimeError(f"Missing directly uploaded image: {path}")

    for source_name, destination_name in RECOVERED_MAP.items():
        with Image.open(recovered[source_name]) as image:
            image.load()
            if image.size != (1448, 1086):
                raise RuntimeError(f"Wrong original dimensions: {source_name} {image.size}")
            image.convert("RGB").save(OUT / destination_name, "WEBP", quality=80, method=6)

    for path in OUT.iterdir():
        if path.is_file() and path.name not in EXPECTED:
            path.unlink()

    actual = {path.name for path in OUT.glob("*.webp")}
    if actual != EXPECTED:
        raise RuntimeError(f"Final image set mismatch; missing={sorted(EXPECTED-actual)}, extra={sorted(actual-EXPECTED)}")
    for name in EXPECTED:
        path = OUT / name
        if path.stat().st_size < 20_000:
            raise RuntimeError(f"Image is unexpectedly small: {path}")
        with Image.open(path) as image:
            if image.size != (1448, 1086):
                raise RuntimeError(f"Wrong final dimensions: {name} {image.size}")


def update_configuration() -> None:
    manifest = {
        "version": VERSION,
        "source": "14 user-approved originals plus dedicated choose image",
        "displayFormat": "WebP quality 80",
        "resolution": "1448x1086",
        "rules": [
            "完整顯示，不裁切、不拉伸、不改產品、不重畫包裝",
            "九個核心頁面與六個產品頁各自使用對應圖，不重複配置",
            "產品卡與產品主要介紹只使用 images/products-v3 真實產品原圖",
            "素材以15張獨立圖片保存，不依賴壓縮包部署",
        ],
        "corePages": {
            "home": "home-brand.webp",
            "products": "products-all.webp",
            "choose": "choose.webp",
            "combo": "combo.webp",
            "guide": "guide-how-to-use.webp",
            "recipes": "recipes.webp",
            "brand": "brand-story.webp",
            "faq": "faq.webp",
            "contact": "contact-line.webp",
        },
        "productPages": {
            "product-guilu-gao.html": "product-guilu-gao-100g.webp",
            "product-guilu-drink-30cc.html": "product-guilu-drink-30cc.webp",
            "product-guilu-drink-180cc.html": "product-guilu-drink-180cc.webp",
            "product-guilu-tangkuai.html": "product-guilu-tangkuai-75g.webp",
            "product-guilu-jiao.html": "product-guilu-jiao-600g.webp",
            "product-luerong-fen.html": "product-luerong-fen-75g.webp",
        },
    }
    (ROOT / "images/brand/approved-v405-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    site_js = ROOT / "site.js"
    site_js.write_text(site_js.read_text(encoding="utf-8").replace("405.0", VERSION), encoding="utf-8")

    mascot_js = ROOT / "approved-mascot-v405.js"
    mascot_text = mascot_js.read_text(encoding="utf-8")
    mascot_text = re.sub(r'const VERSION = "[^"]+";', f'const VERSION = "{VERSION}";', mascot_text)
    mascot_js.write_text(mascot_text, encoding="utf-8")

    deploy_version = {
        "version": VERSION,
        "assetMode": "15-independent-approved-images",
        "assetRoot": "images/brand/approved-v405/",
        "expectedImageCount": 15,
        "branch": "main",
    }
    (ROOT / "deploy-version.json").write_text(
        json.dumps(deploy_version, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    for page in ROOT.glob("*.html"):
        text = page.read_text(encoding="utf-8")
        text = re.sub(r'site\.css\?v=[^"\']+', f"site.css?v={VERSION}", text)
        text = re.sub(r'site-v321\.css\?v=[^"\']+', f"site-v321.css?v={VERSION}", text)
        text = re.sub(r'site\.js\?v=[^"\']+', f"site.js?v={VERSION}", text)
        if page.name == "index.html":
            text = re.sub(
                r'images/brand/(?:scene-brand-all\.svg|mascot-v404/home\.jpg|approved-v405/home-brand\.webp)(?:\?v=[^"\']+)?',
                f"images/brand/approved-v405/home-brand.webp?v={VERSION}",
                text,
            )
            text = text.replace("mascot-v404-home-story", "approved-home-mascot")
        page.write_text(text, encoding="utf-8")


def cleanup() -> None:
    shutil.rmtree(ROOT / "images/brand/mascot-v404", ignore_errors=True)
    for relative in [
        "mascot-v404.js",
        "site-v404.css",
        "images/brand/website-mascot-manifest.json",
        "temp-test.txt",
        "temp-trigger-v406.txt",
        "PAGES_BUILD_STATUS.json",
        ".github/workflows/recover-approved-v406.yml",
        "tools/recover-approved-v406.py",
    ]:
        (ROOT / relative).unlink(missing_ok=True)
    for path in (ROOT / ".github/workflows").glob("v405-*.yml"):
        path.unlink()


if __name__ == "__main__":
    recovered_files = recover_local_zip_entries()
    build_images(recovered_files)
    update_configuration()
    cleanup()
    print("Prepared 15 approved independent website images and removed obsolete assets.")
