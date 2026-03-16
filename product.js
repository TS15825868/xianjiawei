
(async function(){
  const mount = document.getElementById('product-app');
  if(!mount) return;
  const data = await fetch('products.json').then(r=>r.json());
  const id = new URLSearchParams(location.search).get('id') || 'guilu-gao';
  const product = data.products.find(p => p.id === id) || data.products[0];
  const q = (s) => document.querySelector(s);
  q('#product-title').textContent = product.name;
  q('#product-summary').textContent = product.summary;
  q('#product-image').src = product.image;
  q('#product-image').alt = '仙加味 ' + product.name;
  q('#product-sizes').textContent = product.sizes.join(' / ');
  q('#product-package').textContent = product.package;
  q('#product-ingredients').innerHTML = product.ingredients.map(x=>`<li>${x}</li>`).join('');
  q('#product-uses').innerHTML = product.uses.map(x=>`<li>${x}</li>`).join('');
  q('#product-recipes').innerHTML = product.recipes.map(x=>`<li>${x}</li>`).join('');
  document.title = product.name + '｜仙加味';
})();
