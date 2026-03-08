
function toggleMenu(){document.getElementById("drawer").classList.toggle("open")}
function searchCards(){
 let q=document.getElementById("search").value.toLowerCase()
 document.querySelectorAll(".card").forEach(c=>{
   c.style.display=c.innerText.toLowerCase().includes(q)?"block":"none"
 })
}
