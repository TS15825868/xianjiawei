
const drawer=document.getElementById('drawer');
function toggleMenu(){drawer.classList.toggle('open');}

document.addEventListener('click',function(e){
 if(e.target.matches('#drawer a')) drawer.classList.remove('open');
 if(!e.target.closest('#drawer') && !e.target.closest('.menu')){
  drawer.classList.remove('open');
 }
});

document.addEventListener('keydown',function(e){
 if(e.key==='Escape'){drawer.classList.remove('open');}
});
