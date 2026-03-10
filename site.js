document.addEventListener("DOMContentLoaded",function(){

const menuBtn=document.querySelector(".menu-btn");
const menu=document.querySelector(".menu");

if(menuBtn){
menuBtn.onclick=function(){
menu.classList.toggle("open");
};
}

});
