
document.addEventListener("DOMContentLoaded",function(){

const search=document.getElementById("guideSearch");

if(!search) return;

search.addEventListener("keyup",function(){

let keyword=search.value.toLowerCase();
let cards=document.querySelectorAll(".guide-card");

cards.forEach(function(card){

let text=card.innerText.toLowerCase();

if(text.includes(keyword)){
card.style.display="block";
}else{
card.style.display="none";
}

});

});

});
