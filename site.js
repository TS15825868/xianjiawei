function toggleMenu(open){
  const d=document.getElementById('drawer');
  const o=document.getElementById('overlay');

  if(!d||!o)return;

  const willOpen=(typeof open==='boolean')?open:!d.classList.contains('open');

  if(willOpen){
    d.classList.add('open');
    o.classList.add('open');
    document.body.classList.add('menu-open');
  }else{
    d.classList.remove('open');
    o.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape')toggleMenu(false);
});

document.addEventListener('click',e=>{
  if(e.target.id==='overlay')toggleMenu(false);
});

document.addEventListener('DOMContentLoaded',()=>{

  if(!document.querySelector('.line-float')){
    const a=document.createElement('a');
    a.className='line-float';
    a.href='line.html';
    a.innerHTML='LINE';
    document.body.appendChild(a);
  }

});
