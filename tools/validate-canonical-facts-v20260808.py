#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_30 = "每日 1–2 罐"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def load(path: str):
    return json.loads(read(path))


def req(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def run_current_validator(path: str) -> None:
    subprocess.run([sys.executable, str(ROOT / path)], check=True)


def check_publishing_architecture() -> None:
    html = read("publishing-center.html")
    bridge = read("publishing-center-erp-bridge.js")
    req("publishing-center-erp-bridge.js" in html, "公開發布中心未載入ERP交接層")
    req("真正的社群立即發布由受保護的 ERP 執行" in html, "公開發布中心責任邊界不清楚")
    req("前往ERP立即發布" in bridge, "ERP立即發布交接按鈕缺失")
    req("published-manual" in bridge and "erp-handoff-required" in bridge, "舊前端假發布紀錄處理缺失")
    req("xianjiawei-internal.tung314069.workers.dev/#posts" in bridge, "ERP貼文中心交接網址缺失")
    req("CHANNEL_ACCESS_TOKEN" not in html and "CHANNEL_ACCESS_TOKEN" not in bridge, "公開頁不得含LINE token")
    req("FACEBOOK_PAGE_ACCESS_TOKEN" not in html and "INSTAGRAM_ACCESS_TOKEN" not in html, "公開頁不得含社群token")


def check_post_library() -> None:
    doc = load("content/public-post-library.json")
    posts = doc.get("posts") or []
    req(posts, "公開貼文母庫不得為空")
    ids = [str(p.get("id") or "").strip() for p in posts]
    req(all(ids) and len(ids) == len(set(ids)), "公開貼文ID不可空白或重複")
    for post in posts:
        body = json.dumps(post, ensure_ascii=False)
        req("龜鹿飲30cc玻璃瓶" not in body and "30cc／瓶" not in body, f"貼文 {post.get('id')} 仍含30cc舊瓶型稱呼")
        if "龜鹿飲30cc" in body or "guilu-drink-30" in body:
            req("每日一罐" not in body or "不得回退成每日一罐" in body, f"貼文 {post.get('id')} 30cc回退成每日一罐")
        if post.get("status") == "published":
            req(post.get("prevent_republish") is True and post.get("do_not_republish") is True, f"已發布貼文未鎖定：{post.get('id')}")


def main() -> None:
    # 舊檔名保留相容性，但驗證內容一律委派給目前正式七產品權威；
    # 不再維護任何六產品、舊用法、舊規格的第二套真相。
    run_current_validator("tools/validate-site-production-release-v20260809.py")
    run_current_validator("tools/validate-ai-geo-current-v20260820.py")
    run_current_validator("tools/validate-public-boundary-v20260808.py")
    check_publishing_architecture()
    check_post_library()

    master = load("public-product-master.json")
    products = {p.get("id"): p for p in master.get("products") or []}
    req(master.get("productCount") == 7 and len(products) == 7, "目前公開母資料必須為七項產品")
    req((products["guilu-drink-30"].get("usage") or [None])[0] == CURRENT_30, "30cc目前用法必須精確為每日 1–2 罐")
    req(products["qixuan-guilu-drink-powder"].get("specification") == "2g／小包；20g／包（10小包）", "柒玄茶規格未同步")

    print("PASS canonical audit: current seven-product text authority, six approved media products, current 30cc daily 1–2 cans, public boundaries and publishing architecture align.")


if __name__ == "__main__":
    main()
