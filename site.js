function toggleMenu(open){
  const d = document.getElementById('drawer');
  const o = document.getElementById('overlay');

  const willOpen = (typeof open === 'boolean') ? open : !d.classList.contains('open');

  if (willOpen) {
    d.classList.add('open');
    o.classList.add('open');
    document.body.classList.add('menu-open');
  } else {
    d.classList.remove('open');
    o.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
}

// ESC 關閉
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') toggleMenu(false);
});

// 點選選單項目後自動關閉（保留體驗）
document.addEventListener('click', (e)=>{
  const drawer = document.getElementById('drawer');
  if(!drawer) return;
  if(drawer.classList.contains('open') && e.target.tagName === 'A' && drawer.contains(e.target)){
    toggleMenu(false);
  }
});
