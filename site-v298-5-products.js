(() => {
  const VERSION = '298.6';
  const originalFetch = window.fetch.bind(window);

  function normalizeProducts(data) {
    if (!data || !Array.isArray(data.products)) return data;
    data.version = VERSION;

    const index = data.products.findIndex(product => product.id === 'guilu-drink-30');
    if (index < 0) return data;

    const source = data.products[index];
    const ingredients = source.ingredients || [
      '水', '鹿角萃取物', '龜板萃取物', '枸杞', '紅棗', '黃耆', '粉光蔘'
    ];

    const drink30 = {
      ...source,
      id: 'guilu-drink-30',
      name: '龜鹿飲',
      displayName: '龜鹿飲30cc',
      size: '30cc／瓶（玻璃瓶）',
      image: `images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
      dmImage: `images/dm-v3/guilu-drink-30.jpg?v=${VERSION}`,
      description: '30cc玻璃小瓶，把龜鹿膏的成分方向整理成方便即飲的液態型態。適合輕巧即飲、外出攜帶與工作空檔安排。',
      ingredients,
      usage: ['開瓶即可飲用', '可依個人習慣溫熱後飲用', '開瓶後請儘速飲用完畢'],
      storage: ['未開封置於陰涼乾燥處', '避免高溫與日光直射', '開瓶後請儘速飲用完畢'],
      fit: '想方便即飲、外出攜帶或在工作空檔飲用的人',
      detailImages: [`images/dm-v3/guilu-drink-30.jpg?v=${VERSION}`],
      detailPage: 'product-guilu-drink-30cc.html',
      purpose: '輕巧即飲食補',
      purposeDirection: '適合外出攜帶、工作空檔或偏好小瓶即飲的人。'
    };
    delete drink30.specOptions;
    delete drink30.extraDetailPages;

    const drink180 = {
      id: 'guilu-drink-180',
      series: '仙加味・龜鹿',
      name: '龜鹿飲',
      displayName: '龜鹿飲180cc',
      size: '180cc／包（鋁袋）',
      image: `images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
      gallery: [],
      dmImage: `images/dm-final/03_guilu-drink-180cc-dm.jpg?v=${VERSION}`,
      description: '180cc鋁袋包裝，把龜鹿膏的成分方向整理成較大容量的即飲型態。開封即可飲用，也可依個人習慣溫熱後飲用。',
      ingredients,
      usage: ['打開即可飲用', '可隔水加熱後飲用', '亦可倒入杯中後加熱飲用', '開封後請儘速飲用完畢'],
      storage: ['常溫置於陰涼處', '或保存於5°C以下冷藏', '開封後請儘速飲用完畢'],
      fit: '偏好較大容量即飲、居家安排或溫熱後飲用的人',
      detailImages: [`images/dm-final/03_guilu-drink-180cc-dm.jpg?v=${VERSION}`],
      priceNote: '價格與優惠請透過官方 LINE 詢問。',
      detailPage: 'product-guilu-drink-180cc.html',
      purpose: '較大容量即飲食補',
      purposeDirection: '適合偏好較大容量即飲、居家安排或溫熱後飲用的人。'
    };

    const existing180 = data.products.findIndex(product => product.id === 'guilu-drink-180');
    if (existing180 >= 0) data.products.splice(existing180, 1);
    data.products.splice(index, 1, drink30, drink180);
    return data;
  }

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const requestUrl = String(args[0]?.url || args[0] || '');
    if (!requestUrl.includes('data.json')) return response;

    try {
      const data = normalizeProducts(await response.clone().json());
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('產品資料更新失敗：', error);
      return response;
    }
  };
})();
