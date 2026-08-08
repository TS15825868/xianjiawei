#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
POSTS_PATH = ROOT / "content/public-post-library.json"
ASSETS_PATH = ROOT / "content/public-asset-library.json"

ALLOWED_IMAGE_STATES = {
    "approved-published-locked": "published_locked",
    "official-reference-pending-layout-review": "official_original_pending_layout_review",
    "candidate-review-required": "candidate_pending_16_point_review",
    "replace-required": "replace_required_chatgpt",
    "published-final-locked": "published_locked",
}
PRODUCT_POSTS = {
    "POST-GAO-100": "images/products-v3/guilu-gao.jpg",
    "POST-DRINK-30": "images/products-v3/guilu-drink-30.jpg",
    "POST-DRINK-180": "images/products-v3/guilu-drink-180.jpg",
    "POST-SOUP-75": "images/products-v3/guilu-tangkuai.jpg",
    "POST-JIAO-600": "images/products-v3/guilu-jiao.jpg",
    "POST-LUERONG": "images/products-v3/luerong-fen.jpg",
}


def public_path(value):
    text = str(value or "").split("?", 1)[0]
    prefix = "https://ts15825868.github.io/xianjiawei/"
    if text.startswith(prefix):
        text = text[len(prefix):]
    return text.lstrip("/")


def main():
    doc = json.loads(POSTS_PATH.read_text(encoding="utf-8"))
    assets = json.loads(ASSETS_PATH.read_text(encoding="utf-8"))
    asset_ids = {str(item.get("id") or "") for item in assets.get("assets", [])}
    posts = doc.get("posts", [])
    assert posts, "公開貼文母本不可為空"

    counts = {name: 0 for name in set(ALLOWED_IMAGE_STATES.values())}
    unknown = []
    for post in posts:
        post_id = post.get("id") or ""
        image_state = post.get("image_status") or ""
        category = ALLOWED_IMAGE_STATES.get(image_state)
        if not category:
            unknown.append((post_id, image_state))
            continue
        counts[category] += 1

        asset_id = str(post.get("image_asset_id") or "")
        assert asset_id in asset_ids, f"{post_id} 圖片素材ID不存在：{asset_id}"
        image = public_path(post.get("image_url"))
        assert image and (ROOT / image).is_file(), f"{post_id} 圖片檔不存在：{image}"

        if category == "published_locked":
            assert post.get("prevent_republish") is True, f"{post_id} 已發布圖缺少防重發"
            assert post.get("do_not_republish") is True, f"{post_id} 已發布圖缺少永久防重發"
        elif category == "replace_required_chatgpt":
            assert post.get("regeneration_mode") == "chatgpt_handoff", f"{post_id} 需換圖但未交給ChatGPT"
            assert post.get("status") != "published", f"{post_id} 需換圖卻標為已發布"
        else:
            assert post.get("status") != "published", f"{post_id} 待審圖片不可標為已發布"

        if post_id in PRODUCT_POSTS:
            expected = PRODUCT_POSTS[post_id]
            assert image == expected, f"{post_id} 必須綁正式產品原圖：{expected}"
            assert image_state == "official-reference-pending-layout-review", f"{post_id} 正式原圖仍必須標成待版面審核"

    assert not unknown, f"存在未分類圖片狀態：{unknown}"
    assert sum(counts.values()) == len(posts)
    assert counts["published_locked"] >= 2, "已發布鎖定貼文數異常"
    assert counts["replace_required_chatgpt"] >= 1, "目前沒有任何需重生成圖，請確認是否誤把候選圖當完成圖"

    result = {
        "total": len(posts),
        "published_locked": counts["published_locked"],
        "official_original_pending_layout_review": counts["official_original_pending_layout_review"],
        "candidate_pending_16_point_review": counts["candidate_pending_16_point_review"],
        "replace_required_chatgpt": counts["replace_required_chatgpt"],
    }
    print("PASS public post image states:", json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
