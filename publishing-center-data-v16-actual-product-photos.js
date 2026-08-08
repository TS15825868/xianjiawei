(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const MAP={
    'guilu-gao':'https://ts15825868.github.io/xianjiawei/images/products-v2/guilu-gao.jpeg?v=20260808-20',
    'guilu-drink-30':'https://ts15825868.github.io/xianjiawei/images/products-v2/guilu-drink-30.jpeg?v=20260808-20',
    'guilu-drink-180':'https://ts15825868.github.io/xianjiawei/images/products-v2/guilu-drink-180.jpeg?v=20260808-20',
    'guilu-tangkuai':'https://ts15825868.github.io/xianjiawei/images/products-v2/guilu-tangkuai.jpeg?v=20260808-20',
    'guilu-jiao':'https://ts15825868.github.io/xianjiawei/images/products-v2/guilu-jiao-open-new.jpg?v=20260808-20',
    'luerong-fen':'https://ts15825868.github.io/xianjiawei/images/products-v2/luerong-fen.jpeg?v=20260808-20'
  };
  function productId(p){
    const refs=Array.isArray(p?.product_refs)?p.product_refs.filter(id=>MAP[id]):[];
    if(refs.length===1)return refs[0];
    const t=`${p?.id||''} ${p?.title||''} ${p?.copy||''}`;
    if(/POST-DRINK-30|龜鹿飲30cc/.test(t))return'guilu-drink-30';
    if(/POST-DRINK-180|龜鹿飲180cc/.test(t))return'guilu-drink-180';
    if(/POST-SOUP-75|龜鹿湯塊/.test(t)&&!/龜鹿膠/.test(t))return'guilu-tangkuai';
    if(/POST-JIAO-600|龜鹿膠/.test(t)&&!/龜鹿湯塊/.test(t))return'guilu-jiao';
    if(/POST-LUERONG|鹿茸粉/.test(t)&&!/龜鹿/.test(t))return'luerong-fen';
    if(/POST-GAO-100|龜鹿膏/.test(t)&&!/龜鹿飲/.test(t))return'guilu-gao';
    return'';
  }
  function fixPost(p){
    const id=productId(p),url=String(p?.image_url||'');
    if(!id||!MAP[id])return p;
    if(/\/images\/products-v3\//i.test(url)||/\/images\/dm-final\//i.test(url)){
      return{...p,image_url:MAP[id],image_source:'products-v2-actual-product-photo',image_policy:'actual-product-photo-contain-no-crop',image_review_reason:`${String(p.image_review_reason||'').replace(/products-v3|正式原圖/g,'products-v2實際產品照片')}｜新錄影校正：產品主圖不得使用宣傳DM／海報版面。`};
    }
    return p;
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fixPost);const merged={...data,version:'2026-08-08-public-posts-v22-products-v2-photo-authority',posts};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});}catch{return response}
  };
  window.XJWActualProductPhotoAuthority=Object.freeze({version:'2026-08-08-v16',map:MAP,productId,fixPost});
})();