#!/usr/bin/env python3
"""Validate public multi-brand product cards without pinning an old product count."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINE = "https://lin.ee/sHZW7NkR"
FORBIDDEN_IMAGE_NAMES = re.compile(
    r"(?:chat|conversation|screenshot|screen.?record|對話|聊天|報價|客戶資料)",
    re.IGNORECASE,
)
PRIVATE_FIELDS = {
    "price", "cost", "cost_price", "retail_price", "wholesale_price",
    "promotional_price", "supplier_cost", "inventory_cost",
}

def fail(message: str) -> None:
    raise SystemExit("FAIL public product catalog: " + message)

def load(name: str) -> dict:
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def safe_file(value: str) -> Path:
    if not isinstance(value, str) or not value:
        fail("missing image/page path")
    plain = value.split("?", 1)[0]
    p = Path(plain)
    if p.is_absolute() or ".." in p.parts or "://" in plain or "\\" in plain:
        fail("unsafe relative path: " + value)
    return ROOT / p

def check_image(value: str, name: str) -> None:
    if FORBIDDEN_IMAGE_NAMES.search(value):
        fail("conversation or private screenshot as product image: " + value)
    path = safe_file(value)
    if not path.is_file() or path.stat().st_size < 4000:
        fail("missing or invalid product image for " + name + ": " + value)
    signature = path.read_bytes()[:12]
    valid = (signature.startswith(b"\xff\xd8\xff")
             or signature.startswith(b"\x89PNG\r\n\x1a\n")
             or signature.startswith(b"RIFF") and signature[8:12] == b"WEBP"
             or signature.lstrip().startswith(b"<svg"))
    if not valid:
        fail("unsupported image signature: " + value)

def main() -> None:
    own = load("data.json").get("products", [])
    all_partner = load("partner-catalog.json").get("products", [])
    public_partner = [p for p in all_partner if p.get("public") is True]
    # Current user instruction: scientific Chinese medicine powder / concentrated
    # herbal granules must stay internal-only. Never infer from a generic 粉
    # character: 鹿茸粉 and food drink powder are separate product categories.
    held_categories = {"科學中藥粉", "濃縮中藥粉", "科學中藥顆粒", "濃縮中藥顆粒"}
    for item in all_partner:
        cls = {str(item.get(k) or "").strip() for k in
               ("category", "subcategory", "dosageForm", "medicineForm", "productType")}
        if item.get("isScientificChineseMedicinePowder") is True or cls.intersection(held_categories):
            if item.get("public") is True or item.get("onlineTransactionEligible") is True:
                fail("scientific Chinese medicine powder is on publication hold: " + str(item.get("id")))

    seen_partner_names = set()
    seen_partner_ids = set()
    for product in all_partner:
        pid, name, brand = product.get("id"), product.get("name"), product.get("brand")
        if not (pid and name and brand):
            fail("incomplete partner SKU or manufacturer attribution")
        key = (brand.strip().casefold(), name.strip().casefold())
        if pid in seen_partner_ids or key in seen_partner_names:
            fail("duplicate third-party product record: " + str(name))
        seen_partner_ids.add(pid)
        seen_partner_names.add(key)
        if PRIVATE_FIELDS.intersection(product.keys()):
            fail("partner catalog contains internal pricing fields: " + str(pid))
        if FORBIDDEN_IMAGE_NAMES.search(" ".join(product.get("sourceFiles", []))):
            fail("private conversation screenshot used in source files: " + str(pid))
        if product.get("image"):
            check_image(product["image"], name)
        for image in product.get("detailImages", []):
            check_image(image, name)
        if product.get("public") is not True and product.get("onlineTransactionEligible") is True:
            fail("unreviewed partner product enables online transaction: " + str(pid))
    for group in (p for p in all_partner if p.get("public") and p.get("variants")):
        members = group.get("variants", [])
        if len(members) < 2:
            fail("grouped product has fewer than two variants")
        for member in members:
            original = next((p for p in all_partner if p.get("id") == member.get("id")), None)
            if not original or original.get("public") or original.get("groupedIn") != group["id"]:
                fail("variant is not correctly grouped: " + str(member.get("id")))
            if not member.get("name") or not member.get("ingredients") or not member.get("image"):
                fail("grouped variant missing product facts: " + str(member.get("id")))
            check_image(member["image"], member["name"])
        group_page = (ROOT / group["page"]).read_text(encoding="utf-8") if (ROOT / group["page"]).is_file() else ""
        for member in members:
            if member["name"] not in group_page or member["id"] not in group_page:
                fail("variant not visible on the consolidated detail page: " + member["id"])
    if not own:
        fail("no approved own-brand products")
    if not public_partner:
        fail("no public partner products (partner area would be empty)")

    ids = set()
    for brand_group, products in (("own", own), ("partner", public_partner)):
        for product in products:
            name = product.get("displayName") or product.get("name")
            pid = product.get("id")
            if not (name and pid and product.get("size") and product.get("page") and product.get("image")):
                fail("missing essential card field in " + brand_group + ": " + str(pid))
            if pid in ids:
                fail("duplicate product ID: " + pid)
            ids.add(pid)
            if brand_group == "partner":
                if not product.get("brand") or product.get("brandType") != "partner":
                    fail("missing original brand attribution for " + pid)
                public_keys = PRIVATE_FIELDS.intersection(product.keys())
                if public_keys:
                    fail("private pricing fields in public catalog: " + pid)
                # Official public product picture must come from the real manufacturer
                # photo library. Auto-generated/review-stage composites must never
                # silently become the production source before human sign-off.
                official_picture = product["image"].split("?", 1)[0]
                if not official_picture.startswith("images/partner-products/") or (
                    "/staging/" in official_picture or
                    "/partner-product-design-review/" in official_picture
                ):
                    fail("public product uses unapproved preview/staging image: " + pid)
                for extra in product.get("detailImages", []):
                    check_image(extra, name)
                if FORBIDDEN_IMAGE_NAMES.search(" ".join(product.get("sourceFiles", []))):
                    fail("conversation screenshot included in source list: " + pid)
            check_image(product["image"], name)
            page = safe_file(product["page"])
            if not page.is_file() or page.suffix != ".html":
                fail("missing product detail page for " + pid)
            detail = page.read_text(encoding="utf-8")
            if name not in detail or LINE not in detail:
                fail("incomplete product detail or LINE CTA for " + pid)
            if brand_group == "partner" and product.get("category") not in detail:
                fail("product category missing on partner detail: " + pid)

    # Customer-facing content must not leak internal supplier logistics prose.
    # Keep mandatory producer information in the facts section instead.
    banned_public_copy = (
        "本商品由仙加味提供食品供貨",
        "本頁不直接顯示價格",
        "本產品由仙加味提供食品供貨",
    )
    for product in public_partner:
        detail_path = ROOT / product["page"]
        if detail_path.is_file():
            detail_text = detail_path.read_text(encoding="utf-8")
            for phrase in banned_public_copy:
                if phrase in detail_text:
                    fail("internal-style supplier copy in public page: " + str(product["id"]))

    listing = (ROOT / "products.html").read_text(encoding="utf-8")
    for group in (p for p in all_partner if p.get("public") and p.get("variants")):
        if f'data-fallback-product="{group["id"]}"' not in listing:
            fail("group entry missing from product catalog: " + group["id"])
        for member in group["variants"]:
            if f'data-fallback-product="{member["id"]}"' in listing:
                fail("grouped variant still has a separate public card: " + member["id"])

    if not all(x in listing for x in ("catalog-filters", 'id="all-product-catalog"', 'id="catalog-product-grid"', 'id="product-list"', 'id="partner-product-list"')):
        fail("unified catalog grid or fallback segments missing")
    if 'id="own-brand-catalog"' in listing or 'id="partner-brand-catalog"' in listing:
        fail("obsolete brand-split public catalog returned")
    for pid in ids:
        if f'data-fallback-product="{pid}"' not in listing:
            fail("non-JavaScript catalog fallback missing " + pid)
    for product in public_partner:
        if product["page"] not in listing:
            fail("partner product missing from search/listing metadata: " + product["id"])

    # The homepage must show exactly the CURRENT approved public products.
    # Do not hard-code an old count: new verified public products should
    # automatically become required, and retired/internal-only items stay out.
    homepage = (ROOT / "index.html").read_text(encoding="utf-8")
    homepage_links = re.findall(
        r'<a\\b[^>]*\\bhref="(product-[a-z0-9-]+\\.html)"[^>]*>\\s*'
        r'<img\\b[^>]*\\bsrc="([^"]+)"',
        homepage,
    )
    expected_home = {str(p["page"]): str(p["image"]).split("?", 1)[0]
                     for p in own + public_partner}
    observed_home = {}
    for page, image in homepage_links:
        if page in observed_home:
            fail("duplicate homepage product: " + page)
        observed_home[page] = image.split("?", 1)[0]
    if set(observed_home) != set(expected_home):
        missing = sorted(set(expected_home) - set(observed_home))
        unexpected = sorted(set(observed_home) - set(expected_home))
        fail("homepage public products differ from latest approved catalog: "
             + "missing=" + repr(missing) + " retired/unapproved=" + repr(unexpected))
    for page, image in expected_home.items():
        if observed_home[page] != image:
            fail("homepage uses stale/raw product photo instead of current "
                 "approved source for " + page + ": " + observed_home[page])
    # The static fallback must neither lose current product cards nor revive
    # old/retired catalog entries.
    static_ids = re.findall(r'data-fallback-product="([^"]+)"', listing)
    if len(static_ids) != len(ids) or set(static_ids) != ids:
        fail("static catalog has missing, duplicate or retired product cards: "
             + repr(static_ids))

    core = (ROOT / "site-core-v410.js").read_text(encoding="utf-8")
    if "partner-catalog.json" not in core or "fillProducts('partner-product-list'" not in core:
        fail("dynamic partner catalog integration missing")

    # 最新正式 UX：所有商品（包含系列）都先顯示同一跳窗，
    # 只有跳窗內「查看詳細」能前往完整頁。不可再使用舊版「系列直達」守門規則。
    modal_router = (ROOT / "site-media-modal-final-v20260814.js").read_text(encoding="utf-8")
    if not all(token in modal_router for token in (
        "normalizeIntroActions()", "markIntro(anchor",
        "anchor.closest('.breadcrumb,#product-modal')",
        "target.closest('#product-modal')",
        "openIntro(target,event)",
    )):
        fail("product links no longer consistently enter shared modal")
    if "isGroupedProductLink(anchor)" in modal_router:
        fail("obsolete grouped-series direct-page bypass returned")

    if not all(token in core for token in (
        'data-product-intro="1" aria-haspopup="dialog"',
        'data-product-page-direct="1"',
        '查看詳細',
    )):
        fail("product modal needs intro links and a sole explicit detail-page CTA")
    if 'const isSeries = Array.isArray(product.variants)' in core:
        fail("obsolete grouped-series direct-detail routing returned")
    if 'data-product-page-direct="1"' in listing:
        fail("catalog cards must not bypass intro modal")
    if 'href="product-danshen-tea.html"' not in listing:
        fail("grouped tea series catalog link missing")
    for product in public_partner:
        if f'data-fallback-product="{product["id"]}"' not in listing:
            fail("approved partner fallback card missing: " + product["id"])
        if product.get("publicationBlockers") and product.get("public") is True:
            fail("publication blockers remain for visible partner listing: " + product["id"])

    # 「須洽詢中醫師」字樣無法替代合法廣告及交易資格審查。
    # 核准的新食品可依新版正確資訊上架，不以舊版數量或舊產品名鎖死。
    for product in all_partner:
        if product.get("public") is True and product.get("category") in ("中藥製劑", "中藥成藥", "藥品"):
            if not all(product.get(k) for k in ("medicineLicenseVerified", "medicineAdvertisingApproved", "lawfulSalesChannelVerified")):
                fail("medicine cannot become public solely by adding a physician-referral note: " + product["id"])
    print("PASS multi-brand catalog: "
          + str(len(own)) + " own-brand + "
          + str(len(public_partner)) + " partner products; "
          + str(len(ids)) + " static fallback cards, original images, pages and no private pricing.")

if __name__ == "__main__":
    main()
