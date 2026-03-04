function toggleMenu(){
  const drawer = document.getElementById('drawer');
  const body = document.body;
  const btn = document.querySelector('.hamburger');

  drawer.classList.toggle('open');

  const isOpen = drawer.classList.contains('open');
  if(btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

  if(isOpen){
    body.classList.add('drawer-open');
    openOverlay();
  }else{
    closeMenu();
  }
}

function openOverlay(){
  let overlay = document.querySelector('.drawer-overlay');

  if(!overlay){
    overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeMenu);
  }

  requestAnimationFrame(()=> overlay.classList.add('open'));
}

function closeOverlay(){
  const overlay = document.querySelector('.drawer-overlay');
  if(overlay) overlay.classList.remove('open');
}

function closeMenu(){
  const drawer = document.getElementById('drawer');
  const body = document.body;
  const btn = document.querySelector('.hamburger');

  drawer.classList.remove('open');
  body.classList.remove('drawer-open');
  closeOverlay();

  if(btn) btn.setAttribute('aria-expanded', 'false');
}

/* ESC 關閉 */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') closeMenu();
});

/* 點選單連結後自動關閉（手機體感更好） */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('#drawer a');
  if(a) closeMenu();
});
