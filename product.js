(async function(){

const params = new URLSearchParams(location.search);
let currentId = params.get('id');

const res = await fetch('products.json');
const data = await res.json();
const products = data.products || [];

if(!currentId) currentId = products[0].id;

const el = {
  image: document.getElementById('product-image'),
  title: document.getElementById('product-title'),
  summary: document.getElementById('product-summary'),
  sizes: document.getElementById('product-sizes'),
  pack: document.getElementById('product-package'),
  ingredients: document.getElementById('product-ingredients'),
  uses: document.getElementById('product-uses'),
  line: document.getElementById('product-line'),
  tabs: document.getElementById('product-tabs'),
  extra: document.getElementById('product-extra'),
  related: document.getElementById('related-products')
};

// 中文標題
function getTitle(url){
  if(typeof ARTICLES !== 'undefined'){
    const m = ARTICLES.find(a=>a.url===url);
    if(m) return m.title;
  }
  return url.replace('.html','').replaceAll('-',' ');
}

// 中文摘要
function getSummary(url){
  if(typeof ARTICLES !== 'undefined'){
    const m = ARTICLES.find(a=>a.url===url);
    if(m) return m.summary || '查看內容';
  }
  return '查看內容';
}

function render(p){

  el.image.src = p.image;
  el.title.textContent = p.name;
  el.summary.textContent = p.desc;

  el.sizes.textContent = p.sizes.join(' / ');
  el.pack.textContent = p.package;

  el.ingredients.innerHTML =
    p.ingredients.map(i=>`<li>${i}</li>`).join('');

  el.uses.innerHTML =
    p.uses.map(i=>`<li>${i}</li>`).join('');

  el.line.href =
    `https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想詢問 ${p.name}`)}`;

  history.replaceState(null,'',`?id=${p.id}`);

  // 文章
  el.extra.innerHTML = `
    <h2>相關文章</h2>
    <div class="product-grid">
      ${p.articles.map(u=>`
        <a href="articles/${u}" class="product-card">
          <h3>${getTitle(u)}</h3>
          <p>${getSummary(u)}</p>
        </a>
      `).join('')}
    </div>

    <h2 style="margin-top:30px">搭配方式</h2>
    <div class="product-grid">
      ${p.recipes.map(u=>`
        <a href="articles/${u}" class="product-card">
          <h3>${getTitle(u)}</h3>
          <p>${getSummary(u)}</p>
        </a>
      `).join('')}
    </div>
  `;

  // 推薦
  const others = products.filter(x=>x.id!==p.id).slice(0,3);
  el.related.innerHTML = `
    <h2>你也可以看看</h2>
    <div class="product-grid">
      ${others.map(o=>`
        <a href="?id=${o.id}" class="product-card">
          <img src="${o.image}">
          <h3>${o.name}</h3>
        </a>
      `).join('')}
    </div>
  `;
}

// 切換列
el.tabs.innerHTML = products.map(p=>`
  <div class="product-card" style="min-width:140px;cursor:pointer"
    onclick="switchProduct('${p.id}')">
    <img src="${p.image}">
    <h3>${p.name}</h3>
  </div>
`).join('');

window.switchProduct = id=>{
  const p = products.find(x=>x.id===id);
  render(p);
};

render(products.find(x=>x.id===currentId));

})();
