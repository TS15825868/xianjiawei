function toggleMenu(open){
  const d = document.getElementById('drawer');
  const o = document.getElementById('overlay');

  if(!d || !o) return;

  const willOpen = (typeof open === 'boolean') ? open : !d.classList.contains('open');

  if(willOpen){
    d.classList.add('open');
    o.classList.add('open');
    document.body.classList.add('menu-open');
    d.setAttribute('aria-hidden', 'false');
  }else{
    d.classList.remove('open');
    o.classList.remove('open');
    document.body.classList.remove('menu-open');
    d.setAttribute('aria-hidden', 'true');
  }
}

function markCurrentPage(){
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('a[href]').forEach((link)=>{
    const href = link.getAttribute('href');
    if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
    const cleanHref = href.split('#')[0].split('?')[0] || 'index.html';
    if(cleanHref === current){
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-current');
    }
  });
}

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') toggleMenu(false);
});

document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'overlay') toggleMenu(false);
});

document.addEventListener('click', (e)=>{
  const d = document.getElementById('drawer');
  if(!d || !d.classList.contains('open')) return;

  const link = e.target.closest('a');
  if(link && d.contains(link)) toggleMenu(false);
});

document.addEventListener('DOMContentLoaded', ()=>{
  markCurrentPage();

  if(!document.querySelector('.line-float')){
    const a = document.createElement('a');
    a.className = 'line-float';
    a.href = 'line.html';
    a.setAttribute('aria-label', 'LINE 詢問');
    a.innerHTML = `<span class="line-float__text">LINE</span>`;
    document.body.appendChild(a);
  }
});

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.video-load');
  if(!btn) return;

  const wrap = btn.closest('.video-embed');
  if(!wrap) return;

  const videoId = wrap.getAttribute('data-video-id');
  if(!videoId) return;

  wrap.innerHTML = `<iframe class="video-frame" src="https://www.tiktok.com/embed/v2/${videoId}" allowfullscreen loading="lazy" title="龜鹿知識影片"></iframe>`;
});
