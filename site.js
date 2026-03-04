
function closeMenu(){
  const nav = document.getElementById('nav');
  if(!nav) return;
  if(!nav.classList.contains('open')) return;

  nav.classList.remove('open');

  // unlock background scroll (iOS friendly)
  document.body.classList.remove('menu-open');
  const y = Math.abs(parseInt(document.body.style.top || '0',10)) || (window.__scrollY||0);
  document.body.style.top = '';
  window.scrollTo(0, y);
}

function toggleMenu(){
  const nav=document.getElementById('nav');
  if(!nav) return;
  const willOpen = !nav.classList.contains('open');
  nav.classList.toggle('open');
  if(willOpen){
    // lock background scroll (iOS friendly)
    window.__scrollY = window.scrollY || 0;
    document.body.classList.add('menu-open');
    document.body.style.top = `-${window.__scrollY}px`;
  }else{
    // unlock background scroll
    document.body.classList.remove('menu-open');
    const y = Math.abs(parseInt(document.body.style.top || '0',10)) || (window.__scrollY||0);
    document.body.style.top = '';
    window.scrollTo(0, y);
  }
}
function openModal(id){
document.getElementById(id).style.display='flex';
}
function closeModal(id){
document.getElementById(id).style.display='none';
}


// vFinal enhancements
document.addEventListener('click', (e)=>{
  const nav=document.getElementById('nav');
  const hb=document.querySelector('.hamburger');
  if(!nav || !hb) return;
  const clickedInsideNav = nav.contains(e.target);
  const clickedHamburger = hb.contains(e.target);
  if(nav.classList.contains('open') && !clickedInsideNav && !clickedHamburger){
    closeMenu();
  }
});
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){
    // close nav
    const nav=document.getElementById('nav');
    if(nav) closeMenu();
    // close any open modal
    document.querySelectorAll('.modal').forEach(m=>{
      if(getComputedStyle(m).display!=='none'){ m.style.display='none'; }
    });
  }
});
document.querySelectorAll('.modal').forEach(m=>{
  m.addEventListener('click',(e)=>{
    if(e.target===m){ m.style.display='none'; }
  });
});


document.addEventListener('DOMContentLoaded', ()=>{
  // Close menu when clicking a link
  const nav = document.getElementById('nav');
  if(nav){
    nav.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', ()=>{ closeMenu(); });
    });
  }

  // Insert back/home helper bar for better UX
  const isHome = /(^|\/)index\.html$/.test(location.pathname) || location.pathname.endsWith('/TaiShing/') || location.pathname.endsWith('/TaiShing');
  if(!isHome){
    const main = document.querySelector('main');
    if(main){
      const bar = document.createElement('div');
      bar.className = 'nav-assist';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'nav-assist-btn';
      back.textContent = '← 返回上一頁';
      back.addEventListener('click', ()=>{
        if(history.length>1){ history.back(); }
        else{ location.href='index.html'; }
      });
      const home = document.createElement('a');
      home.className = 'nav-assist-link';
      home.href = 'index.html';
      home.textContent = '回首頁';
      bar.appendChild(back);
      bar.appendChild(home);
      // put at top of main
      main.insertBefore(bar, main.firstChild);
    }
  }
});
