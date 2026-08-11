#!/usr/bin/env python3
"""Compatibility entry point for the current 仙加味 formal release audit.

This filename is kept so old bookmarks/manual commands do not break, but the
validation itself intentionally does not pin historical UI/data-layer versions,
old trial hashes, or fixed regeneration batch counts.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(tool: str) -> None:
    subprocess.run([sys.executable, str(ROOT / "tools" / tool)], check=True)


def main() -> None:
    run("validate-site-production-release-v20260809.py")
    run("validate-visual-cohesion-v20260809.py")
    run("validate-publishing-content-match-v20260809.py")
    print(
        "PASS formal compatibility audit: current customer-facing product authority, "
        "visual/no-collage policy and copy-image matching validated. Historical v8-v17 "
        "layer names, old trial hashes and fixed regeneration counts are not release gates."
    )


if __name__ == "__main__":
    main()
