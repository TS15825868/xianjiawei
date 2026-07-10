from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
site = ROOT / 'site.js'
text = site.read_text(encoding='utf-8')

# 統一新版快取版本；正式圖片仍採獨立檔案，不以同一張圖裁切。
text = re.sub(r'data\.json\?v=[0-9.]+', 'data.json?v=306.0', text)
text = re.sub(r'xianjiawei-scene-([a-z]+)\.jpg\?v=[0-9.]+', r'xianjiawei-scene-\1.jpg?v=306.0', text)

# 搭配組合頁也使用產品介紹情境，避免頁面缺少固定角色導覽。
if "combo: {\n      image: 'products'" not in text:
    marker = "    guide: {\n      image: 'usage'"
    block = """    combo: {
      image: 'products', scene: 'products', eyebrow: '搭配組合',
      title: '依生活節奏查看適合的產品搭配',
      text: '先看產品型態、使用方式與份量，再依實際需求選擇組合；價格與活動以正式方案為準。',
      actions: `${lineButton('搭配組合', '搭配組合')}<a class=\"btn btn-outline\" href=\"products.html\">先看產品</a>`
    },
"""
    if marker not in text:
        raise SystemExit('找不到 guide 設定插入位置')
    text = text.replace(marker, block + marker, 1)

# 圖片尺寸描述改為目前網站卡片比例，瀏覽器仍以 contain 完整顯示。
text = text.replace('width="960" height="1200"', 'width="640" height="480"')
site.write_text(text, encoding='utf-8')

# 全站 HTML 快取版本同步。
for path in ROOT.glob('*.html'):
    html = path.read_text(encoding='utf-8')
    html = re.sub(r'site\.css\?v=[0-9.]+', 'site.css?v=306.0', html)
    html = re.sub(r'site\.js\?v=[0-9.]+', 'site.js?v=306.0', html)
    path.write_text(html, encoding='utf-8')

css = ROOT / 'site.css'
css_text = css.read_text(encoding='utf-8')
marker = '/* v306｜仙加味小老闆完整圖片顯示 */'
if marker not in css_text:
    css_text += '''\n\n/* v306｜仙加味小老闆完整圖片顯示 */\n.mascot-guide-card__media{background:#f5ede0!important;overflow:hidden!important}\n.mascot-guide-card__media::after{display:none!important;content:none!important}\n.mascot-guide-card__media img{width:100%!important;height:auto!important;min-height:0!important;object-fit:contain!important;object-position:center!important;opacity:1!important;filter:none!important;mix-blend-mode:normal!important}\n@media(max-width:760px){.mascot-guide-card__media{height:auto!important;min-height:0!important}.mascot-guide-card__media img{height:auto!important;aspect-ratio:auto!important}.mascot-guide-card__copy{margin-top:0!important}}\n'''
css.write_text(css_text, encoding='utf-8')

# 驗證五張正式情境圖存在。
for name in ('welcome', 'products', 'guide', 'service', 'usage'):
    path = ROOT / 'images' / 'brand' / f'xianjiawei-scene-{name}.jpg'
    if not path.exists():
        raise SystemExit(f'缺少正式小老闆圖片：{path}')
