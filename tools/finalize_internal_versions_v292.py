from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

replacements = {
    ROOT / "site-v287-core.js": [
        ("data.json?v=287.0", "data.json?v=292.0"),
    ],
    ROOT / "data.json": [
        ('"version": "287.0"', '"version": "292.0"'),
    ],
}

for path, pairs in replacements.items():
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in pairs:
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        print(f"updated: {path.name}")

subprocess.run([sys.executable, str(ROOT / "tools" / "unify_site_v292.py")], check=True)
