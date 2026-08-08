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
SOUP_SPEC = "75g／盒｜8塊裝｜每塊約9.375g"
OFFICIAL_SPECS = [
    "龜鹿膏 100g／罐",
    "龜鹿飲30cc玻璃罐 30cc／罐",
    "龜鹿飲180cc鋁袋 180cc／包",
    "龜鹿湯塊 75g／盒",
    "龜鹿膠 600g（1斤）／盒",
    "鹿茸粉 75g／罐",
]
PRIMARY_DECISION_PAGES = {
    "index.html", "brand-facts.html", "products.html", "choose.html", "combo.html",
    "guide.html", "faq.html", "trial.html", "brand.html",
    "product-guilu-gao.html", "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html", "product-guilu-tangkuai.html",
    "product-guilu-jiao.html", "product-luerong-fen.html",
}
REQUIRED_SITEMAP_PAGES = PRIMARY_DECISION_PAGES | {
    "dm.html", "recipes.html", "video.html", "knowledge.html", "hanfang-baike.html",
    "sources.html", "brand-origin.html", "ingredients.html", "quality.html", "craft.html",
    "contact.html",
}


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


def local_public_path(value: str) -> str:
    text = str(value or "")
    if text.startswith(BASE):
        text = text[len(BASE):]
    return text.split("?", 1)[0].lstrip("/")


def validate_jsonld_images(errors: list[str], filename: str, payload) -> None:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if key in {"image", "contentUrl", "thumbnailUrl"} and isinstance(value, str) and value.startswith(BASE):
                path = local_public_path(value)
                if path and not (ROOT / path).exists():
                    fail(errors, f"{filename} JSON-LD 圖片不存在：{path}")
            validate_jsonld_images(errors, filename, value)
    elif isinstance(payload, list):
        for value in payload:
            validate_jsonld_images(errors, filename, value)


