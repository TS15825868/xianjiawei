
window.PRODUCTS = {
  "guilu-gao": {
    "name": "龜鹿膏",
    "spec": "100 g",
    "packaging": "玻璃罐",
    "image": "images/guilu-gao-100g.jpg",
    "summary": "濃縮膏狀型態，適合直接食用或加入溫水。",
    "how": [
      "直接食用",
      "加入溫水",
      "依個人習慣搭配熱飲"
    ],
    "recipes": [
      "可作為日常飲食搭配參考"
    ]
  },
  "guilu-drink": {
    "name": "龜鹿飲",
    "spec": "30 cc / 180 cc",
    "packaging": "30 cc 玻璃瓶 / 180 cc 鋁袋",
    "image": "images/guilu-drink-180cc.jpg",
    "summary": "即飲型態，方便日常飲用。",
    "how": [
      "開封即飲",
      "隔水加熱後飲用",
      "可倒入杯中加熱後飲用"
    ],
    "recipes": [
      "可作為日常飲食搭配參考"
    ]
  },
  "guilu-cube": {
    "name": "龜鹿湯塊",
    "spec": "75 g / 300 g / 600 g",
    "packaging": "盒裝",
    "image": "images/guilu-block-75g.jpg",
    "summary": "適合燉煮料理的湯塊型態。",
    "how": [
      "加入雞湯或排骨湯燉煮",
      "依個人習慣調整濃淡"
    ],
    "recipes": [
      "龜鹿雞湯",
      "龜鹿排骨湯",
      "龜鹿燉雞"
    ]
  },
  "deer-antler": {
    "name": "鹿茸粉",
    "spec": "75 g",
    "packaging": "白色塑膠罐",
    "image": "images/lurong-powder-75g.jpg",
    "summary": "粉末型態，可加入茶、咖啡或熱飲。",
    "how": [
      "加入茶",
      "加入咖啡",
      "加入熱飲"
    ],
    "recipes": [
      "可作為飲品搭配參考"
    ]
  }
};

(function() {
  const container = document.getElementById('productRoot');
  if (!container) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'guilu-gao';
  const p = window.PRODUCTS[id];
  if (!p) return;

  document.title = `${p.name}｜仙加味`;
  const title = document.getElementById('productTitle');
  const intro = document.getElementById('productSummary');
  const image = document.getElementById('productImage');
  const spec = document.getElementById('productSpec');
  const packaging = document.getElementById('productPackaging');
  const how = document.getElementById('productHow');
  const recipes = document.getElementById('productRecipes');

  title.textContent = p.name;
  intro.textContent = p.summary;
  image.src = p.image;
  image.alt = p.name;
  spec.textContent = p.spec;
  packaging.textContent = p.packaging;
  how.innerHTML = p.how.map(x => `<li>${x}</li>`).join('');
  recipes.innerHTML = p.recipes.map(x => `<li>${x}</li>`).join('');

  const schema = {
    "@context":"https://schema.org",
    "@type":"Product",
    "name":`仙加味 ${p.name}`,
    "image":`$https://ts15825868.github.io/TaiShing/${p.image}`,
    "description":p.summary,
    "brand":{"@type":"Brand","name":"仙加味"},
    "size":p.spec
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(schema);
  document.head.appendChild(s);
})();
