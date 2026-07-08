from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
VERSION = "292.0"
HTML_FILES = sorted(
    path for path in ROOT.glob("*.html")
    if not path.name.lower().startswith("google")
)


def local_refs(text: str) -> list[str]:
    refs: list[str] = []
    for match in re.finditer(r'(?:href|src)="([^"]+)"', text):
        value = match.group(1).strip()
        if not value or value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
            continue
        parsed = urlsplit(value)
        if parsed.scheme or value.startswith("//"):
            continue
        refs.append(parsed.path)
    return refs


def main() -> None:
    lines: list[str] = [
        "仙加味官網全站一致性稽核 v292",
        "=" * 38,
        f"正式 HTML 頁面數：{len(HTML_FILES)}",
        "",
    ]

    required = {
        "title": re.compile(r"<title>.+?</title>", re.S),
        "description": re.compile(r'<meta[^>]+name="description"', re.I),
        "canonical": re.compile(r'<link[^>]+rel="canonical"', re.I),
        "og:title": re.compile(r'property="og:title"', re.I),
        "og:description": re.compile(r'property="og:description"', re.I),
        "site header": re.compile(r'id="site-header"'),
        "site footer": re.compile(r'id="site-footer"'),
        "site script": re.compile(rf'site\.js\?v={re.escape(VERSION)}'),
    }

    missing: list[str] = []
    broken: list[str] = []
    css_versions: set[str] = set()
    js_versions: set[str] = set()

    for path in HTML_FILES:
        text = path.read_text(encoding="utf-8")
        for label, pattern in required.items():
            if not pattern.search(text):
                missing.append(f"{path.name}: 缺少 {label}")
        css_versions.update(re.findall(r"site\.css\?v=([0-9.]+)", text))
        js_versions.update(re.findall(r"site\.js\?v=([0-9.]+)", text))
        for ref in local_refs(text):
            target = (ROOT / ref).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                continue
            if ref.endswith("/"):
                target = target / "index.html"
            if not target.exists():
                broken.append(f"{path.name} -> {ref}")

    lines.extend([
        f"CSS 版本：{', '.join(sorted(css_versions)) or '未偵測'}",
        f"JS 版本：{', '.join(sorted(js_versions)) or '未偵測'}",
        "",
        "必要欄位檢查：",
        *([f"- {item}" for item in missing] or ["- 通過"]),
        "",
        "站內連結與圖片檔案檢查：",
        *([f"- {item}" for item in sorted(set(broken))] or ["- 通過"]),
        "",
    ])

    forbidden = {
        "臨時到貨公告": ["產品盒裝到貨後", "全系列開放詢問與下單", "依訂單順序確認並安排出貨"],
        "公開個人姓名": ["鄭統"],
        "公開公司名稱": ["台興山產有限公司"],
        "舊規格": ["300g／盒", "300 g／盒", "600cc", "75克"],
    }
    forbidden_hits: list[str] = []
    scan_public = list(HTML_FILES) + [ROOT / "site.js", ROOT / "data.json"]
    for group, terms in forbidden.items():
        for term in terms:
            for path in scan_public:
                if path.exists() and term in path.read_text(encoding="utf-8"):
                    forbidden_hits.append(f"{group}｜{path.name}: {term}")

    lines.extend([
        "不應公開或已淘汰內容：",
        *([f"- {item}" for item in forbidden_hits] or ["- 通過"]),
        "",
    ])

    try:
        data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
        products = data.get("products", [])
        lines.append(f"產品資料中心：{len(products)} 種型態（龜鹿飲含兩項規格，共六項產品規格）")
        for product in products:
            lines.append(f"- {product.get('displayName') or product.get('name')}: {product.get('size', '')}")
    except Exception as exc:  # noqa: BLE001
        lines.append(f"產品資料中心：JSON 讀取失敗：{exc}")
    lines.append("")

    wrong_line_ids: list[str] = []
    scan_line = list(HTML_FILES) + [ROOT / "site.js", ROOT / "site-v287-core.js", ROOT / "data.json"]
    for path in scan_line:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        ids = set(re.findall(r"line\.me/R/oaMessage/(?:%40|@)([0-9A-Za-z_-]+)", text, flags=re.I))
        ids.update(re.findall(r"LINE ID[^\n@]{0,80}@([0-9A-Za-z_-]+)", text, flags=re.I))
        for line_id in sorted(ids):
            if line_id.lower() != "762jybnm":
                wrong_line_ids.append(f"{path.name}: @{line_id}")

    lines.extend([
        "LINE ID 檢查：",
        *([f"- {item}" for item in wrong_line_ids] or ["- 通過（@762jybnm）"]),
        "",
        "公開資訊原則：",
        "- 官網不公開價格，購買資訊導向官方 LINE。",
        "- 官網介紹用途方向、規格、成分、使用方式與保存方式。",
        "- 品牌故事不公開第四代本名，只保留世代身分與祖父稱呼「鹿角伯」。",
    ])

    report = "\n".join(lines) + "\n"
    (ROOT / "SITE_AUDIT_v292.txt").write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
