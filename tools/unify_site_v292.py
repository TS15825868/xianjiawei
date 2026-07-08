from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
VERSION = "292.0"
HTML_FILES = sorted(ROOT.glob("*.html"))


def replace_once(text: str, old: str, new: str, label: str, notes: list[str]) -> str:
    if old in text:
        notes.append(label)
        return text.replace(old, new, 1)
    return text


def normalize_html(path: Path, notes: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    original = text

    text = re.sub(r"site\.css\?v=[0-9.]+", f"site.css?v={VERSION}", text)
    text = re.sub(r"site\.js\?v=[0-9.]+", f"site.js?v={VERSION}", text)

    # 所有 LINE 按鈕保留可讀的 lin.ee fallback，實際預填訊息交由共用 JS 統一處理。
    text = re.sub(
        r'href="https://line\.me/R/oaMessage/@762jybnm/\?[^\"]*"',
        'data-line-url="" href="https://lin.ee/sHZW7NkR"',
        text,
    )

    if path.name == "index.html":
        text = text.replace(',"legalName":"台興山產有限公司"', "")
        text = replace_once(
            text,
            "把龜鹿膏、龜鹿飲、龜鹿湯塊、鹿茸粉整理成一頁，先掌握固定、即飲、沖泡燉湯、大規格與自行調飲等用途方向。",
            "把龜鹿膏100g、龜鹿飲30cc、龜鹿飲180cc、龜鹿湯塊75g、龜鹿膠600g與鹿茸粉75g整理成一頁，先掌握五大產品型態與六項規格的用途差異。",
            "首頁產品整理文字補齊六項規格",
            notes,
        )

    if path.name == "products.html":
        text = replace_once(
            text,
            '仙加味全系列已開放詢問與下單。認識龜鹿食補的五大用途方向：固定取用、即飲、沖泡燉湯、傳統大規格與自行調飲，並比較六項產品規格。',
            '認識仙加味龜鹿食補的五大用途方向：固定取用、即飲、沖泡燉湯、傳統大規格與自行調飲，並比較六項產品規格。',
            "產品總覽移除臨時下單公告 SEO 文字",
            notes,
        )
        text = replace_once(
            text,
            '仙加味全系列已開放詢問與下單，盒裝到貨後將依訂單順序安排出貨。',
            '認識龜鹿膏、兩種龜鹿飲、龜鹿湯塊、龜鹿膠與鹿茸粉的用途方向、規格與使用方式。',
            "產品總覽移除臨時到貨 OG 文字",
            notes,
        )
        text = re.sub(
            r'\n?<section class="section section--narrow">\s*<div class="final-cta reveal">\s*<p class="eyebrow">全系列開放詢問與下單</p>.*?</section>\s*',
            "\n",
            text,
            count=1,
            flags=re.S,
        )

    if path.name == "guide.html":
        text = text.replace("<h2>五種產品使用方式</h2>", "<h2>五大產品型態與六項規格的使用方式</h2>")
        text = replace_once(
            text,
            "龜鹿飲為小瓶即飲型態，適合想簡單安排的人。",
            "龜鹿飲有30cc玻璃瓶與180cc鋁袋，皆為即飲型態，適合想減少準備步驟的人。",
            "使用方式頁補齊龜鹿飲兩項規格",
            notes,
        )

    if path.name == "brand.html":
        text = text.replace("第四代鄭統", "第四代主理人")

    if text != original:
        path.write_text(text, encoding="utf-8")
        notes.append(f"統一版本與共用設定：{path.name}")


def collect_local_refs(text: str) -> list[str]:
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


def audit(notes: list[str]) -> str:
    lines: list[str] = []
    lines.append("仙加味官網全站一致性稽核 v292")
    lines.append("=" * 38)
    lines.append(f"HTML 頁面數：{len(HTML_FILES)}")
    lines.append("")

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
        for ref in collect_local_refs(text):
            target = (ROOT / ref).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                continue
            if ref.endswith("/"):
                target = target / "index.html"
            if not target.exists():
                broken.append(f"{path.name} -> {ref}")

    lines.append(f"CSS 版本：{', '.join(sorted(css_versions)) or '未偵測'}")
    lines.append(f"JS 版本：{', '.join(sorted(js_versions)) or '未偵測'}")
    lines.append("")

    lines.append("必要欄位檢查：")
    lines.extend([f"- {item}" for item in missing] or ["- 通過"])
    lines.append("")

    lines.append("站內連結與圖片檔案檢查：")
    lines.extend([f"- {item}" for item in sorted(set(broken))] or ["- 通過"])
    lines.append("")

    forbidden = {
        "臨時到貨公告": ["產品盒裝到貨後", "全系列開放詢問與下單", "依訂單順序確認並安排出貨"],
        "公開個人姓名": ["鄭統"],
        "公開公司名稱": ["台興山產有限公司"],
        "舊規格": ["300g／盒", "300 g／盒", "600cc", "75克"],
    }
    lines.append("不應公開或已淘汰內容：")
    any_forbidden = False
    for group, terms in forbidden.items():
        hits: list[str] = []
        for term in terms:
            for path in list(HTML_FILES) + [ROOT / "site.js", ROOT / "data.json"]:
                if path.exists() and term in path.read_text(encoding="utf-8"):
                    hits.append(f"{path.name}: {term}")
        if hits:
            any_forbidden = True
            lines.append(f"- {group}")
            lines.extend(f"  - {hit}" for hit in hits)
    if not any_forbidden:
        lines.append("- 通過")
    lines.append("")

    try:
        data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
        products = data.get("products", [])
        lines.append("產品資料中心：")
        lines.append(f"- 產品型態數：{len(products)}")
        for product in products:
            lines.append(f"- {product.get('displayName') or product.get('name')}: {product.get('size', '')}")
    except Exception as exc:  # noqa: BLE001
        lines.append(f"產品資料中心：JSON 讀取失敗：{exc}")
    lines.append("")

    wrong_line_ids: list[str] = []
    for path in list(HTML_FILES) + [ROOT / "site.js", ROOT / "site-v287-core.js", ROOT / "data.json"]:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for line_id in sorted(set(re.findall(r"@[0-9A-Za-z_-]{6,}", text))):
            if line_id != "@762jybnm":
                wrong_line_ids.append(f"{path.name}: {line_id}")
    lines.append("LINE ID 檢查：")
    lines.extend([f"- {item}" for item in wrong_line_ids] or ["- 通過（@762jybnm）"])
    lines.append("")

    lines.append("本次自動修正：")
    lines.extend([f"- {item}" for item in notes] or ["- 無需修改"])
    lines.append("")
    lines.append("說明：價格不於官網公開；官網統一介紹產品用途方向、規格、成分、使用方式與保存方式，購買資訊導向官方 LINE。")
    return "\n".join(lines) + "\n"


def main() -> None:
    notes: list[str] = []
    for html_path in HTML_FILES:
        normalize_html(html_path, notes)

    report = audit(notes)
    (ROOT / "SITE_AUDIT_v292.txt").write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
