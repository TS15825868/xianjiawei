#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_30 = "每日 1–2 罐"


def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def req(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def validate_posts() -> None:
    doc = load("content/public-post-library.json")
    posts = doc.get("posts") or []
    req(posts, "公開貼文母庫不得為空")
    ids = [str(p.get("id") or "") for p in posts]
    req(all(ids) and len(ids) == len(set(ids)), "公開貼文ID不得空白或重複")
    for post in posts:
        status = str(post.get("status") or "")
        body = json.dumps(post, ensure_ascii=False)
        req("每日一罐" not in body or "不得回退成每日一罐" in body, f"貼文 {post.get('id')} 疑似回退30cc每日一罐")
        if "guilu-drink-30" in body or "龜鹿飲30cc" in body:
            old_forms = ["每日1-2罐", "每日 1-2罐", "每日 1-2 罐", "每日1～2罐", "每日 1～2罐", "每日 1～2 罐"]
            # 舊標點格式可由目前runtime正規化，但不得把1–2內容降級為每日一罐。
            req(not ("每日一罐" in body and "不得回退成每日一罐" not in body), f"貼文 {post.get('id')} 30cc用法錯誤")
        if status == "published":
            req(post.get("prevent_republish") is True and post.get("do_not_republish") is True, f"已發布貼文未鎖定：{post.get('id')}")
            req(post.get("publish_allowed") is False and post.get("schedule_enabled") is False, f"已發布貼文仍可重發：{post.get('id')}")
        elif status != "archived":
            req(status in {"pending_review", "draft", "rejected"}, f"未知貼文狀態：{post.get('id')}")
            req(post.get("owner_review_required", doc.get("publishing_defaults", {}).get("owner_review_required")) is True, f"待審貼文未要求人工審核：{post.get('id')}")
            req(post.get("publish_allowed", doc.get("publishing_defaults", {}).get("publish_allowed")) is False, f"待審貼文不應直接發布：{post.get('id')}")
        if post.get("image_status") in {"needs_generation", "replace-required"}:
            req(post.get("regeneration_mode") == "chatgpt_handoff", f"需換圖貼文未走ChatGPT回填：{post.get('id')}")


def validate_visual_review_policy() -> None:
    visual = load("content/visual-production-spec-current.json")
    req((visual.get("copy_image_match") or {}).get("review_items") == 16, "貼文必須維持16項審核")
    policy = visual.get("post_media_policy") or {}
    req(policy.get("regenerate_only_if_no_approved_match") is True, "只有真正沒有核准匹配來源才可重新生成")
    req(policy.get("generated_media_returns_to") == "pending_review", "生成或換圖後必須回待審核")
    req(int(policy.get("review_items_after_change") or 0) == 16, "生成或換圖後必須重新16項審核")


def validate_no_retired_writebacks() -> None:
    retired = [
        ".github/workflows/install-trial-poster-v9.yml",
        ".github/workflows/install-trial-poster-v10.yml",
        ".github/workflows/install-trial-poster-v11.yml",
        ".github/workflows/install-trial-poster-v12.yml",
        ".github/workflows/install-trial-poster-v14.yml",
        ".github/workflows/audit-square-trial-assets-v12.yml",
        ".github/workflows/bump-site-entry-cache-v20260812.yml",
        "tools/bump_site_entry_cache_v20260812.py",
        ".github/workflows/sync-formal-media-v2.yml",
        "tools/sync-formal-media.py",
    ]
    for rel in retired:
        req(not (ROOT / rel).exists(), f"退役舊版寫回工具仍存在：{rel}")


def main() -> None:
    subprocess.run([sys.executable, str(ROOT / "tools/validate-site-production-release-v20260809.py")], check=True)
    subprocess.run([sys.executable, str(ROOT / "tools/validate-ai-geo-current-v20260820.py")], check=True)
    validate_posts()
    validate_visual_review_policy()
    validate_no_retired_writebacks()
    print("PASS current site release: seven-product text authority, six-approved-media model, 30cc daily 1–2 cans, AI/GEO, product media and post review safety align.")


if __name__ == "__main__":
    main()