def unauthorized_soup_weights(text: str) -> list[str]:
    found: list[str] = []
    labels = ["龜鹿湯塊", "龜鹿膠", "龜鹿膏", "鹿茸粉"]
    for match in re.finditer(r"(?<!\d)(\d+(?:\.\d+)?)\s*g", text, re.I):
        value = float(match.group(1))
        if value < 50:
            continue
        before = text[max(0, match.start() - 80):match.start()]
        position, label = max((before.rfind(label), label) for label in labels)
        if position >= 0 and label == "龜鹿湯塊" and abs(value - 75.0) > 0.001:
            found.append(match.group(0))
    return found


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

    sitemap_pages = {Path(urlparse(url).path).name or "index.html" for url in urls}
    missing_sitemap_pages = sorted(REQUIRED_SITEMAP_PAGES - sitemap_pages)
    if missing_sitemap_pages:
        fail(errors, f"sitemap.xml 缺少主要頁面：{missing_sitemap_pages}")

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
        if not ai_summary or len(ai_summary) < 24:
            fail(errors, f"{filename} 缺少可獨立引用的 ai-summary")
        if canonical(parser) != expected_canonical:
            fail(errors, f"{filename} canonical 錯誤：{canonical(parser)}")
        if "index" not in robots or "follow" not in robots:
            fail(errors, f"{filename} robots 未允許索引")
        if parser.h1_count != 1:
            fail(errors, f"{filename} H1 數量應為1，目前{parser.h1_count}")
        if "30cc玻璃瓶" in source or "小玻璃瓶" in source:
            fail(errors, f"{filename} 仍含30cc舊稱")
        bad_weights = unauthorized_soup_weights(source)
        if bad_weights:
            fail(errors, f"{filename} 出現未核准龜鹿湯塊重量：{bad_weights}")

        if filename in PRIMARY_DECISION_PAGES:
            for label, value in [
                ("og:title", meta(parser, prop="og:title")),
                ("og:description", meta(parser, prop="og:description")),
                ("og:image", meta(parser, prop="og:image")),
                ("twitter:card", meta(parser, name="twitter:card")),
                ("twitter:title", meta(parser, name="twitter:title")),
                ("twitter:description", meta(parser, name="twitter:description")),
                ("twitter:image", meta(parser, name="twitter:image")),
            ]:
                if not value:
                    fail(errors, f"{filename} 缺少 {label}")
            for image_label, image_url in [
                ("og:image", meta(parser, prop="og:image")),
                ("twitter:image", meta(parser, name="twitter:image")),
            ]:
                if image_url.startswith(BASE):
                    image_path = local_public_path(image_url)
                    if image_path and not (ROOT / image_path).exists():
                        fail(errors, f"{filename} {image_label} 圖片不存在：{image_path}")
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
        "site-official-product-variants.js", "content/public-post-library.json",
        "content/public-asset-library.json", "content/public-content-policy.json",
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
        "龜鹿膏", "龜鹿飲30cc玻璃罐", "龜鹿飲180cc鋁袋", "龜鹿湯塊", "75g／盒",
        "龜鹿膠", "鹿茸粉", "catalog-public.json", "geo-data.json", "llms-full.txt",
    ]:
        if marker not in llms:
            fail(errors, f"llms.txt 缺少：{marker}")
    if SOUP_SPEC not in llms_full:
        fail(errors, f"llms-full.txt 缺少龜鹿湯塊正式規格：{SOUP_SPEC}")
    for filename, text in [("llms.txt", llms), ("llms-full.txt", llms_full)]:
        bad = unauthorized_soup_weights(text)
        if bad:
            fail(errors, f"{filename} 出現未核准龜鹿湯塊重量：{bad}")

    catalog = json.loads((ROOT / "catalog-public.json").read_text("utf-8"))
    if len(catalog.get("products", [])) != 6:
        fail(errors, "catalog-public.json產品必須剛好六項")
    if catalog.get("officialSpecifications") != OFFICIAL_SPECS:
        fail(errors, "catalog-public.json六項正式規格不同步")
    soup = next((item for item in catalog.get("products", []) if item.get("id") == "guilu-tangkuai"), None)
    if not soup or soup.get("size") != "75g／盒" or soup.get("package") != "深藍正式盒裝":
        fail(errors, "catalog-public.json龜鹿湯塊正式規格或包裝錯誤")

    geo_text = (ROOT / "geo-data.json").read_text("utf-8")
    for marker in ["仙加味", "萬華", "龜鹿膏", "龜鹿飲", "龜鹿湯塊", "75g／盒", "龜鹿膠", "鹿茸粉"]:
        if marker not in geo_text:
            fail(errors, f"geo-data.json 缺少實體或規格：{marker}")
    bad_geo = unauthorized_soup_weights(geo_text)
    if bad_geo:
        fail(errors, f"geo-data.json 出現未核准龜鹿湯塊重量：{bad_geo}")

    runtime = (ROOT / "site-official-product-variants.js").read_text("utf-8")
    if "75g／盒" not in runtime or "singleSpecOnly: true" not in runtime:
        fail(errors, "正式規格顯示層未鎖定龜鹿湯塊75g唯一規格")
    bad_runtime = unauthorized_soup_weights(runtime)
    if bad_runtime:
        fail(errors, f"正式規格顯示層出現未核准龜鹿湯塊重量：{bad_runtime}")

    posts_text = (ROOT / "content/public-post-library.json").read_text("utf-8")
    bad_posts = unauthorized_soup_weights(posts_text)
    if bad_posts:
        fail(errors, f"公開貼文資料出現未核准龜鹿湯塊重量：{bad_posts}")

    if errors:
        print("AIO／SEO／GEO 正式合約失敗：")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        f"PASS AIO／SEO／GEO：{len(urls)}個sitemap頁面、{len(PRIMARY_DECISION_PAGES)}個主要決策頁、"
        "Canonical、摘要、社群預覽、Schema、六個正式產品／六個正式規格、龜鹿湯塊75g唯一規格與機器可讀資料均通過"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
