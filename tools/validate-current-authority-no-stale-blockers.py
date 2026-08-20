#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_30 = "每日 1–2 罐"
QIXUAN = "柒玄茶・龜鹿調飲粉"


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def req(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def check_product_authority() -> None:
    master = load("public-product-master.json")
    by = {p.get("id"): p for p in master.get("products") or []}
    req(master.get("authority") == "user-confirmed-current", "public-product-master不是目前使用者確認權威")
    req(master.get("productCount") == 7 and len(by) == 7, "目前正式文字產品知識必須為七項")
    req((by["guilu-drink-30"].get("usage") or [None])[0] == CURRENT_30, "30cc目前正式使用方式不是每日 1–2 罐")
    req((by["guilu-drink-180"].get("usage") or [None])[0] == "每日一包", "180cc目前正式使用方式不是每日一包")
    req(by["guilu-tangkuai"].get("specification") == "75g （2兩）／盒｜8塊裝", "龜鹿湯塊規格錯誤")
    req(by["guilu-tangkuai"].get("detail") == "每塊約9.375g", "龜鹿湯塊約重錯誤")
    req(by["guilu-jiao"].get("specification") == "600g （1斤）／盒｜32塊裝", "龜鹿膠規格錯誤")
    req(by["guilu-jiao"].get("detail") == "每塊約18.75g", "龜鹿膠約重錯誤")
    req(by["qixuan-guilu-drink-powder"].get("specification") == "2g／小包；20g／包（10小包）", "柒玄茶規格錯誤")


def check_public_policies() -> None:
    for rel in ["config/public-content-policy.json", "content/public-content-policy.json"]:
        data = load(rel)
        text = read(rel)
        pa = data.get("officialProductAuthority") or data.get("productAuthority") or {}
        req((pa.get("knowledgeProductCount") or 0) == 7, f"{rel}仍不是七項文字權威")
        req((pa.get("approvedMediaProductCount") or 0) == 6, f"{rel}未正確標示六項核准媒體")
        req("public-product-master.json" in text, f"{rel}沒有綁定目前公開產品母資料")
        req(CURRENT_30 in text, f"{rel}缺少30cc目前使用方式")
        req(QIXUAN in text, f"{rel}缺少第七項柒玄茶")
        req("xianjiawei-internal-private" not in text, f"{rel}仍引用舊非正式ERP repository")
        req("六項唯一正式產品規格" not in text, f"{rel}仍把六項媒體誤寫成全部產品")


def check_post_authority() -> None:
    posts = load("content/public-post-library.json")
    auth = posts.get("productAuthority") or {}
    req(auth.get("textAuthority") == "public-product-master.json", "貼文母庫沒有使用目前文字產品權威")
    req(auth.get("knowledgeProducts") == 7, "貼文母庫仍是舊六產品文字模型")
    req(auth.get("approvedMediaProducts") == 6, "貼文母庫核准媒體數錯誤")
    req(auth.get("drink30Usage") == CURRENT_30, "貼文母庫30cc用法未同步")
    req("sixProductsSixSpecs" not in auth, "貼文母庫仍含舊六產品權威開關")
    by = {p.get("id"): p for p in posts.get("posts") or []}
    overview = by["POST-PRODUCT-OVERVIEW"]
    req(overview.get("status") == "pending_review", "產品總覽候選狀態異常")
    req(QIXUAN in str(overview.get("copy") or ""), "產品總覽未包含第七項柒玄茶")
    req("六個正式產品" not in str(overview.get("copy") or ""), "產品總覽仍使用舊六產品文案")
    req(CURRENT_30 in str(by["POST-DRINK-30"].get("copy") or ""), "30cc待審貼文缺目前使用方式")
    req("每日一包" in str(by["POST-DRINK-180"].get("copy") or ""), "180cc待審貼文缺目前使用方式")
    for post in posts.get("posts") or []:
        if post.get("status") == "published":
            req(post.get("prevent_republish") is True and post.get("do_not_republish") is True, f"已發布貼文未鎖定防重發：{post.get('id')}")
        else:
            req(post.get("owner_review_required") is True, f"未發布貼文未要求人工審核：{post.get('id')}")
            req(post.get("publish_allowed") is False, f"未發布貼文被誤開放發布：{post.get('id')}")


def check_post_manifests() -> None:
    current = load("content/post-bank-current-authority-v20260809.json")
    manifest = load("content/post-bank-v6-manifest.json")
    req(current.get("productAuthority", {}).get("knowledgeProductCount") == 7, "current post bank仍是舊產品數")
    req(current.get("productAuthority", {}).get("approvedMediaProductCount") == 6, "current post bank媒體數錯誤")
    req(current.get("productAuthority", {}).get("drink30Usage") == CURRENT_30, "current post bank 30cc用法錯誤")
    req("latestUserPostSource" not in current.get("imageState", {}), "current post bank仍把舊ZIP固定成最新來源")
    ga = manifest.get("generatorAuthority") or {}
    req(ga.get("knowledgeProductCount") == 7 and ga.get("approvedMediaProductCount") == 6, "post manifest仍是舊六產品生成模型")
    req("latestUserZipSource" not in manifest, "post manifest仍把舊ZIP固定成最新來源")


def check_release_marker_and_runtime() -> None:
    deploy = load("deploy-version.json")
    text = read("deploy-version.json")
    pa = deploy.get("productAuthority") or {}
    req(pa.get("knowledgeProductCount") == 7 and pa.get("approvedMediaProductCount") == 6, "deploy-version仍是舊六產品release marker")
    req(CURRENT_30 in text and QIXUAN in text, "deploy-version未綁目前產品資料")
    req("images/dm-approved-v20260810/guilu-drink-180cc.webp" not in text, "deploy-version仍引用180cc退役DM")
    guard = read("publishing-center-data-current-authority-guard.js")
    req(CURRENT_30 in guard and QIXUAN in guard, "貼文runtime guard未包含目前30cc／柒玄茶規則")
    req("current-authority-media-sanitizer-20260820" in guard, "貼文runtime guard不是目前版本")


def check_compatibility_outputs() -> None:
    for rel in ["data.json", "catalog-public.json", "product-master.json", "content/ai-brand-control-v20260807.json", "content/visual-production-spec-current.json"]:
        text = read(rel)
        req(CURRENT_30 in text, f"{rel}缺目前30cc用法")
        req(QIXUAN in text, f"{rel}缺第七項文字知識／邊界")
        req("每日 1-2罐" not in text and "每日 1-2 罐" not in text and "每日 1～2 罐" not in text, f"{rel}仍輸出舊30cc格式")
    req(load("data.json").get("knowledgeProductCount") == 7, "data.json未標七項文字知識")
    req(load("catalog-public.json").get("knowledgeProductCount") == 7, "catalog-public未標七項文字知識")
    req(load("product-master.json").get("productCount") == 7, "product-master相容鏡像仍是舊六產品")


def main() -> None:
    check_product_authority()
    check_public_policies()
    check_post_authority()
    check_post_manifests()
    check_release_marker_and_runtime()
    check_compatibility_outputs()
    print("PASS stale-blocker audit: current seven-product text authority, six approved media products, exact 30cc daily 1–2 cans, current pending copy, policies, post-bank controls and release markers contain no active stale blockers.")


if __name__ == "__main__":
    main()
