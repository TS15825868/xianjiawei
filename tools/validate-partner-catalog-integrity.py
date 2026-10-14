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

    listing = (ROOT / "products.html").read_text(encoding="utf-8")
    for group in (p for p in all_partner if p.get("public") and p.get("variants")):
        if f'data-fallback-product="{group["id"]}"' not in listing:
            fail("group entry missing from product catalog: " + group["id"])
        for member in group["variants"]:
            if f'data-fallback-product="{member["id"]}"' in listing:
                fail("grouped variant still has a separate public card: " + member["id"])

    if "catalog-filters" not in listing or "partner-product-list" not in listing:
        fail("catalog filter or partner section missing")
    for pid in ids:
        if f'data-fallback-product="{pid}"' not in listing:
            fail("non-JavaScript catalog fallback missing " + pid)
    for product in public_partner:
        if product["page"] not in listing:
            fail("partner product missing from search/listing metadata: " + product["id"])

    core = (ROOT / "site-core-v410.js").read_text(encoding="utf-8")
    if "partner-catalog.json" not in core or "fillProducts('partner-product-list'" not in core:
        fail("dynamic partner catalog integration missing")

    # Regression: series cards and modal links must navigate to their full page,
    # not be renamed/reopened as another copy of the same product modal.
    modal_router = (ROOT / "site-media-modal-final-v20260814.js").read_text(encoding="utf-8")
    if not all(token in modal_router for token in (
        "isGroupedProductLink(anchor)",
        "anchor.closest('.breadcrumb,#product-modal')",
        "target.closest('#product-modal')",
        "anchor.removeAttribute('data-product-intro')",
    )):
        fail("grouped tea page or modal navigation can be intercepted by modal router")
    if not all(token in core for token in (
        "const isSeries = Array.isArray(product.variants)",
        'data-product-page-direct="1"',
        "查看全部款式與照片",
    )):
        fail("grouped series cards must offer a direct detail page route")
    if 'href="product-danshen-tea.html"' not in listing:
        fail("grouped series static fallback has no direct detail-page link")
    print("PASS multi-brand catalog: "
          + str(len(own)) + " own-brand + "
          + str(len(public_partner)) + " partner products; "
          + str(len(ids)) + " static fallback cards, original images, pages and no private pricing.")

if __name__ == "__main__":
    main()
