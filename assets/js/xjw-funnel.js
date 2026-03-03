
(function(){
  "use strict";
  var LINE_URL = 'https://lin.ee/sHZW7NkR';
  document.addEventListener("click", function(e){
    var el = e.target.closest("[data-line-cta]");
    if(!el) return;
    e.preventDefault();
    window.open(LINE_URL, "_blank");
  });
})();
