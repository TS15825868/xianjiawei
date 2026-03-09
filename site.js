
const drawer=document.getElementById('drawer');
function toggleMenu(){drawer.classList.toggle('open');}
document.addEventListener('click',e=>{
 if(e.target.matches('#drawer a'))drawer.classList.remove('open');
 if(!e.target.closest('#drawer')&&!e.target.closest('.menu'))drawer.classList.remove('open');
});
