
function toggleMenu(){document.getElementById('drawer').classList.toggle('open');}
function searchCards(inputId,wrapId){const q=(document.getElementById(inputId)?.value||'').toLowerCase();document.querySelectorAll(wrapId+' .card').forEach(c=>{c.style.display=c.innerText.toLowerCase().includes(q)?'block':'none';});}
function openModal(id){document.getElementById(id)?.classList.add('open');}
function closeModal(id){document.getElementById(id)?.classList.remove('open');}
window.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.remove('open');});
