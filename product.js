(function(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const el = {
    image: document.getElementById('product-image'),
    title: document.getElementById('product-title'),
    summary: document.getElementById('product-summary'),
    sizes: document.getElementById('product-sizes'),
    pack: document.getElementById('product-package'),
    ingredients: document.getElementById('product-ingredients'),
    uses: document.getElementById('product-uses'),
    breadcrumb: document.getElementById('breadcrumb-product'),
    line: document.getElementById('product-line'),
    extra: document.getElementById('product-extra')
  };

  function escapeHtml(str=''){
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function titleFromSlug(url){
    const slug = (url || '').split('/').pop();
    if(typeof ARTICLES !== 'undefined' && Array.isArray(ARTICLES)){
      const match = ARTICLES.find(a => a.url === slug);
      if(match) return match.title;
    }
    return slug.replace('.html','').replaceAll('-',' ');
  }

  function articleSummary(url){
    if(typeof ARTICLES !== 'undefined' && Array.isArray(ARTICLES)){
      const match = ARTICLES.find(a => a.url === url);
      if(match) return match.summary || '查看內容';
    }
    return '查看內容';
  }

  function cardLink(url, label, desc){
    return `<a href="articles/${url}" class="product-card"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(desc)}</p></a>`;
  }

  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      const products = Array.isArray(data?.products) ? data.products : [];
      const product = products.find(item => item.id === id) || products[0];
      if(!product) return;

      document.title = `${product.name}｜仙加味`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if(metaDesc && product.desc) metaDesc.setAttribute('content', product.desc);

      if(el.breadcrumb) el.breadcrumb.textContent = product.name;
      if(el.image){
        el.image.src = product.image || 'images/logo-seal.png';
        el.image.alt = `仙加味 ${product.name}`;
      }
      if(el.title) el.title.textContent = product.name;
      if(el.summary) el.summary.textContent = product.desc || '';
      if(el.sizes) el.sizes.textContent = Array.isArray(product.sizes) ? product.sizes.join(' / ') : '—';
      if(el.pack) el.pack.textContent = product.package || '—';
      if(el.line) el.line.href = `https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想詢問 ${product.name}`)}`;
      if(el.ingredients){
        const list = Array.isArray(product.ingredients) ? product.ingredients : [];
        el.ingredients.innerHTML = list.length ? list.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>請透過 LINE 詢問成份資訊</li>';
      }
      if(el.uses){
        const list = Array.isArray(product.uses) ? product.uses : [];
        el.uses.innerHTML = list.length ? list.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>請透過 LINE 詢問食用方式</li>';
      }

      if(el.extra){
        const sections = [];
        if(Array.isArray(product.articles) && product.articles.length){
          sections.push(`
            <section class="info-card reveal">
              <h3>相關文章</h3>
              <div class="product-grid" style="margin-top:16px;">
                ${product.articles.map(url => cardLink(url, titleFromSlug(url), articleSummary(url))).join('')}
              </div>
            </section>`);
        }
        if(Array.isArray(product.recipes) && product.recipes.length){
          sections.push(`
            <section class="info-card reveal" style="margin-top:18px;">
              <h3>搭配方式</h3>
              <div class="product-grid" style="margin-top:16px;">
                ${product.recipes.map(url => cardLink(url, titleFromSlug(url), articleSummary(url))).join('')}
              </div>
            </section>`);
        }
        const relatedProducts = products.filter(item => item.id !== product.id).slice(0,3);
        if(relatedProducts.length){
          sections.push(`
            <section class="info-card reveal" style="margin-top:18px;">
              <h3>你也可以看看</h3>
              <div class="product-grid" style="margin-top:16px;">
                ${relatedProducts.map(item => `
                  <a href="product.html?id=${item.id}" class="product-card">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy">
                    <h3>${escapeHtml(item.name)}</h3>
                    <p>${escapeHtml(item.desc || '')}</p>
                  </a>`).join('')}
              </div>
            </section>`);
        }
        el.extra.innerHTML = sections.join('');
      }

      const schema = {
        '@context':'https://schema.org',
        '@type':'Product',
        name:product.name,
        description:product.desc || '',
        image:product.seoImage || product.image,
        sku:product.id,
        brand:{'@type':'Brand',name:'仙加味'},
        url:location.href,
        offers:{'@type':'Offer',price:'0',priceCurrency:'TWD',availability:'https://schema.org/InStock'}
      };
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);

      setTimeout(()=>{
        document.querySelectorAll('.reveal').forEach(node => node.classList.add('show'));
      }, 60);
    })
    .catch(err => console.error('products.json 讀取失敗:', err));
})();
