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
  related: document.getElementById('related-products'),
  extra: document.getElementById('product-extra')
};

// ✅ 中文標題
function getArticleTitle(url){
  if(typeof ARTICLES !== 'undefined'){
    const match = ARTICLES.find(a => a.url === url);
    if(match) return match.title;
  }
  return url.replace('.html','').replaceAll('-',' ');
}

// ✅ 中文摘要
function getArticleSummary(url){
  if(typeof ARTICLES !== 'undefined'){
    const match = ARTICLES.find(a => a.url === url);
    if(match) return match.summary || '查看內容';
  }
  return '查看內容';
}

function renderProduct(product){

  el.image.src = product.image;
  el.title.textContent = product.name;
  el.summary.textContent = product.desc;

  el.sizes.textContent = product.sizes.join(' / ');
  el.pack.textContent = product.package;

  el.ingredients.innerHTML =
    product.ingredients.map(i=>`<li>${i}</li>`).join('');

  el.uses.innerHTML =
    product.uses.map(i=>`<li>${i}</li>`).join('');

  el.line.href =
    `https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想詢問 ${product.name}`)}`;

  history.replaceState(null,'',`?id=${product.id}`);

  // 🔥 文章
  if(el.extra){
    el.extra.innerHTML = `
      <h2>相關文章</h2>
      <div class="product-grid">
        ${product.articles.map(url=>`
          <a href="articles/${url}" class="product-card">
            <h3>${getArticleTitle(url)}</h3>
            <p>${getArticleSummary(url)}</p>
          </a>
        `).join('')}
      </div>

      <h2 style="margin-top:30px">搭配方式</h2>
      <div class="product-grid">
        ${product.recipes.map(url=>`
          <a href="articles/${url}" class="product-card">
            <h3>${getArticleTitle(url)}</h3>
            <p>${getArticleSummary(url)}</p>
          </a>
        `).join('')}
      </div>
    `;
  }
}

// 🔥 商品切換
el.tabs.innerHTML = products.map(p => `
  <div class="product-card"
    style="min-width:140px;cursor:pointer"
    onclick="switchProduct('${p.id}')">
    <img src="${p.image}">
    <h3>${p.name}</h3>
  </div>
`).join('');

window.switchProduct = function(id){
  const product = products.find(p=>p.id===id);
  renderProduct(product);
};

const first = products.find(p=>p.id===currentId);
renderProduct(first);

})();
