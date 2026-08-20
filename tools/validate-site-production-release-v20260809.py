#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_30 = "每日 1–2 罐"
MEDIA_IDS = ("guilu-gao", "guilu-drink-30", "guilu-drink-180", "guilu-tangkuai", "guilu-jiao", "luerong-fen")
KNOWLEDGE_IDS = (*MEDIA_IDS, "qixuan-guilu-drink-powder")
SPECS = {
    "guilu-gao": "100g／罐",
    "guilu-drink-30": "30cc／罐（小玻璃罐）",
    "guilu-drink-180": "180cc／包（鋁袋）",
    "guilu-tangkuai": "75g （2兩）／盒｜8塊裝",
    "guilu-jiao": "600g （1斤）／盒｜32塊裝",
    "luerong-fen": "75g／罐",
    "qixuan-guilu-drink-powder": "2g／小包；20g／包（10小包）",
}
PAGE_BY_ID = {
    "guilu-gao": "product-guilu-gao.html",
    "guilu-drink-30": "product-guilu-drink-30cc.html",
    "guilu-drink-180": "product-guilu-drink-180cc.html",
    "guilu-tangkuai": "product-guilu-tangkuai.html",
    "guilu-jiao": "product-guilu-jiao.html",
    "luerong-fen": "product-luerong-fen.html",
}
FORMAL_ID = {
    "guilu-gao": "guilu-gao",
    "guilu-drink-30": "guilu-drink-30cc",
    "guilu-drink-180": "guilu-drink-180cc",
    "guilu-tangkuai": "guilu-tangkuai",
    "guilu-jiao": "guilu-jiao",
    "luerong-fen": "luerong-fen",
}


