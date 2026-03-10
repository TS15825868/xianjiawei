
function toggleMenu(){
document.getElementById('drawer').classList.toggle('open')
}
function toggleFaq(el){
const a=el.nextElementSibling
a.style.display=a.style.display==='block'?'none':'block'
}
function searchRecipes(){
const q=document.getElementById('search').value.toLowerCase()
document.querySelectorAll('.recipe').forEach(r=>{
r.style.display=r.innerText.toLowerCase().includes(q)?'block':'none'
})
}
