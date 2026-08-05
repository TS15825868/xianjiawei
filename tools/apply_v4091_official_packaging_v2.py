#!/usr/bin/env python3
"""相容入口：統一改由六項正式產品權威工具處理。

此檔過去會把正確的「30cc／罐（小玻璃罐）」覆寫成錯誤的
「30cc／瓶（小玻璃瓶）」。為避免舊 Workflow 或人工執行造成回退，
現在只轉交目前正式的 apply-official-product-specs.mjs。
"""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "tools" / "apply-official-product-specs.mjs"


def main() -> None:
    if not TARGET.exists():
        raise SystemExit(f"找不到正式產品同步工具：{TARGET.relative_to(ROOT)}")
    result = subprocess.run(["node", str(TARGET)], cwd=ROOT, check=False)
    if result.returncode:
        raise SystemExit(result.returncode)
    print("舊版包裝入口已安全轉交六項正式產品同步工具；30cc固定為小玻璃罐／罐。")


if __name__ == "__main__":
    main()
