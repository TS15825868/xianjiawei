#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://ts15825868.github.io/xianjiawei/"
SOUP_VARIANTS = [
    "75g／盒｜8塊裝｜每塊約9.375g",
    "300g／盒｜16塊裝｜每塊約18.75g",
    "600g／盒｜32塊裝｜每塊約18.75g",
]


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self._in_title = False
        self.metas: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.jsonld: list[str] = []
        self._jsonld_open = False
        self._jsonld_buffer: list[str] = []
        self.html_lang = ""
        self.h1_count = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        data = {str(k).lower(): str(v or "") for k, v in attrs}
        if tag == "html":
            self.html_lang = data.get("lang", "")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            self.metas.append(data)
        elif tag == "link":
            self.links.append(data)
        elif tag == "script" and data.get("type", "").lower() == "application/ld+json":
            self._jsonld_open = True
            self._jsonld_buffer = []
        elif tag == "h1":
            self.h1_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._jsonld_open:
            self.jsonld.append("".join(self._jsonld_buffer).strip())
            self._jsonld_open = False
            self._jsonld_buffer = []

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._jsonld_open:
            self._jsonld_buffer.append(data)


def meta(parser: HeadParser, *, name: str = "", prop: str = "") -> str:
    for item in parser.metas:
        if name and item.get("name", "").lower() == name.lower():
            return item.get("content", "").strip()
        if prop and item.get("property", "").lower() == prop.lower():
            return item.get("content", "").strip()
    return ""


def canonical(parser: HeadParser) -> str:
    for item in parser.links:
        if "canonical" in item.get("rel", "").lower().split():
            return item.get("href", "").strip()
    return ""


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def validate_jsonld_images(errors: list[str], filename: str, payload) -> None:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if key in {"image", "url", "contentUrl", "thumbnailUrl"} and isinstance(value, str):
                if value.startswith(BASE):
                    path = value[len(BASE):].split("?", 1)[0]
                    if path and not (ROOT / path).exists() and key in {"image", "contentUrl", "thumbnailUrl"}:
                        fail(errors, f"{filename} JSON-LD 圖片不存在：{path}")
            validate_jsonld_images(errors, filename, value)
    elif isinstance(payload, list):
        for value in payload:
            validate_jsonld_images(errors, filename, value)


