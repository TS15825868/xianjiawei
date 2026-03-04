
function toggleMenu(){
document.getElementById('nav').classList.toggle('open');
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
    nav.classList.remove('open');
  }
});
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){
    // close nav
    const nav=document.getElementById('nav');
    if(nav) nav.classList.remove('open');
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
