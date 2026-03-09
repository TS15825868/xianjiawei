
const drawer=document.getElementById('drawer');
function toggleMenu(){drawer.classList.toggle('open');}
document.addEventListener('click',e=>{
 if(e.target.matches('#drawer a'))drawer.classList.remove('open');
 if(!e.target.closest('#drawer')&&!e.target.closest('.menu'))drawer.classList.remove('open');
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape')drawer.classList.remove('open');
});

function openModal(t,txt){
document.getElementById('modal').style.display='flex';
document.getElementById('modalTitle').innerText=t;
document.getElementById('modalText').innerText=txt;
}
function closeModal(){document.getElementById('modal').style.display='none'}
