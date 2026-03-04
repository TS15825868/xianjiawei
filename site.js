"use strict";
/* Web v8.0.3 — Original hamburger hand feel (dropdown under header) */
(function(){
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if(!toggle || !nav) return;

  function closeNav(){
    nav.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded","false");
  }

  if(!toggle.hasAttribute("aria-expanded")) toggle.setAttribute("aria-expanded","false");

  toggle.addEventListener("click", function(e){
    e.stopPropagation();
    const next = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", next);
    toggle.classList.toggle("is-open", next);
    toggle.setAttribute("aria-expanded", next ? "true" : "false");
  });

  // click outside closes (original feel)
  document.addEventListener("click", function(e){
    const insideNav = nav.contains(e.target);
    const onToggle = toggle.contains(e.target);
    if(!insideNav && !onToggle) closeNav();
  });

  // mobile: scroll closes
  window.addEventListener("scroll", function(){
    if(window.innerWidth <= 768 && nav.classList.contains("is-open")) closeNav();
  }, {passive:true});

  // set active link
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  nav.querySelectorAll("a.nav-link").forEach(a => {
    const href=(a.getAttribute("href")||"").toLowerCase();
    if(href===path) a.classList.add("nav-link--active");
  });

})();
