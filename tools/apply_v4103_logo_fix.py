#!/usr/bin/env python3
"""套用仙加味官網 v410.3：修正頁首／選單 Logo 放大、圖片比例與手機 FAQ 間距。"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "410.3"
STYLE_TAG = f'<link href="site-ux-v4103.css?v={VERSION}" rel="stylesheet"/>'


def uses_shell(text: str) -> bool:
    return any(token in text for token in (
        'id="site-header"', "id='site-header'",
        'id="site-footer"', "id='site-footer'",
        'id="site-menu-root"', "id='site-menu-root'",
    ))


def inject_style() -> list[str]:
    changed: list[str] = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="strict")
        if not uses_shell(text):
            continue
        updated = re.sub(
            r'\s*<link\s+href=["\']site-ux-v4103\.css\?v=[^"\']+["\']\s+rel=["\']stylesheet["\']\s*/?>',
            "",
            text,
            flags=re.I,
        )
        if "</head>" not in updated:
            raise RuntimeError(f"{path.name} 缺少 </head>")
        updated = updated.replace("</head>", STYLE_TAG + "\n</head>", 1)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed.append(path.name)
    return changed


def update_version(changed: list[str]) -> None:
    path = ROOT / "deploy-version.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["version"] = VERSION
    data["updated"] = "2026-07-28"
    policy = data.setdefault("imagePolicy", {})
    policy["logoSizing"] = "header-50px-mobile-44px-menu-40px-mobile-36px"
    policy["imageScaling"] = "natural-size-with-explicit-media-contain"
    checks = data.setdefault("integrityChecks", [])
    for item in (
        "header-logo-fixed-size",
        "menu-logo-fixed-size",
        "brand-media-contained-without-crop",
        "mobile-faq-spacing-compacted",
    ):
        if item not in checks:
            checks.append(item)
    rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if rendered != path.read_text(encoding="utf-8"):
        path.write_text(rendered, encoding="utf-8")
        changed.append("deploy-version.json")


def validate() -> None:
    css = (ROOT / "site-ux-v4103.css").read_text(encoding="utf-8")
    required = (
        ".brand-mark img",
        ".menu-brand-mini img",
        "width:50px!important",
        "width:40px!important",
        "object-fit:contain!important",
        ".faq-item summary",
    )
    for token in required:
        assert token in css, f"v410.3 缺少必要規則：{token}"

    shell_pages: list[str] = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="strict")
        if not uses_shell(text):
            continue
        shell_pages.append(path.name)
        assert text.count("site-ux-v4103.css") == 1, f"{path.name} 未正確載入 v410.3"

    assert len(shell_pages) >= 20, f"共用版型頁面數量異常：{len(shell_pages)}"

    products = (ROOT / "products.html").read_text(encoding="utf-8")
    assert "龜鹿飲30cc玻璃罐" in products
    assert "30cc／罐（小玻璃罐）" in products

    print(f"PASS v{VERSION}：{len(shell_pages)} 個官網頁面已修正 Logo、圖片比例與 FAQ 間距。")


def main() -> None:
    changed = inject_style()
    update_version(changed)
    validate()
    print(f"更新 {len(changed)} 個檔案：")
    for name in changed:
        print(f"- {name}")


if __name__ == "__main__":
    main()
