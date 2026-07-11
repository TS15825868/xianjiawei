from pathlib import Path
import json
import re

VERSION = "400.0"

# 1. 網站專用圖：沿用既有插入與文案邏輯，只把圖片切成網站獨立素材。
p = Path("site-fix-v317.js")
s = p.read_text(encoding="utf-8")
s = re.sub(r'const VERSION = "[^"]+";', f'const VERSION = "{VERSION}";', s, count=1)
replacements = {
    'home': 'images/brand/website-mascot-home.jpg',
    'products': 'images/brand/website-mascot-products.jpg',
    'choose': 'images/brand/website-mascot-choose.jpg',
    'combo': 'images/brand/website-mascot-combo.jpg',
    'guide': 'images/brand/website-mascot-guide.jpg',
    'recipes': 'images/brand/website-mascot-recipes.jpg',
    'faq': 'images/brand/website-mascot-faq.jpg',
    'contact': 'images/brand/website-mascot-contact.jpg',
    'brand': 'images/brand/website-mascot-brand.jpg',
}
for page, image in replacements.items():
    pattern = rf'({page}:\s*\{{\s*\n\s*src:\s*")[^"]+("\s*,)'
    s, count = re.subn(pattern, rf'\1{image}\2', s, count=1)
    if count != 1:
        raise SystemExit(f"找不到 site-fix 頁面設定：{page}")
s = s.replace('image.width = 1200;', 'image.width = 1448;')
s = s.replace('image.height = 900;', 'image.height = 1086;')
s = re.sub(
    r'image\.src = `images/brand/[^`]+\?v=\$\{VERSION\}`;',
    'image.src = `images/brand/website-mascot-home.jpg?v=${VERSION}`;',
    s,
)
p.write_text(s, encoding="utf-8")

# 2. 核心備援也只用網站專用圖，避免再抓 LINE OA 圖。
p = Path("site-core.js")
s = p.read_text(encoding="utf-8")
block = """const MASCOT_IMAGES = {
  welcome: 'images/brand/website-mascot-home.jpg?v=400.0',
  products: 'images/brand/website-mascot-products.jpg?v=400.0',
  guide: 'images/brand/website-mascot-choose.jpg?v=400.0',
  combo: 'images/brand/website-mascot-combo.jpg?v=400.0',
  usage: 'images/brand/website-mascot-guide.jpg?v=400.0',
  recipes: 'images/brand/website-mascot-recipes.jpg?v=400.0',
  faq: 'images/brand/website-mascot-faq.jpg?v=400.0',
  service: 'images/brand/website-mascot-contact.jpg?v=400.0',
  brand: 'images/brand/website-mascot-brand.jpg?v=400.0'
};"""
s, count = re.subn(r"const MASCOT_IMAGES = \{.*?\n\};", block, s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("找不到 site-core MASCOT_IMAGES")
s = s.replace("image: 'products', scene: 'products', eyebrow: '搭配組合'", "image: 'combo', scene: 'combo', eyebrow: '搭配組合'")
s = s.replace("image: 'usage', scene: 'usage', eyebrow: '料理搭配'", "image: 'recipes', scene: 'recipes', eyebrow: '料理搭配'")
s = s.replace("image: 'service', scene: 'service', eyebrow: '常見問題'", "image: 'faq', scene: 'faq', eyebrow: '常見問題'")
s = s.replace("image: 'welcome', scene: 'welcome', eyebrow: '品牌故事'", "image: 'brand', scene: 'brand', eyebrow: '品牌故事'")
p.write_text(s, encoding="utf-8")

# 3. 強制更新瀏覽器快取版本。
p = Path("site.js")
s = p.read_text(encoding="utf-8")
s = re.sub(r'v=\d+(?:\.\d+)*', f'v={VERSION}', s)
s = s.replace('網站專用小老闆情境圖', '網站專用高解析小老闆情境圖')
p.write_text(s, encoding="utf-8")

# 4. 記錄正式版本。
Path("deploy-version.json").write_text(json.dumps({
    "version": VERSION,
    "updated": "2026-07-11",
    "mascot": "separate-high-resolution-website-and-line-oa-sets",
    "websiteMascotScenes": list(replacements.keys()),
    "lineMascotScenes": ["welcome", "products", "recommend", "combo", "usage", "faq", "service", "brand", "cart"],
    "resolution": "1448x1086",
    "catalog": "five-types-six-specifications"
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
