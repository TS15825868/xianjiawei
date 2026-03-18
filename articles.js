const container = document.getElementById('article-grid');

if(container && typeof ARTICLES !== 'undefined'){
  container.innerHTML = ARTICLES.map(a => `
    <a href="articles/${a.url}" class="product-card scroll-card">
      <img src="${a.image}" alt="${a.title}" loading="lazy">
      <h3>${a.title}</h3>
      <p>${a.summary || '查看內容'}</p>
    </a>
  `).join('');
}
