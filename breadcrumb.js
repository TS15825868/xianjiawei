const title=document.querySelector("h1");
const bc=document.getElementById("breadcrumb-title");

if(title && bc){
bc.textContent=title.textContent;
}
