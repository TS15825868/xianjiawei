
const drawer=document.getElementById('drawer');
function toggleMenu(){drawer.classList.toggle('open');}
document.addEventListener('click',e=>{
 if(e.target.matches('#drawer a'))drawer.classList.remove('open');
 if(!e.target.closest('#drawer')&&!e.target.closest('.menu'))drawer.classList.remove('open');
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape')drawer.classList.remove('open');
});

function openModal(t,txt){
document.getElementById('modal').style.display='flex';
document.getElementById('modalTitle').innerText=t;
document.getElementById('modalText').innerText=txt;
}
function closeModal(){document.getElementById('modal').style.display='none'}


const modalExtra = {
  "龜鹿膏": "規格：100 g",
  "龜鹿飲": "規格：180 cc／包",
  "龜鹿湯塊": "規格：75 g／盒（8塊，每塊 9.375 g ± 5 g）、300 g／盒、600 g／盒。\n圖片說明：300 g 使用紅色盒裝；湯塊單塊外觀為 9.375 g ± 5 g 示意。",
  "鹿茸粉": "規格：75 g"
};

const _origOpenModal = typeof openModal === 'function' ? openModal : null;
if (_origOpenModal) {
  openModal = function(t, txt){
    _origOpenModal(t, txt);
    var d = document.getElementById('modalDetail');
    if (d) d.innerText = modalExtra[t] || '';
  }
}