def main() -> int:
    errors: list[str] = []
    sitemap_path = ROOT / "sitemap.xml"
    if not sitemap_path.exists():
        print("ERROR 缺少 sitemap.xml")
        return 1

    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    tree = ET.parse(sitemap_path)
    urls = [node.text.strip() for node in tree.findall(".//sm:loc", ns) if node.text]
    if not urls:
        fail(errors, "sitemap.xml 沒有公開網址")
    if len(urls) != len(set(urls)):
        fail(errors, "sitemap.xml 有重複網址")

    key_pages = {
        "index.html", "products.html", "product-guilu-gao.html",
        "product-guilu-drink-30cc.html", "product-guilu-drink-180cc.html",
        "product-guilu-tangkuai.html", "product-guilu-jiao.html",
        "product-luerong-fen.html", "faq.html", "brand.html",
    }

    for url in urls:
        parsed = urlparse(url)
        if not url.startswith(BASE):
            fail(errors, f"sitemap 非正式網域：{url}")
            continue
        filename = Path(parsed.path).name or "index.html"
        path = ROOT / filename
        if not path.exists():
            fail(errors, f"sitemap 指向不存在頁面：{filename}")
            continue
        source = path.read_text("utf-8")
        parser = HeadParser()
        parser.feed(source)

        description = meta(parser, name="description")
        ai_summary = meta(parser, name="ai-summary")
        robots = meta(parser, name="robots")
        expected_canonical = f"{BASE}{filename}"

        if parser.html_lang != "zh-Hant-TW":
            fail(errors, f"{filename} lang 不是 zh-Hant-TW")
        if not parser.title.strip():
            fail(errors, f"{filename} 缺少 title")
        if not description:
            fail(errors, f"{filename} 缺少 meta description")
        if not ai_summary:
            fail(errors, f"{filename} 缺少 ai-summary")
        elif len(ai_summary) < 24:
            fail(errors, f"{filename} ai-summary 過短，無法形成獨立摘要")
        if canonical(parser) != expected_canonical:
            fail(errors, f"{filename} canonical 錯誤：{canonical(parser)}")
        if "index" not in robots or "follow" not in robots:
            fail(errors, f"{filename} robots 未允許索引")
        if parser.h1_count != 1:
            fail(errors, f"{filename} H1 數量應為 1，目前 {parser.h1_count}")
        if "小玻璃瓶" in source or re.search(r"30\s*cc.{0,16}玻璃瓶", source, re.I | re.S):
            fail(errors, f"{filename} 仍含 30cc 舊玻璃瓶稱呼")

        if filename in key_pages:
            for label, value in [
                ("og:title", meta(parser, prop="og:title")),
                ("og:description", meta(parser, prop="og:description")),
                ("og:image", meta(parser, prop="og:image")),
                ("twitter:card", meta(parser, name="twitter:card")),
            ]:
                if not value:
                    fail(errors, f"{filename} 缺少 {label}")
            if not parser.jsonld:
                fail(errors, f"{filename} 缺少 JSON-LD")
            for index, raw in enumerate(parser.jsonld, start=1):
                try:
                    payload = json.loads(raw)
                    validate_jsonld_images(errors, filename, payload)
                except json.JSONDecodeError as exc:
                    fail(errors, f"{filename} JSON-LD #{index} 無效：{exc}")

    required_files = [
        "robots.txt", "llms.txt", "llms-full.txt", "catalog-public.json", "geo-data.json",
        "site-official-product-variants.js",
    ]
    for filename in required_files:
        if not (ROOT / filename).exists():
            fail(errors, f"缺少機器可讀或正式規格檔案：{filename}")

    robots_text = (ROOT / "robots.txt").read_text("utf-8")
    if f"Sitemap: {BASE}sitemap.xml" not in robots_text:
        fail(errors, "robots.txt 未指向正式 sitemap.xml")

    llms = (ROOT / "llms.txt").read_text("utf-8")
    llms_full = (ROOT / "llms-full.txt").read_text("utf-8")
    for marker in [
        "龜鹿膏", "龜鹿飲30cc玻璃罐", "龜鹿飲180cc鋁袋",
        "龜鹿湯塊", "龜鹿膠", "鹿茸粉",
        "catalog-public.json", "geo-data.json", "llms-full.txt",
    ]:
        if marker not in llms:
            fail(errors, f"llms.txt 缺少：{marker}")
    for variant in SOUP_VARIANTS:
        if variant not in llms_full:
            fail(errors, f"llms-full.txt 缺少龜鹿湯塊正式規格：{variant}")

    catalog = json.loads((ROOT / "catalog-public.json").read_text("utf-8"))
    catalog_text = json.dumps(catalog, ensure_ascii=False)
    for marker in ["100g", "30cc", "180cc", "75g", "300g", "600g", "鹿茸粉"]:
        if marker not in catalog_text:
            fail(errors, f"catalog-public.json 缺少正式產品資料：{marker}")

    geo = json.loads((ROOT / "geo-data.json").read_text("utf-8"))
    geo_text = json.dumps(geo, ensure_ascii=False)
    for marker in ["仙加味", "萬華", "龜鹿膏", "龜鹿飲", "龜鹿湯塊", "龜鹿膠", "鹿茸粉", "300g"]:
        if marker not in geo_text:
            fail(errors, f"geo-data.json 缺少實體或規格：{marker}")

    runtime = (ROOT / "site-official-product-variants.js").read_text("utf-8")
    products_html = (ROOT / "products.html").read_text("utf-8")
    soup_html = (ROOT / "product-guilu-tangkuai.html").read_text("utf-8")
    for variant in SOUP_VARIANTS:
        for filename, source in [
            ("site-official-product-variants.js", runtime),
            ("products.html", products_html),
            ("product-guilu-tangkuai.html", soup_html),
        ]:
            if variant not in source:
                fail(errors, f"{filename} 缺少龜鹿湯塊正式規格：{variant}")

    if errors:
        print("AIO／SEO／GEO 正式合約失敗：")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"PASS AIO／SEO／GEO 正式合約：{len(urls)} 個 sitemap 頁面、Canonical、摘要、Schema、龜鹿湯塊三規格與機器可讀資料均通過")
    return 0


if __name__ == "__main__":
    sys.exit(main())
