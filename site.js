document.addEventListener("DOMContentLoaded",function(){

const line=document.createElement("a");
line.className="line-float";
line.href="contact.html";
line.innerText="LINE詢問";
document.body.appendChild(line);

const search=document.getElementById("guideSearch");

if(search){

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

}

});
