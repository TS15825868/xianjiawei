
(function () {
  "use strict";
  const weightRegex = /(\d{1,5})\s*(公克|克|g|G)\b/g;
  function normalizeText(text) {
    return text.replace(weightRegex, function (_, num) {
      return String(num) + "g";
    });
  }
  const SKIP = new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA"]);
  function walk(node){
    if(node.nodeType===3){
      node.nodeValue = normalizeText(node.nodeValue);
      return;
    }
    if(node.nodeType===1 && !SKIP.has(node.tagName)){
      for(let i=0;i<node.childNodes.length;i++){
        walk(node.childNodes[i]);
      }
    }
  }
  function run(){
    walk(document.body);
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",run);
  }else{run();}
})();
