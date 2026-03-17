document.addEventListener("DOMContentLoaded",()=>{
// simple menu toggle
const btn=document.querySelector(".menu-btn");const menu=document.getElementById("menuOverlay");
if(btn&&menu){btn.onclick=()=>menu.classList.toggle("active")}
});