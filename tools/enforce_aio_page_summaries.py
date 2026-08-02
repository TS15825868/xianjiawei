#!/usr/bin/env python3
"""Ensure public content pages expose concise AI-readable summaries.

The existing meta description remains the single source of truth. Utility and
verification HTML files that are not public content pages are skipped. No new
claims are invented.
"""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = date.today().isoformat()
DESCRIPTION_RE = re.compile(
    r'<meta\s+(?:content="(?P<content1>[^"]*)"\s+name="description"|name="description"\s+content="(?P<content2>[^"]*)")[^>]*?/?>',
    re.I,
)
AI_SUMMARY_RE = re.compile(r'\n?<meta\s+name="ai-summary"\s+content="[^"]*"\s*/?>', re.I)
DATE_MODIFIED_RE = re.compile(r'("dateModified"\s*:\s*")[^"]*(")')
UTILITY_NAMES = {
    '404.html',
    'offline.html',
}


def public_pages() -> list[Path]:
    pages: list[Path] = []
    for path in sorted(ROOT.glob('*.html')):
        name = path.name.lower()
        if name.startswith('google') or name in UTILITY_NAMES:
            continue
        text = path.read_text(encoding='utf-8')
        if DESCRIPTION_RE.search(text):
            pages.append(path)
    return pages


def update_page(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    match = DESCRIPTION_RE.search(text)
    if not match:
        return False
    description = (match.group('content1') or match.group('content2') or '').strip()
    if not description:
        raise RuntimeError(f'{path.name} 的 meta description 為空')

    updated = AI_SUMMARY_RE.sub('', text)
    summary_tag = f'\n<meta name="ai-summary" content="{description}"/>'
    desc_match = DESCRIPTION_RE.search(updated)
    assert desc_match is not None
    updated = updated[: desc_match.end()] + summary_tag + updated[desc_match.end() :]
    updated = DATE_MODIFIED_RE.sub(rf'\g<1>{TODAY}\g<2>', updated)

    if updated == text:
        return False
    path.write_text(updated, encoding='utf-8')
    return True


def validate_page(path: Path) -> list[str]:
    text = path.read_text(encoding='utf-8')
    errors: list[str] = []
    desc = DESCRIPTION_RE.search(text)
    if not desc:
        return []
    description = (desc.group('content1') or desc.group('content2') or '').strip()
    expected = f'<meta name="ai-summary" content="{description}"/>'
    if expected not in text:
        errors.append(f'{path.name} 的 ai-summary 未與 description 一致')
    for modified in DATE_MODIFIED_RE.finditer(text):
        value = modified.group(0).replace(' ', '')
        if value != f'"dateModified":"{TODAY}"':
            errors.append(f'{path.name} 的 dateModified 未更新為 {TODAY}')
            break
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()

    pages = public_pages()
    if not pages:
        raise SystemExit('找不到具有 meta description 的公開內容頁')

    changed: list[str] = []
    if args.write:
        for page in pages:
            if update_page(page):
                changed.append(page.name)

    errors: list[str] = []
    for page in pages:
        errors.extend(validate_page(page))
    if errors:
        raise SystemExit('\n'.join(errors))

    if changed:
        print('已更新 AIO 摘要：' + ', '.join(changed))
    print(f'PASS {len(pages)} 個公開內容頁 AIO 摘要與結構化資料新鮮度（{TODAY}）')


if __name__ == '__main__':
    main()
