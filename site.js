
const drawer=document.getElementById('drawer');
function toggleMenu(){drawer.classList.toggle('open')}
document.addEventListener('click',e=>{
 if(e.target.matches('#drawer a'))drawer.classList.remove('open')
})
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){drawer.classList.remove('open')}
})
