/* =========================
   漢堡選單
========================= */

function toggleMenu(){

const menu = document.getElementById("menu")

menu.classList.toggle("active")

}


/* 點擊背景關閉 */

document.addEventListener("click",function(e){

const menu = document.getElementById("menu")

if(e.target.classList.contains("menu-overlay")){
menu.classList.remove("active")
}

})


/* 點選選單連結關閉 */

document.querySelectorAll(".menu-overlay a").forEach(link=>{

link.addEventListener("click",function(){

document.getElementById("menu").classList.remove("active")

})

})



/* =========================
   Scroll Reveal
========================= */

function revealElements(){

const reveals=document.querySelectorAll(".reveal")

reveals.forEach(el=>{

const windowHeight=window.innerHeight
const elementTop=el.getBoundingClientRect().top

if(elementTop < windowHeight - 80){

el.classList.add("show")

}

})

}

window.addEventListener("scroll",revealElements)

window.addEventListener("load",revealElements)



/* =========================
   Header 滾動效果
========================= */

const header=document.querySelector(".header")

window.addEventListener("scroll",()=>{

if(window.scrollY > 40){

header.style.background="rgba(255,255,255,.9)"

}else{

header.style.background="rgba(255,255,255,.75)"

}

})
