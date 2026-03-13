
async function getProducts(){
  const res = await fetch('products.json');
  return await res.json();
}

function renderProducts(products, targetId='products'){
  const grid = document.getElementById(targetId);
  if(!grid) return;
  grid.innerHTML = '';
  products.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <p class="size">${p.sizes.join(' / ')}</p>
      <a class="btn" href="product.html?id=${p.id}">查看詳情</a>
    `;
    grid.appendChild(card);
  });
}

function injectSchema(products){
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context":"https://schema.org",
    "@type":"ItemList",
    "name":"仙加味產品",
    "itemListElement": products.map((p,i)=>({
      "@type":"Product",
      "position":i+1,
      "name":p.name,
      "image":p.image,
      "description":p.desc
    }))
  });
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const products = await getProducts();

  if(document.getElementById('products')){
    renderProducts(products.filter(p=>p.series==='guilu'));
  }

  if(document.getElementById('productDetail')){
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const p = products.find(x=>x.id===id);
    const box = document.getElementById('productDetail');
    if(p){
      box.innerHTML = `
        <div class="detail-card">
          <img src="${p.image}" alt="${p.name}" class="detail-img">
          <h1>${p.name}</h1>
          <p>${p.desc}</p>
          <h3>規格</h3>
          <p>${p.sizes.join(' / ')}</p>
          <p><a class="btn" href="https://lin.ee/sHZW7NkR" target="_blank" rel="noopener">LINE洽詢</a></p>
          <p><a class="btn secondary" href="guilu-series.html">返回龜鹿系列</a></p>
        </div>
      `;
    } else {
      box.innerHTML = '<div class="detail-card"><h1>找不到產品</h1><p>請返回產品列表重新查看。</p></div>';
    }
  }

  injectSchema(products);
});
