from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"google-site-verification.html"}
CANONICAL_COMMANDS = {
    "看產品", "直接下單", "幫我推薦", "搭配組合", "怎麼使用",
    "價格方案", "品牌故事", "人工客服", "料理搭配",
}
PREFIX_COMMANDS = {
    "產品詳情", "使用方式", "選擇數量", "加入購物車",
    "搭配方案", "搭配組數", "加入組合",
}


class PageParser(HTMLParser):
    def __init__(self, path: Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.links: list[dict] = []
        self.buttons: list[dict] = []
        self.ids: set[str] = set()
        self.body_page = ""
        self._anchor: dict | None = None
        self._button: dict | None = None

    def handle_starttag(self, tag: str, attrs_list):
        attrs = dict(attrs_list)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "body":
            self.body_page = attrs.get("data-page", "")
        if tag == "a":
            self._anchor = {"attrs": attrs, "text": "", "line": self.getpos()[0]}
        if tag == "button":
            self._button = {"attrs": attrs, "text": "", "line": self.getpos()[0]}

    def handle_data(self, data: str):
        if self._anchor is not None:
            self._anchor["text"] += data
        if self._button is not None:
            self._button["text"] += data

    def handle_endtag(self, tag: str):
        if tag == "a" and self._anchor is not None:
            self._anchor["text"] = " ".join(self._anchor["text"].split())
            self.links.append(self._anchor)
            self._anchor = None
        if tag == "button" and self._button is not None:
            self._button["text"] = " ".join(self._button["text"].split())
            self.buttons.append(self._button)
            self._button = None


def clean_local_path(value: str) -> tuple[str, str]:
    parsed = urlsplit(value)
    path = unquote(parsed.path)
    if path.startswith("/xianjiawei/"):
        path = path[len("/xianjiawei/"):]
    elif path.startswith("/"):
        path = path[1:]
    return path, parsed.fragment


def extract_source_line_map(site_js: str) -> dict[str, str]:
    match = re.search(r"function sourceLineText\(page = ''\) \{[\s\S]*?const map = \{([\s\S]*?)\};", site_js)
    if not match:
        return {}
    result: dict[str, str] = {}
    for line in match.group(1).splitlines():
        parsed = re.search(r"^\s*(?:'([^']+)'|([A-Za-z0-9_-]+))\s*:\s*'([^']+)'", line)
        if parsed:
            result[parsed.group(1) or parsed.group(2)] = parsed.group(3)
    return result


def decode_line_command(href: str) -> str:
    parsed = urlsplit(href)
    if parsed.netloc != "line.me" or "/R/oaMessage/" not in parsed.path:
        return ""
    return unquote(parsed.query)


def valid_line_command(command: str, product_ids: set[str]) -> bool:
    if command in CANONICAL_COMMANDS:
        return True
    if "｜" not in command:
        return False
    action, value, *_ = command.split("｜")
    if action not in PREFIX_COMMANDS:
        return False
    if action in {"產品詳情", "使用方式", "選擇數量", "加入購物車"}:
        return value in product_ids
    if action in {"搭配方案", "搭配組數", "加入組合"}:
        return value.isdigit()
    return False


def main() -> None:
    errors: list[str] = []
    warnings: list[str] = []
    report_rows: list[str] = []

    html_paths = sorted(p for p in ROOT.glob("*.html") if p.name not in EXCLUDED)
    parsers: dict[str, PageParser] = {}
    for path in html_paths:
        parser = PageParser(path)
        parser.feed(path.read_text(encoding="utf-8"))
        parsers[path.name] = parser

    data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    product_ids = {str(item.get("id")) for item in data.get("products", [])}
    site_js = (ROOT / "site.js").read_text(encoding="utf-8")
    line_map = extract_source_line_map(site_js)

    for token in (
        "function normalizeLineIntent",
        "function lineIntentButtonLabel",
        "function buildLineAutoLink",
        "function renderFloatingLineCta",
        "function openProductModal",
        "function initDMLightboxV282",
        "el.textContent = visibleLabel",
        "p.page || p.detailPage || 'products.html'",
        "`搭配組數｜${index}`",
    ):
        if token not in site_js:
            errors.append(f"site.js 缺少必要按鈕功能：{token}")

    for page_name, parser in parsers.items():
        if not parser.body_page:
            errors.append(f"{page_name} 缺少 body data-page")
        elif parser.body_page not in line_map:
            errors.append(f"{page_name} 的 data-page={parser.body_page} 沒有 LINE 頁面對應")

        for item in parser.links:
            attrs = item["attrs"]
            href = (attrs.get("href") or "").strip()
            text = item["text"] or attrs.get("aria-label", "")
            line_no = item["line"]
            is_line_dynamic = "data-line-url" in attrs

            if not href and not is_line_dynamic:
                errors.append(f"{page_name}:{line_no} 連結「{text}」沒有 href")
                continue
            if href in {"#", "javascript:void(0)", "javascript:void(0);"}:
                errors.append(f"{page_name}:{line_no} 連結「{text}」使用無效目的地 {href}")
                continue
            if attrs.get("target") == "_blank" and "noopener" not in attrs.get("rel", ""):
                errors.append(f"{page_name}:{line_no} 外開連結「{text}」缺少 rel=noopener")

            if is_line_dynamic:
                report_rows.append(f"| {page_name} | {text or 'LINE 按鈕'} | LINE 動態意圖 | 通過 |")
                continue

            parsed = urlsplit(href)
            if parsed.scheme in {"http", "https", "mailto", "tel"} or parsed.netloc:
                command = decode_line_command(href)
                if command and not valid_line_command(command, product_ids):
                    errors.append(f"{page_name}:{line_no} LINE 指令無效：{command}")
                report_rows.append(f"| {page_name} | {text or href} | {href} | 通過 |")
                continue

            local_path, fragment = clean_local_path(href)
            target_name = local_path or page_name
            target = ROOT / target_name
            if not target.exists():
                errors.append(f"{page_name}:{line_no} 連結「{text}」目的地不存在：{href}")
                report_rows.append(f"| {page_name} | {text or href} | {href} | 失敗 |")
                continue
            if fragment and target.suffix.lower() == ".html":
                target_parser = parsers.get(target.name)
                if target_parser and fragment not in target_parser.ids:
                    errors.append(f"{page_name}:{line_no} 錨點不存在：{href}")
            report_rows.append(f"| {page_name} | {text or href} | {href} | 通過 |")

        for item in parser.buttons:
            attrs = item["attrs"]
            text = item["text"] or attrs.get("aria-label", "")
            line_no = item["line"]
            if not text:
                errors.append(f"{page_name}:{line_no} 按鈕沒有文字或 aria-label")
            if not attrs.get("type"):
                warnings.append(f"{page_name}:{line_no} 按鈕「{text}」未指定 type")
            report_rows.append(f"| {page_name} | {text or '未命名按鈕'} | JavaScript 功能 | 通過 |")

    for product in data.get("products", []):
        page = str(product.get("page") or product.get("detailPage") or "").split("?", 1)[0]
        if not page or not (ROOT / page).exists():
            errors.append(f"產品 {product.get('id')} 詳細頁不存在：{page}")
        for field in ("image", "dmImage"):
            asset = str(product.get(field) or "").split("?", 1)[0]
            if asset and not (ROOT / asset).exists():
                errors.append(f"產品 {product.get('id')} 的 {field} 不存在：{asset}")

    line_server_path = ROOT / ".tmp-line-server.js"
    if line_server_path.exists():
        line_server = line_server_path.read_text(encoding="utf-8")
        for page, command in line_map.items():
            if command not in line_server and command not in {"料理搭配"}:
                errors.append(f"LINE OA server.js 找不到頁面指令：{page} → {command}")
        for required in (
            "產品詳情｜", "使用方式｜", "搭配組數", "加入組合｜",
            "看產品", "幫我推薦", "搭配組合", "怎麼使用", "價格方案",
            "品牌故事", "人工客服",
        ):
            if required not in line_server:
                errors.append(f"LINE OA 缺少網站需要的指令：{required}")

    report = [
        "# 全站按鈕與連結稽核報告",
        "",
        f"- HTML 頁面：{len(html_paths)}",
        f"- 檢查連結與按鈕：{len(report_rows)}",
        f"- 錯誤：{len(errors)}",
        f"- 警告：{len(warnings)}",
        "",
        "| 頁面 | 按鈕／連結 | 目的地／功能 | 結果 |",
        "|---|---|---|---|",
        *report_rows,
    ]
    if warnings:
        report.extend(["", "## 警告", *[f"- {item}" for item in warnings]])
    if errors:
        report.extend(["", "## 錯誤", *[f"- {item}" for item in errors]])
    (ROOT / "BUTTON_AUDIT_REPORT.md").write_text("\n".join(report) + "\n", encoding="utf-8")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print(f"PASS static button audit: {len(html_paths)} pages, {len(report_rows)} controls")


if __name__ == "__main__":
    main()
