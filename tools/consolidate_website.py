from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import subprocess
import sys

VERSION = "299.1"
ROOT = Path(__file__).resolve().parents[1]


def fail(message):
    raise SystemExit(message)


def consolidate():
    core = ROOT / "site-v287-core.js"
    site = ROOT / "site.js"
    if not core.exists():
        fail("site-v287-core.js not found")

    js = core.read_text(encoding="utf-8")
    js = re.sub(r"fetch\('data\.json\?v=[^']+'\)", f"fetch('data.json?v={VERSION}')", js)

    header_pattern = re.compile(
        r"function renderHeaderBar\(\) \{[\s\S]*?\n\}\n\nfunction renderMenuDrawer\(\)",
        re.M,
    )
    header_replacement = '''function renderHeaderBar() {
  const brand = SITE_DATA?.brand || '仙加味';
  return `
    <div class="header-inner">
      <a class="brand-mark" href="index.html" aria-label="${brand}｜補養，是一種節奏。">
        <img src="images/logo.png" alt="${brand}" decoding="async">
        <span class="brand-mark__copy">
          <span class="brand-mark__name">${brand}</span>
          <span class="brand-mark__tagline">補養，是一種節奏。</span>
        </span>
      </a>
      <button id="menu-btn" class="menu-btn" type="button" aria-label="開啟選單" aria-expanded="false">☰ 選單</button>
    </div>
  `;
}

function renderMenuDrawer()'''
    js, count = header_pattern.subn(header_replacement, js, count=1)
    if count != 1:
        fail("renderHeaderBar block replacement failed")

    replacements = {
        "官方 LINE 客服": "官方 LINE 詢問",
        "LINE 諮詢產品": "LINE 詢問產品",
        "傳統龜鹿食補・現代日常使用。": "補養，是一種節奏。",
        "if (page === 'videos' || page === 'video')": "if (page === 'video')",
        "    if (page === 'hanfang-baike') renderHanfangBaike();": "  if (page === 'hanfang-baike') renderHanfangBaike();",
    }
    for old, new in replacements.items():
        js = js.replace(old, new)

    js = js.replace(
        "lineButton('這組適合我嗎？', `我想看「${combo.name}」這組適不適合我。`)",
        "lineButton('LINE 詢問搭配方式', `我想了解「${combo.name}」搭配組合的內容與購買方式。`)",
    )
    js = js.replace(
        "lineButton('這組適合我嗎？', `我想看「${combo.name || '套餐搭配'}」這組適不適合我。`)",
        "lineButton('LINE 詢問搭配方式', `我想了解「${combo.name || '套餐搭配'}」搭配組合的內容與購買方式。`)",
    )
    site.write_text(js, encoding="utf-8")

    css_path = ROOT / "site.css"
    css = css_path.read_text(encoding="utf-8")
    header_css_path = ROOT / "site-header-brand-v298-8.css"
    if header_css_path.exists() and "仙加味頁首品牌語｜整合版" not in css:
        extra = header_css_path.read_text(encoding="utf-8")
        extra = extra.replace("仙加味頁首品牌語｜v298.8", "仙加味頁首品牌語｜整合版")
        css = css.rstrip() + "\n\n" + extra.strip() + "\n"
    css_path.write_text(css, encoding="utf-8")

    for html in ROOT.glob("*.html"):
        text = html.read_text(encoding="utf-8")
        text = re.sub(r"site\.css\?v=[^\"']+", f"site.css?v={VERSION}", text)
        text = re.sub(r"site\.js\?v=[^\"']+", f"site.js?v={VERSION}", text)
        text = re.sub(r"\s*<link[^>]+site-header-brand-v298-8\.css[^>]*>", "", text)
        html.write_text(text, encoding="utf-8")

    remove = [
        "site-v287-core.js",
        "site-header-brand-v298-8.css",
        "site-v298-5-products.js",
        "UPLOAD_180_PRODUCT_PLACEHOLDER.txt",
        "UPLOAD_NOTE.txt",
        "UPDATE_NOTES.txt",
    ]
    for name in remove:
        path = ROOT / name
        if path.exists():
            path.unlink()

    for pattern in ("TRIGGER_*.txt", "CLEANUP_*.txt", "CONSOLIDATE_*.txt"):
        for path in ROOT.glob(pattern):
            path.unlink()


def smoke_test():
    errors = []
    pages = [
        "index.html", "products.html", "choose.html", "combo.html", "guide.html",
        "recipes.html", "video.html", "knowledge.html", "hanfang-baike.html",
        "sources.html", "brand.html", "faq.html", "contact.html",
        "product-guilu-gao.html", "product-guilu-drink-30cc.html",
        "product-guilu-drink-180cc.html", "product-guilu-tangkuai.html",
        "product-guilu-jiao.html", "product-luerong-fen.html",
    ]
    for page in pages:
        if not (ROOT / page).exists():
            errors.append(f"missing page: {page}")

    data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    expected = ["guilu-gao", "guilu-drink-30", "guilu-drink-180", "guilu-tangkuai", "guilu-jiao", "luerong-fen"]
    ids = [product.get("id") for product in data.get("products", [])]
    if ids != expected:
        errors.append(f"product ids/order mismatch: {ids}")

    for product in data.get("products", []):
        for key in ("id", "displayName", "size", "description", "ingredients", "usage", "image", "dmImage", "page"):
            if not product.get(key):
                errors.append(f"{product.get('id')} missing {key}")
        for key in ("image", "dmImage"):
            asset = str(product.get(key, "")).split("?", 1)[0]
            if asset and not (ROOT / asset).exists():
                errors.append(f"missing product asset: {asset}")
        page = str(product.get("page", "")).split("?", 1)[0]
        if page and not (ROOT / page).exists():
            errors.append(f"missing product page: {page}")

    attr_re = re.compile(r'''(?:href|src)=["']([^"']+)["']''', re.I)
    for html in ROOT.glob("*.html"):
        text = html.read_text(encoding="utf-8")
        if f"site.js?v={VERSION}" not in text:
            errors.append(f"{html.name}: wrong site.js version")
        for value in attr_re.findall(text):
            if value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
                continue
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc:
                continue
            target = parsed.path.lstrip("/")
            if target and not (ROOT / target).exists():
                errors.append(f"{html.name}: missing reference {target}")

    site_js = (ROOT / "site.js").read_text(encoding="utf-8")
    for needle in (
        "補養，是一種節奏。",
        f"fetch('data.json?v={VERSION}')",
        "function renderHeaderBar()",
        "function renderProductsPage()",
        "function renderComboPage()",
        "function renderGuidePage()",
        "function renderVideosPage()",
        "function renderFaqPage()",
    ):
        if needle not in site_js:
            errors.append(f"site.js missing: {needle}")

    for obsolete in ("site-v287-core.js", "site-header-brand-v298-8.css", "site-v298-5-products.js"):
        if (ROOT / obsolete).exists():
            errors.append(f"obsolete file remains: {obsolete}")

    syntax = subprocess.run(["node", "--check", str(ROOT / "site.js")], capture_output=True, text=True)
    if syntax.returncode:
        errors.append(syntax.stderr.strip())

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print(f"PASS website: {len(pages)} pages, {len(ids)} products, JS syntax and local references")


if __name__ == "__main__":
    consolidate()
    smoke_test()
