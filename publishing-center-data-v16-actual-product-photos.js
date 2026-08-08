(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v16-products-v3-size-lock';
  const MAP={
    'guilu-gao':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-gao.jpg?v=20260809-25',
    'guilu-drink-30':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-30.jpg?v=20260809-25',
    'guilu-drink-180':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-180.jpg?v=20260809-25',
    'guilu-tangkuai':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-tangkuai.jpg?v=20260809-25',
    'guilu-jiao':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-jiao.jpg?v=20260809-25',
    'luerong-fen':'https://ts15825868.github.io/xianjiawei/images/products-v3/luerong-fen.jpg?v=20260809-25'
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
    const isLegacy=/\/images\/products-v2\//i.test(url)||/\/images\/dm-final\//i.test(url);
    const isWrongV3=/\/images\/products-v3\//i.test(url)&&url!==MAP[id];
    if(isLegacy||isWrongV3||!url){
      return{
        ...p,
        image_url:MAP[id],
        image_source:'products-v3-user-approved-original-product-photo',
        image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
        physical_scale_policy:'preserve-original-aspect-and-realistic-relative-scale',
        image_review_reason:`${String(p.image_review_reason||'').replace(/products-v2|products-v3|正式原圖/g,'正式產品原圖')}｜2026-08-09校正：產品本體只用products-v3核准實拍；禁止拉寬、拉高、裁切、AI重畫或把不同產品強制等高／等寬。`
      };
    }
    return{
      ...p,
      image_source:p.image_source||'products-v3-user-approved-original-product-photo',
      image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
      physical_scale_policy:'preserve-original-aspect-and-realistic-relative-scale'
    };
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(fixPost);
      const merged={...data,version:'2026-08-09-public-posts-v23-products-v3-size-lock',posts};
      const headers=new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
  window.XJWActualProductPhotoAuthority=Object.freeze({version:VERSION,map:MAP,productId,fixPost});
})();