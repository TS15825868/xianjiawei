
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("menuOverlay");

if(menuBtn && overlay){

menuBtn.onclick = ()=>{
overlay.classList.toggle("show");
}

overlay.addEventListener("click",()=>{
overlay.classList.remove("show");
})

}
