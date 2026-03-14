
function toggleMenu(){document.getElementById('drawer').classList.toggle('open')}
function closeMenu(){document.getElementById('drawer').classList.remove('open')}
function openModal(id){document.getElementById(id)?.classList.add('open')}
function closeModal(id){document.getElementById(id)?.classList.remove('open')}
document.addEventListener('click',function(e){
  if(e.target.matches('#drawer a')) closeMenu();
  if(!e.target.closest('#drawer') && !e.target.closest('.menu-btn')) closeMenu();
  if(e.target.classList.contains('modal')) e.target.classList.remove('open');
  if(e.target.classList.contains('acc-q')) e.target.parentElement.classList.toggle('open');
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closeMenu();
    document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open'));
  }
});
function filterRecipes(){
  const q=(document.getElementById('recipeSearch')?.value||'').toLowerCase();
  document.querySelectorAll('.recipe-card').forEach(card=>{
    card.style.display = card.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
}
function switchCompare(id){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.compare-panel').forEach(p=>p.classList.remove('active'));
  document.querySelector('[data-tab="'+id+'"]').classList.add('active');
  document.getElementById(id).classList.add('active');
}
