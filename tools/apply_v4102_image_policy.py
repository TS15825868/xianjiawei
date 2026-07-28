#!/usr/bin/env python3
"""套用仙加味官網 v410.2：全站圖片完整顯示、品牌時間軸單欄與30cc玻璃罐正式名稱。"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "410.2"
STYLE_TAG = f'<link href="site-ux-v4102.css?v={VERSION}" rel="stylesheet"/>'
SKIP_DIRS = {
    ".git", ".github", "tools", "_site", "_payload", "_upload",
    "node_modules", "images"
}
TEXT_SUFFIXES = {".html", ".json", ".js", ".xml", ".txt", ".md", ".webmanifest"}
REPLACEMENTS = (
    ("龜鹿飲30cc玻璃瓶", "龜鹿飲30cc玻璃罐"),
    ("龜鹿飲 30cc 玻璃瓶", "龜鹿飲 30cc 玻璃罐"),
    ("龜鹿飲30cc 玻璃瓶", "龜鹿飲30cc 玻璃罐"),
    ("30cc／瓶（玻璃瓶）", "30cc／罐（小玻璃罐）"),
    ("30cc / 瓶（玻璃瓶）", "30cc／罐（小玻璃罐）"),
    ("30cc / 瓶 (玻璃瓶)", "30cc／罐（小玻璃罐）"),
    ("30cc／瓶 (玻璃瓶)", "30cc／罐（小玻璃罐）"),
    ("30cc玻璃瓶", "30cc玻璃罐"),
)


def is_public_text(path: Path) -> bool:
    if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
        return False
    relative = path.relative_to(ROOT)
    return not any(part in SKIP_DIRS for part in relative.parts)


def replace_public_wording(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text


def ensure_style_link(path: Path, text: str) -> str:
    uses_shell = any(token in text for token in (
        'id="site-header"', "id='site-header'",
        'id="site-footer"', "id='site-footer'",
        'id="site-menu-root"', "id='site-menu-root'",
    ))
    if not uses_shell or path.suffix.lower() != ".html":
        return text

    text = re.sub(
        r'\s*<link\s+href=["\']site-ux-v4102\.css\?v=[^"\']+["\']\s+rel=["\']stylesheet["\']\s*/?>',
        "",
        text,
        flags=re.I,
    )
    if "</head>" not in text:
        raise RuntimeError(f"{path.name} 缺少 </head>")
    return text.replace("</head>", STYLE_TAG + "\n</head>", 1)


def process_public_files() -> list[str]:
    changed: list[str] = []
    for path in sorted(ROOT.rglob("*")):
        if not is_public_text(path):
            continue
        original = path.read_text(encoding="utf-8", errors="strict")
        updated = replace_public_wording(original)
        updated = ensure_style_link(path, updated)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    return changed


def update_deploy_version(changed: list[str]) -> None:
    path = ROOT / "deploy-version.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["version"] = VERSION
    data["updated"] = "2026-07-28"
    data["status"] = "production-ready-audited"
    policy = data.setdefault("imagePolicy", {})
    policy["allWebsiteImages"] = "proportional-contain-no-crop"
    policy["brandTimeline"] = "single-column-no-blue-intro-card"
    policy["guiluDrink30cc"] = "龜鹿飲30cc玻璃罐｜30cc／罐（小玻璃罐）"
    checks = data.setdefault("integrityChecks", [])
    for item in (
        "all-shell-pages-load-v4102-image-policy",
        "all-images-proportional-contain-no-crop",
        "brand-timeline-full-width-without-blue-intro-card",
        "guilu-drink-30cc-glass-jar-wording-locked",
    ):
        if item not in checks:
            checks.append(item)
    rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if rendered != path.read_text(encoding="utf-8"):
        path.write_text(rendered, encoding="utf-8")
        if "deploy-version.json" not in changed:
            changed.append("deploy-version.json")


def validate() -> None:
    css = (ROOT / "site-ux-v4102.css").read_text(encoding="utf-8")
    assert "object-fit:contain!important" in css, "v410.2 缺少圖片 contain 規則"
    assert ".brand-story-panel" in css and "display:block!important" in css, "品牌時間軸尚未改為全寬"
    assert "background:transparent!important" in css, "藍色導讀框尚未取消"

    shell_pages = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="strict")
        uses_shell = any(token in text for token in (
            'id="site-header"', "id='site-header'",
            'id="site-footer"', "id='site-footer'",
            'id="site-menu-root"', "id='site-menu-root'",
        ))
        if not uses_shell:
            continue
        shell_pages.append(path.name)
        assert "site-ux-v4102.css?v=410.2" in text, f"{path.name} 尚未載入 v410.2"
        assert text.count("site-ux-v4102.css") == 1, f"{path.name} 重複載入 v410.2"

    assert len(shell_pages) >= 20, f"共用版型頁面數量異常：{len(shell_pages)}"

    public_text = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in ROOT.rglob("*")
        if is_public_text(path)
    )
    assert "龜鹿飲30cc玻璃瓶" not in public_text, "公開網站仍有龜鹿飲30cc玻璃瓶舊稱"
    assert "30cc／瓶（玻璃瓶）" not in public_text, "公開網站仍有30cc玻璃瓶舊規格"
    assert "龜鹿飲30cc玻璃罐" in public_text, "缺少龜鹿飲30cc玻璃罐正式名稱"
    assert "30cc／罐（小玻璃罐）" in public_text, "缺少30cc小玻璃罐正式規格"

    brand = (ROOT / "brand.html").read_text(encoding="utf-8")
    assert brand.count("brand-generation__year") >= 9, "品牌年份時間軸節點不足"

    data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    drink = next(item for item in data["products"] if item["id"] == "guilu-drink-30")
    assert drink["name"] == "龜鹿飲30cc玻璃罐"
    assert drink["size"] == "30cc／罐（小玻璃罐）"

    print(f"PASS v{VERSION}：{len(shell_pages)} 個官網頁面、圖片完整顯示、時間軸全寬、30cc玻璃罐名稱一致。")


def main() -> None:
    changed = process_public_files()
    update_deploy_version(changed)
    validate()
    print(f"更新 {len(changed)} 個檔案：")
    for name in changed:
        print(f"- {name}")


if __name__ == "__main__":
    main()
