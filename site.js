function toggleMenu(){
  const drawer=document.getElementById("drawer");
  if(!drawer) return;
  drawer.classList.toggle("open");
}

function closeMenu(){
  const drawer=document.getElementById("drawer");
  if(!drawer) return;
  drawer.classList.remove("open");
}

function openModal(id){
  const modal=document.getElementById(id);
  if(!modal) return;

  modal.classList.add("open");
  document.body.style.overflow="hidden";
}

function closeModal(id){
  const modal=document.getElementById(id);
  if(!modal) return;

  modal.classList.remove("open");
  document.body.style.overflow="";
}

function closeAllModals(){
  document.querySelectorAll(".modal.open").forEach(modal=>{
    modal.classList.remove("open");
  });
  document.body.style.overflow="";
}

document.addEventListener("click",function(e){

  const drawer=document.getElementById("drawer");
  const menuBtn=document.querySelector(".menu-btn");

  if(
    drawer &&
    drawer.classList.contains("open") &&
    !drawer.contains(e.target) &&
    menuBtn &&
    !menuBtn.contains(e.target)
  ){
    closeMenu();
  }

  if(e.target.classList.contains("modal")){
    closeAllModals();
  }

});

document.addEventListener("keydown",function(e){
  if(e.key==="Escape"){
    closeAllModals();
    closeMenu();
  }
});

document.querySelectorAll(".acc-item").forEach(item=>{

  const q=item.querySelector(".acc-q");
  if(!q) return;

  q.addEventListener("click",function(){
    item.classList.toggle("open");
  });

});
