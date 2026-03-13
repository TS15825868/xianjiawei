const drawer = document.getElementById('drawer');
const menuBtn = document.querySelector('.menu-btn');
const modal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');

function toggleMenu(){
  if(!drawer) return;
  const isOpen = drawer.classList.toggle('open');
  document.body.classList.toggle('menu-open', isOpen);
  if(menuBtn) menuBtn.setAttribute('aria-expanded', String(isOpen));
}

function closeMenu(){
  if(!drawer) return;
  drawer.classList.remove('open');
  document.body.classList.remove('menu-open');
  if(menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
}

function openModal(product){
  if(!modal || !modalBody || !product) return;
  modalBody.innerHTML = `
    <div class="modal-body">
      <div class="modal-media">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="modal-content">
        <h3>${product.name}</h3>
        <div class="modal-tags">${(product.tags || []).map(t=>`<span>${t}</span>`).join('')}</div>
        <p>${product.detail || product.desc || ''}</p>
        <p><strong>規格：</strong>${(product.sizes || []).join(' / ')}</p>
        <a class="btn primary" href="https://lin.ee/sHZW7NkR" target="_blank" rel="noopener">LINE 詢問</a>
      </div>
    </div>`;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal(){
  if(!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

async function renderProducts(){
  const grid = document.getElementById('productGrid');
  if(!grid) return;
  try{
    const res = await fetch('products.json');
    const products = await res.json();
    grid.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-img-wrap">
          <img class="product-img" src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.desc}</div>
        <div class="product-size">${(product.sizes || []).map(size => `<span class="size-chip">${size}</span>`).join('')}</div>
      `;
      card.addEventListener('click', () => openModal(product));
      grid.appendChild(card);
    });
  }catch(error){
    grid.innerHTML = '<p>產品資料載入中發生問題，請稍後再試。</p>';
    console.error(error);
  }
}

function setupRecommend(){
  const buttons = document.querySelectorAll('[data-recommend]');
  const result = document.getElementById('recommendResult');
  if(!buttons.length || !result) return;
  const map = {
    fast: {
      title: '推薦：龜鹿飲',
      body: '想要快速、方便、好攜帶的型態，龜鹿飲最適合。30cc 與 180cc 可依日常習慣與使用情境選擇。'
    },
    daily: {
      title: '推薦：龜鹿膏',
      body: '想要固定日常搭配、偏好膏狀型態，建議選擇龜鹿膏。現在規格統一為 100g，結構更清楚。'
    },
    cooking: {
      title: '推薦：龜鹿膠湯塊',
      body: '若你偏好燉湯、雞湯、排骨湯等料理方式，龜鹿膠湯塊最自然。現有 75g、300g、600g 規格。'
    }
  };
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.recommend;
      result.innerHTML = `<h3>${map[key].title}</h3><p>${map[key].body}</p>`;
    });
  });
}

document.addEventListener('click', (event) => {
  if(drawer && drawer.classList.contains('open')){
    const clickedInsideDrawer = drawer.contains(event.target);
    const clickedMenuBtn = menuBtn && menuBtn.contains(event.target);
    if(!clickedInsideDrawer && !clickedMenuBtn) closeMenu();
  }
  if(event.target === modal) closeModal();
});

document.addEventListener('keydown', (event) => {
  if(event.key === 'Escape'){
    closeMenu();
    closeModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupRecommend();
});
