(function(){
  const body = document.body;
  const menuBtn = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('mobileMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuClose = document.getElementById('menuClose');

  function openMenu(){
    if(!menuPanel || !menuOverlay) return;
    menuPanel.classList.add('open');
    menuOverlay.classList.add('show');
    body.classList.add('menu-open');
    if(menuBtn) menuBtn.setAttribute('aria-expanded','true');
  }
  function closeMenu(){
    if(!menuPanel || !menuOverlay) return;
    menuPanel.classList.remove('open');
    menuOverlay.classList.remove('show');
    body.classList.remove('menu-open');
    if(menuBtn) menuBtn.setAttribute('aria-expanded','false');
  }
  if(menuBtn) menuBtn.addEventListener('click', ()=> menuPanel.classList.contains('open') ? closeMenu() : openMenu());
  if(menuClose) menuClose.addEventListener('click', closeMenu);
  if(menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  document.querySelectorAll('#mobileMenu a').forEach(link=>link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });

  document.querySelectorAll('.faq-item').forEach((item)=>{
    const btn = item.querySelector('.faq-question');
    if(!btn) return;
    btn.addEventListener('click', ()=> item.classList.toggle('open'));
  });

  const productRoot = document.getElementById('productDetail');
  if(productRoot){
    fetch('products.json')
      .then(r => r.json())
      .then(data => {
        const id = new URLSearchParams(window.location.search).get('id') || 'guilu-gao';
        const item = (data.products || []).find(p => p.id === id) || data.products[0];
        if(!item) return;
        document.title = `${item.name}｜仙加味`;
        const titleNode = document.querySelector('[data-product-title]');
        const leadNode = document.querySelector('[data-product-summary]');
        const imageNode = document.querySelector('[data-product-image]');
        const sizeNode = document.querySelector('[data-product-sizes]');
        const packageNode = document.querySelector('[data-product-package]');
        const ingredientNode = document.querySelector('[data-product-ingredients]');
        const usageNode = document.querySelector('[data-product-usage]');
        const recipeNode = document.querySelector('[data-product-recipes]');
        const altNode = document.querySelector('[data-product-alt]');
        const recipeLink = document.querySelector('[data-recipe-link]');
        if(titleNode) titleNode.textContent = item.name;
        if(leadNode) leadNode.textContent = item.summary;
        if(imageNode){ imageNode.src = item.image; imageNode.alt = item.name; }
        if(altNode) altNode.textContent = `${item.name}產品圖`;
        if(sizeNode) sizeNode.innerHTML = item.sizes.map(v=>`<span class="meta-pill">${v}</span>`).join('');
        if(packageNode) packageNode.textContent = item.package;
        if(ingredientNode) ingredientNode.innerHTML = (item.ingredients || []).map(v=>`<li>${v}</li>`).join('');
        if(usageNode) usageNode.innerHTML = (item.uses || []).map(v=>`<li>${v}</li>`).join('');
        if(recipeNode) recipeNode.innerHTML = (item.recipes || []).map(v=>`<li>${v}</li>`).join('');
        if(recipeLink) recipeLink.href = 'recipes.html';

        const breadcrumb = document.querySelector('[data-product-breadcrumb]');
        if(breadcrumb) breadcrumb.textContent = item.name;

        const ld = {
          '@context':'https://schema.org',
          '@type':'Product',
          name:item.name,
          image:[item.image],
          description:item.summary,
          brand:{'@type':'Brand',name:'仙加味'},
          category:'龜鹿系列食品'
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(ld);
        document.head.appendChild(script);
      })
      .catch(()=>{});
  }
})();
