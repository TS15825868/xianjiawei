
function toggleMenu(){document.getElementById('drawer').classList.toggle('open')}
function closeMenu(){document.getElementById('drawer').classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu()}})