def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def req(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def semantic_30(value: str) -> bool:
    text = str(value or "").replace(" ", "").replace("～", "-").replace("–", "-").replace("至", "-")
    return text == "每日1-2罐"


def validate_product_authority() -> None:
    master = load("public-product-master.json")
    config = load("config/official-products.json")
    public = load("assets/data/official-products.json")
    data = load("data.json")
    catalog = load("catalog-public.json")

    req(master.get("authority") == "user-confirmed-current", "public-product-master authority錯誤")
    req(master.get("productCount") == 7, "公開文字／AI產品總數必須為7")
    mb = {p.get("id"): p for p in master.get("products") or []}
    cb = {p.get("id"): p for p in config.get("products") or []}
    pb = {p.get("id"): p for p in public.get("products") or []}
    db = {p.get("id"): p for p in data.get("products") or []}
    kb = {p.get("id"): p for p in catalog.get("products") or []}

    req(set(mb) == set(KNOWLEDGE_IDS), "public-product-master必須剛好七項目前正式產品")
    req(set(cb) == set(KNOWLEDGE_IDS), "config official必須剛好七項文字知識")
    req(set(pb) == set(KNOWLEDGE_IDS), "assets official必須剛好七項文字知識")
    req(set(db) == set(MEDIA_IDS), "data.json目前顧客產品媒體卡必須為六項")
    req(set(kb) == set(MEDIA_IDS), "catalog-public目前核准媒體產品必須為六項")
    req(len(public.get("approved_media_product_ids") or []) == 6, "assets official核准媒體產品數必須為6")
    req(len(config.get("approved_media_product_ids") or []) == 6, "config official核准媒體產品數必須為6")

    for pid, spec in SPECS.items():
        req(mb[pid].get("specification") == spec, f"{pid} public master規格錯誤")
        req(pb[pid].get("specification") == spec, f"{pid} assets official規格錯誤")
        req(cb[pid].get("spec") == spec, f"{pid} config official規格錯誤")
        if pid in MEDIA_IDS:
            req((db[pid].get("size") or db[pid].get("specification") or db[pid].get("spec")) == spec, f"{pid} data規格錯誤")
            req((kb[pid].get("size") or kb[pid].get("specification") or kb[pid].get("spec")) == spec, f"{pid} catalog規格錯誤")
            req(spec in read(PAGE_BY_ID[pid]), f"{PAGE_BY_ID[pid]}缺目前規格")

    req((mb["guilu-drink-30"].get("usage") or [None])[0] == CURRENT_30, "30cc公開母資料必須精確為每日 1–2 罐")
    req(pb["guilu-drink-30"].get("usage_primary") == CURRENT_30, "30cc assets authority必須精確為每日 1–2 罐")
    req(cb["guilu-drink-30"].get("usage_primary") == CURRENT_30, "30cc config authority必須精確為每日 1–2 罐")
    req(semantic_30((db["guilu-drink-30"].get("usage") or [None])[0]), "30cc data fallback不得回退成每日一罐")
    req(semantic_30((kb["guilu-drink-30"].get("usage") or [None])[0]), "30cc catalog fallback不得回退成每日一罐")
    req((mb["guilu-drink-180"].get("usage") or [None])[0] == "每日一包", "180cc目前用法錯誤")
    req(mb["guilu-tangkuai"].get("detail") == "每塊約9.375g", "龜鹿湯塊約重錯誤")
    req(mb["guilu-jiao"].get("detail") == "每塊約18.75g", "龜鹿膠約重錯誤")
    req(pb["qixuan-guilu-drink-powder"].get("media_status") == "formal-product-image-pending", "柒玄茶媒體狀態錯誤")


def validate_runtime() -> None:
    js = read("site-product-data-authority.js")
    req(f"const CURRENT_30_USAGE='{CURRENT_30}'" in js, "前端權威層未鎖定30cc每日1–2罐")
    req("['每日 1-2罐','每日一罐']" not in js, "前端仍會把1–2罐改成每日一罐")
    for page in ["product-guilu-drink-30cc.html", "faq.html", "guide.html", "llms.txt", "llms-full.txt"]:
        req(CURRENT_30 in read(page), f"{page}缺目前30cc用法")
    req(CURRENT_30 in json.dumps(load("geo-data.json"), ensure_ascii=False), "GEO缺目前30cc用法")


def validate_media() -> None:
    formal = load("data/formal-media-authority-v20260810.json")
    manifest = load("images/formal-display/manifest.json")
    by = {p.get("id"): p for p in formal.get("products") or []}
    req(len(by) == 6, "正式產品媒體必須維持六項已核准實物圖／DM")
    req(formal.get("runtime") == manifest.get("runtime"), "formal authority與manifest runtime不同步")
    req(formal.get("approval_batch") == manifest.get("approval_batch"), "formal authority與manifest批次不同步")
    for pid in MEDIA_IDS:
        item = by.get(FORMAL_ID[pid])
        req(item and item.get("status") == "approved_display", f"{pid}正式媒體未核准")
        req(item.get("spec") == SPECS[pid], f"{pid}正式媒體規格不同步")
        image = str(item.get("image") or "").split("?", 1)[0].lstrip("/")
        dm = str(item.get("dm") or "").split("?", 1)[0].lstrip("/")
        req(image and (ROOT / image).is_file(), f"{pid}產品主圖不存在")
        req(dm and (ROOT / dm).is_file(), f"{pid}詳細DM不存在")
        req(image != dm, f"{pid}產品主圖與詳細DM角色混用")
    p30 = by["guilu-drink-30cc"]
    req(str(p30.get("dm") or "").split("?", 1)[0].lstrip("/") == "images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg", "30cc詳細DM不是目前核准JPG")
    trial = formal.get("trial") or {}
    trial_path = str(trial.get("image") or trial.get("path") or "").split("?", 1)[0].lstrip("/")
    req(trial_path == "images/trial/trial-poster-small-boss-official-v20260814.jpg", "試喝不是目前核准海報")
    req((ROOT / trial_path).is_file(), "試喝海報檔案不存在")


def validate_public_boundaries() -> None:
    public = "\n".join(read(p) for p in ["faq.html", "brand-facts.html", "llms.txt", "llms-full.txt"])
    for banned in ["台興山產", "治療疾病", "保證功效"]:
        req(banned not in public, f"公開資料出現禁止內容：{banned}")
    req("Disallow: /publishing-center.html" in read("robots.txt"), "robots缺發布中心保護")


def main() -> None:
    validate_product_authority()
    validate_runtime()
    validate_media()
    validate_public_boundaries()
    print("PASS current site production release: seven-product text/AI authority, six approved media products, 30cc daily 1–2 cans, current GEO/FAQ/runtime, media separation and public boundaries align.")


if __name__ == "__main__":
    main()
