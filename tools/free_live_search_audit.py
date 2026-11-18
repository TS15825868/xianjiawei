#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import xml.etree.ElementTree as ET

BASE = "https://ts15825868.github.io/xianjiawei/"
SITEMAP = urljoin(BASE, "sitemap.xml")
ROOT = Path(__file__).resolve().parents[1]
HIDDEN_OWN = {"product-guilu-tangkuai.html", "product-guilu-jiao.html"}

def load_public_pages(master, partners):
    own = set()
    for item in master["products"]:
        page = item["page"]
        if not page.startswith(BASE):
            raise ValueError("own page outside canonical base")
        own.add(page.removeprefix(BASE))
    public = {item["page"] for item in partners["products"] if item.get("public") is True}
    hidden = {item["page"] for item in partners["products"] if item.get("public") is False and item.get("page")}
    if len(own) != master["productCount"] or own & public or (own | public) & (hidden | HIDDEN_OWN):
        raise ValueError("public page identity or visibility conflict")
    if any(not page.startswith("product-") or not page.endswith(".html") or "/" in page for page in own | public | hidden):
        raise ValueError("invalid product page")
    return own, public, hidden | HIDDEN_OWN


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = ""
        self.robots = ""
        self.hrefs: set[str] = set()

    def handle_starttag(self, tag, attrs):
        data = {str(k).lower(): str(v or "") for k, v in attrs}
        if tag == "link" and "canonical" in data.get("rel", "").lower().split():
            self.canonical = data.get("href", "").strip()
        elif tag == "meta" and data.get("name", "").lower() == "robots":
            self.robots = data.get("content", "").lower()
        elif tag == "a":
            href = data.get("href", "").strip()
            if href:
                self.hrefs.add(href)


def fetch(url: str, timeout: int = 20) -> tuple[int, str, str]:
    req = Request(url, headers={"User-Agent": "Xianjiawei-Free-Search-Audit/1.0"})
    try:
        with urlopen(req, timeout=timeout) as r:
            body = r.read().decode("utf-8", "replace")
            return int(getattr(r, "status", 200)), r.geturl(), body
    except HTTPError as exc:
        body = exc.read().decode("utf-8", "replace") if exc.fp else ""
        return int(exc.code), url, body
    except URLError as exc:
        raise RuntimeError(f"fetch failed: {url}: {exc}") from exc


def normalized_local(href: str) -> str | None:
    if href.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    absolute = urljoin(BASE, href)
    if not absolute.startswith(BASE):
        return None
    path = urlparse(absolute).path
    prefix = "/xianjiawei/"
    if not path.startswith(prefix):
        return None
    return path[len(prefix):] or "index.html"


def parse_page(html: str) -> PageParser:
    p = PageParser()
    p.feed(html)
    return p


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    status, final_url, xml_text = fetch(SITEMAP)
    if status != 200:
        errors.append(f"sitemap HTTP {status}: {SITEMAP}")
        urls: list[str] = []
    else:
        try:
            root = ET.fromstring(xml_text)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            urls = [n.text.strip() for n in root.findall(".//sm:loc", ns) if n.text]
        except Exception as exc:
            errors.append(f"sitemap parse failed: {exc}")
            urls = []

    if not urls:
        errors.append("sitemap contains no URLs")

    # Compare deployed source-of-truth files with this exact audited Git version.
    # Partner products are discoverable on the website, but are not forced into
    # the own-brand AI knowledge master.
    local_master = json.loads((ROOT / "public-product-master.json").read_text(encoding="utf-8"))
    local_partners = json.loads((ROOT / "partner-catalog.json").read_text(encoding="utf-8"))
    own, partner, hidden = load_public_pages(local_master, local_partners)
    for rel, expected in [("public-product-master.json", local_master), ("partner-catalog.json", local_partners)]:
        st, _, raw = fetch(urljoin(BASE, rel))
        if st != 200 or json.loads(raw) != expected:
            errors.append(f"live authority differs from audited repository: {rel}")
    public_pages = own | partner
    sitemap_pages = {normalized_local(u) for u in urls}
    if public_pages - sitemap_pages:
        errors.append("sitemap missing public catalog pages: " + ", ".join(sorted(public_pages - sitemap_pages)))
    if hidden & sitemap_pages:
        errors.append("sitemap contains hidden pages: " + ", ".join(sorted(hidden & sitemap_pages)))
    for rel in sorted(hidden):
        st, _, body = fetch(urljoin(BASE, rel))
        if st not in (404, 410) and (st != 200 or "noindex" not in parse_page(body).robots):
            errors.append(f"hidden product page indexable or unavailable unexpectedly: {rel} HTTP {st}")
    html_pages = 0
    for url in urls:
        if not url.startswith(BASE):
            errors.append(f"sitemap URL outside official base: {url}")
            continue
        st, resolved, body = fetch(url)
        if st != 200:
            errors.append(f"HTTP {st}: {url}")
            continue
        path = urlparse(url).path
        if path.endswith(".html"):
            html_pages += 1
            p = parse_page(body)
            if "noindex" in p.robots:
                errors.append(f"noindex found on public page: {url}")
            if p.canonical != url:
                errors.append(f"canonical mismatch: {url} -> {p.canonical or '(missing)'}")

    for rel in ["public-product-master.json", "ai-answers.json", "geo-data.json", "llms.txt", "llms-full.txt"]:
        st, _, _ = fetch(urljoin(BASE, rel))
        if st != 200:
            errors.append(f"AI/search authority HTTP {st}: {rel}")

    st, _, homepage = fetch(urljoin(BASE, "index.html"))
    if st == 200:
        links = {x for href in parse_page(homepage).hrefs if (x := normalized_local(href))}
        missing = sorted((own | {"products.html", "faq.html", "brand.html", "trial.html"}) - links)
        if missing:
            errors.append("homepage missing static discovery links: " + ", ".join(missing))
    else:
        errors.append(f"homepage HTTP {st}")

    st, _, products = fetch(urljoin(BASE, "products.html"))
    if st == 200:
        links = {x for href in parse_page(products).hrefs if (x := normalized_local(href))}
        missing = sorted(public_pages - links)
        if hidden & links:
            errors.append("products page links to hidden product pages: " + ", ".join(sorted(hidden & links)))
        if missing:
            errors.append("products page missing static product links: " + ", ".join(missing))

    # robots.txt is authoritative only at the host root. A project-site robots file is
    # useful documentation but is not treated as a host-root crawler directive.
    root_robots = "https://ts15825868.github.io/robots.txt"
    try:
        st, _, body = fetch(root_robots)
        if st == 200:
            low = body.lower()
            if "user-agent: *" in low and "disallow: /" in low:
                warnings.append("host-root robots.txt contains a broad Disallow; review manually")
            else:
                print("INFO host-root robots.txt reachable; no simple global block detected")
        else:
            print(f"INFO host-root robots.txt HTTP {st}; absence means this project file cannot control host-root robots")
    except RuntimeError as exc:
        warnings.append(str(exc))

    if warnings:
        for item in warnings:
            print("WARN", item)
    if errors:
        for item in errors:
            print("ERROR", item)
        return 1

    print(f"PASS free live SEO/AIO/AEO/GEO audit: {len(urls)} sitemap URLs reachable, {html_pages} HTML canonicals/indexability checked, {len(own)} own-brand and {len(partner)} public partner product pages; {len(hidden)} hidden pages excluded; static discovery links present, AI authority endpoints reachable.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
