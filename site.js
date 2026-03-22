document.addEventListener("DOMContentLoaded", () => {

  const btn = document.querySelector(".menu-btn");
  const menu = document.getElementById("menuOverlay");

  if(btn){
    btn.addEventListener("click", ()=>{
      menu.classList.add("active");
    });
  }

  window.closeMenu = function(){
    menu.classList.remove("active");
  }

});
