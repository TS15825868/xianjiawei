
document.addEventListener("DOMContentLoaded",function(){

const line=document.createElement("a");
line.className="line-float";
line.href="contact.html";
line.innerText="LINE詢問";
document.body.appendChild(line);

const search=document.getElementById("guideSearch");
if(search){
search.addEventListener("keyup",function(){
let k=search.value.toLowerCase();
document.querySelectorAll(".guide-card").forEach(c=>{
c.style.display=c.innerText.toLowerCase().includes(k)?"block":"none";
});
});
}

});
