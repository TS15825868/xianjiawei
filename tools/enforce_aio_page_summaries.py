#!/usr/bin/env python3
"""Ensure every public HTML page exposes a concise AI-readable summary.

The existing meta description remains the single source of truth. This tool does
not invent new claims; it mirrors that description into an ai-summary meta tag
and refreshes JSON-LD dateModified fields.
"""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = date.today().isoformat()
DESCRIPTION_RE = re.compile(
    r'<meta\s+(?:content="(?P<content1>[^"]*)"\s+name="description"|name="description"\s+content="(?P<content2>[^"]*)")\s*/?>',
    re.I,
)
AI_SUMMARY_RE = re.compile(r'\n?<meta\s+name="ai-summary"\s+content="[^"]*"\s*/?>', re.I)
DATE_MODIFIED_RE = re.compile(r'("dateModified"\s*:\s*")[^"]*(")')


def public_pages() -> list[Path]:
    return [
        path
        for path in sorted(ROOT.glob("*.html"))
        if not path.name.startswith("google")
    ]


def update_page(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    match = DESCRIPTION_RE.search(text)
    if not match:
        raise RuntimeError(f"{path.name} 缺少 meta description，無法建立 AIO 摘要")
    description = (match.group("content1") or match.group("content2") or "").strip()
    if not description:
        raise RuntimeError(f"{path.name} 的 meta description 為空")

    updated = AI_SUMMARY_RE.sub("", text)
    summary_tag = f'\n<meta name="ai-summary" content="{description}"/>'
    desc_match = DESCRIPTION_RE.search(updated)
    assert desc_match is not None
    updated = updated[: desc_match.end()] + summary_tag + updated[desc_match.end() :]
    updated = DATE_MODIFIED_RE.sub(rf'\g<1>{TODAY}\g<2>', updated)

    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def validate_page(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors: list[str] = []
    desc = DESCRIPTION_RE.search(text)
    if not desc:
        return [f"{path.name} 缺少 meta description"]
    description = (desc.group("content1") or desc.group("content2") or "").strip()
    expected = f'<meta name="ai-summary" content="{description}"/>'
    if expected not in text:
        errors.append(f"{path.name} 的 ai-summary 未與 description 一致")
    for modified in DATE_MODIFIED_RE.finditer(text):
        if modified.group(0) != f'"dateModified":"{TODAY}"' and modified.group(0) != f'"dateModified": "{TODAY}"':
            errors.append(f"{path.name} 的 dateModified 未更新為 {TODAY}")
            break
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    changed: list[str] = []
    if args.write:
        for page in public_pages():
            if update_page(page):
                changed.append(page.name)

    errors: list[str] = []
    for page in public_pages():
        errors.extend(validate_page(page))
    if errors:
        raise SystemExit("\n".join(errors))

    if changed:
        print("已更新 AIO 摘要：" + ", ".join(changed))
    print(f"PASS 全站 AIO 摘要與結構化資料新鮮度（{TODAY}）")


if __name__ == "__main__":
    main()
