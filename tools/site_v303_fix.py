from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
js_path = root / 'site.js'
js = js_path.read_text(encoding='utf-8')
js = js.replace("fetch('data.json?v=302.0')", "fetch('data.json?v=303.0')")

new_block = r'''const MASCOT_IMAGES = {
  welcome: 'images/brand/xianjiawei-scene-welcome.jpg?v=303.0',
  products: 'images/brand/xianjiawei-scene-products.jpg?v=303.0',
  guide: 'images/brand/xianjiawei-scene-guide.jpg?v=303.0',
  service: 'images/brand/xianjiawei-scene-service.jpg?v=303.0',
  usage: 'images/brand/xianjiawei-scene-usage.jpg?v=303.0'
};

function renderMascotGuide() {
  const page = document.body?.dataset?.page || '';
  const config = {
    home: {
      image: 'welcome', scene: 'welcome', eyebrow: '歡迎認識仙加味',
      title: '先從平常想怎麼使用開始',
      text: '固定安排、方便即飲、沖泡燉湯、家庭規格或自行調飲，都可以從日常習慣開始比較。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">認識產品</a>`
    },
    products: {
      image: 'products', scene: 'products', eyebrow: '產品導覽',
      title: '先看產品型態，再比較規格與使用方式',
      text: '龜鹿膏、龜鹿飲30cc、龜鹿湯塊、龜鹿膠與鹿茸粉，各有不同的日常使用情境。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="choose.html">怎麼選</a>`
    },
    choose: {
      image: 'guide', scene: 'guide', eyebrow: '怎麼選',
      title: '依使用情境比較，比只看品名更清楚',
      text: '想固定取用、方便即飲、沖泡燉湯、家庭使用或自行調飲，都能找到相對應的產品型態。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看全部產品</a>`
    },
    guide: {
      image: 'usage', scene: 'usage', eyebrow: '使用方式',
      title: '沖泡、即飲與燉湯方式一次整理',
      text: '依產品型態查看取用方式、使用時段、搭配方式與保存資訊。',
      actions: `${lineButton('怎麼使用', '怎麼使用')}<a class="btn btn-outline" href="faq.html">常見問題</a>`
    },
    recipes: {
      image: 'usage', scene: 'usage', eyebrow: '料理搭配',
      title: '讓產品自然放進熟悉的飲食節奏',
      text: '從熱飲、調飲到家常燉湯，依產品型態查看適合的料理與搭配方式。',
      actions: `${lineButton('料理搭配', '料理搭配')}<a class="btn btn-outline" href="guide.html">使用方式</a>`
    },
    brand: {
      image: 'welcome', scene: 'welcome', eyebrow: '品牌故事',
      title: '從萬華出發，延續四代對工序與信用的重視',
      text: '把多年累積的原料與龜鹿工序經驗，整理成今天容易理解的產品資訊。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="contact.html">聯絡我們</a>`
    },
    faq: {
      image: 'service', scene: 'service', eyebrow: '常見問題',
      title: '產品差異、使用方式與購買流程一次整理',
      text: '需要確認規格、數量、配送或付款方式時，可再由官方 LINE 協助。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    contact: {
      image: 'service', scene: 'service', eyebrow: '門市與官方 LINE',
      title: '留下想了解的產品、規格或取貨方式',
      text: '我們會依實際庫存、配送與門市安排協助確認。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="#store-info">門市資訊</a>`
    }
  }[page];

  if (!config || document.getElementById('mascot-guide')) return;
  const hero = document.querySelector('main .hero');
  if (!hero) return;
  const section = document.createElement('section');
  section.id = 'mascot-guide';
  section.className = 'section mascot-guide-section';
  section.innerHTML = `
    <article class="mascot-guide-card mascot-guide-card--${config.scene} reveal">
      <div class="mascot-guide-card__media">
        <img src="${MASCOT_IMAGES[config.image]}" alt="仙加味小老闆情境導覽" width="960" height="1200" loading="${page === 'home' ? 'eager' : 'lazy'}" decoding="async">
      </div>
      <div class="mascot-guide-card__copy">
        <p class="eyebrow">${config.eyebrow}</p>
        <h2>${config.title}</h2>
        <p>${config.text}</p>
        <div class="hero-actions">${config.actions}</div>
      </div>
    </article>
  `;
  hero.insertAdjacentElement('afterend', section);
}'''
pattern = re.compile(r"const MASCOT_IMAGES = \{.*?\n\}\n\nfunction renderHome\(\) \{", re.S)
js, count = pattern.subn(new_block + "\n\nfunction renderHome() {", js, count=1)
if count != 1:
    raise SystemExit('找不到既有小老闆區塊')
js_path.write_text(js, encoding='utf-8')

