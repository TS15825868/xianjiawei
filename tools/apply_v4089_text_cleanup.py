#!/usr/bin/env python3
"""Remove remaining public-page wording that conflicts with the approved v408.9 usage policy."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".html", ".json", ".js", ".txt", ".xml", ".webmanifest"}

REPLACEMENTS = {
    "早上或下午": "早上或空腹前後",
    "約100～300mL": "適量",
    "適合希望在早上或空腹前後建立固定食補安排的人": "適合希望在早上或空腹前後建立固定食補安排，並避免睡前食用的人",
}


def main() -> None:
    changed = []
    for path in ROOT.iterdir():
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        updated = text
        for old, new in REPLACEMENTS.items():
            updated = updated.replace(old, new)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed.append(path.name)

    remaining = []
    for path in ROOT.iterdir():
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            text = path.read_text(encoding="utf-8", errors="ignore")
            if "早上或下午" in text or "約100～300mL" in text:
                remaining.append(path.name)
    if remaining:
        raise SystemExit(f"仍有舊產品頁文字：{', '.join(sorted(remaining))}")

    print("v408.9 公開頁面舊時段與舊熱水量清理完成：" + (", ".join(changed) if changed else "無需變更"))


if __name__ == "__main__":
    main()