css_path = root / 'site.css'
css = css_path.read_text(encoding='utf-8')
css = re.sub(r"/\* v300\.5 仙加味小老闆 \*/.*\Z", "", css, flags=re.S).rstrip()
css += r'''

/* v303｜仙加味小老闆情境卡 */
.mascot-guide-section{padding-top:0}
.mascot-guide-card{position:relative;display:grid;grid-template-columns:minmax(300px,42%) minmax(0,1fr);min-height:350px;overflow:hidden;padding:0;background:linear-gradient(135deg,#fffaf2 0%,#f4ead8 100%);border:1px solid rgba(123,30,30,.14);border-radius:28px;box-shadow:0 18px 44px rgba(55,38,22,.12)}
.mascot-guide-card__media{position:relative;min-height:350px;overflow:hidden;background:#e9dfcf}
.mascot-guide-card__media::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 58%,rgba(248,241,228,.93) 100%);pointer-events:none}
.mascot-guide-card__media img{display:block;width:100%;height:100%;min-height:350px;object-fit:cover;object-position:center 42%;background:#e9dfcf}
.mascot-guide-card__copy{position:relative;z-index:1;align-self:center;padding:clamp(28px,4vw,58px)}
.mascot-guide-card__copy h2{max-width:15em;color:var(--brand)}
.mascot-guide-card__copy p:not(.eyebrow){max-width:680px;color:#4b5563}
.mascot-guide-card--products .mascot-guide-card__media img{object-position:center 46%}
.mascot-guide-card--guide .mascot-guide-card__media img{object-position:center 44%}
.mascot-guide-card--usage .mascot-guide-card__media img{object-position:center 48%}
.mascot-guide-card--service .mascot-guide-card__media img{object-position:center 43%}
@media(max-width:760px){.mascot-guide-card{grid-template-columns:1fr;min-height:0;border-radius:22px}.mascot-guide-card__media{min-height:0;height:250px}.mascot-guide-card__media::after{background:linear-gradient(180deg,transparent 52%,rgba(248,241,228,.94) 100%)}.mascot-guide-card__media img{min-height:0;height:250px;object-position:center 38%}.mascot-guide-card__copy{padding:22px 20px 26px;margin-top:-18px}.mascot-guide-card__copy h2{font-size:clamp(22px,7vw,30px)}}
'''
css_path.write_text(css + '\n', encoding='utf-8')

replacements = {
  '五大產品型態與六項規格': '五大產品型態與五項規格',
  '五大產品型態與六項產品規格': '五大產品型態與五項產品規格',
  '快速掌握五大產品型態與六項規格': '快速掌握五大產品型態與五項規格',
  '兩種龜鹿飲': '龜鹿飲30cc',
  '龜鹿飲另有30cc兩種規格': '龜鹿飲為30cc玻璃瓶規格',
  '龜鹿飲30cc玻璃瓶與30cc玻璃瓶也一併整理，完整呈現兩種規格，便於比較容量與使用情境。': '龜鹿飲為30cc玻璃瓶，適合輕巧即飲、外出攜帶與工作空檔安排。',
  '規格：30cc玻璃瓶／30cc玻璃瓶。': '規格：30cc／瓶（玻璃瓶）。',
  '30cc玻璃瓶適合輕巧即飲、外出與工作空檔；30cc玻璃瓶適合想一次安排一份龜鹿飲的人。': '30cc玻璃瓶適合輕巧即飲、外出攜帶與工作空檔安排。',
  '龜鹿膏、龜鹿飲30cc、龜鹿湯塊75g、龜鹿膠600g及鹿茸粉75g，快速掌握五大產品型態與六項規格。': '龜鹿膏100g、龜鹿飲30cc、龜鹿湯塊75g、龜鹿膠600g及鹿茸粉75g，快速掌握五大產品型態與五項規格。'
}
for html in root.glob('*.html'):
    text = html.read_text(encoding='utf-8')
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = text.replace('site.css?v=302.0', 'site.css?v=303.0').replace('site.js?v=302.0', 'site.js?v=303.0')
    html.write_text(text, encoding='utf-8')

products = root / 'products.html'
text = products.read_text(encoding='utf-8')
schema = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","name":"仙加味五大產品型態與五項規格","itemListElement":[{"@type":"ListItem","position":1,"name":"龜鹿膏100g","url":"https://ts15825868.github.io/xianjiawei/product-guilu-gao.html"},{"@type":"ListItem","position":2,"name":"龜鹿飲30cc玻璃瓶","url":"https://ts15825868.github.io/xianjiawei/product-guilu-drink-30cc.html"},{"@type":"ListItem","position":3,"name":"龜鹿湯塊75g","url":"https://ts15825868.github.io/xianjiawei/product-guilu-tangkuai.html"},{"@type":"ListItem","position":4,"name":"龜鹿膠600g","url":"https://ts15825868.github.io/xianjiawei/product-guilu-jiao.html"},{"@type":"ListItem","position":5,"name":"鹿茸粉75g","url":"https://ts15825868.github.io/xianjiawei/product-luerong-fen.html"}]}</script>'
text = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema\.org","@type":"ItemList".*?</script>', schema, text, count=1)
text = text.replace('仙加味將傳統龜鹿食補整理為固定取用、方便即飲、沖泡燉湯、傳統大規格與自行調飲五個方向；龜鹿飲為30cc玻璃瓶規格。', '仙加味將傳統龜鹿食補整理為固定取用、方便即飲、沖泡燉湯、傳統大規格與自行調飲五個方向。')
products.write_text(text, encoding='utf-8')

bad = ['180cc','180 cc','30cc玻璃瓶／30cc','product-guilu-drink-.html','六項規格','兩種龜鹿飲']
files = [*root.glob('*.html'), root/'site.js', root/'data.json']
found=[]
for p in files:
    if not p.exists(): continue
    txt=p.read_text(encoding='utf-8')
    for term in bad:
        if term in txt: found.append(f'{p.name}:{term}')
if found:
    raise SystemExit('仍有錯誤公開內容：' + ', '.join(found))
