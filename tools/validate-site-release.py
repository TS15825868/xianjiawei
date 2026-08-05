#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
OFFICIAL_30 = 'images/products-v3/guilu-drink-30.jpg'
EXPECTED_PRODUCTS = {
    'guilu-gao': '100g／罐',
    'guilu-drink-30': '30cc／罐（小玻璃罐）',
    'guilu-drink-180': '180cc／包（鋁袋）',
    'guilu-tangkuai': '75g／盒｜8塊裝｜每塊約9.375g',
    'guilu-jiao': '600g（1斤）／盒｜32塊裝｜每塊約18.75g',
    'luerong-fen': '75g／罐',
}
EXPECTED_COMBOS = ['日常節奏組', '料理搭配組', '完整體驗組']
REQUIRED_FILES = [
    'index.html', 'products.html', 'choose.html', 'dm.html', 'guide.html',
    'brand.html', 'faq.html', 'contact.html', 'site.css', 'site.js',
    'site-core-v410.js', 'site-product-image-safety.js', 'data.json',
    'catalog-public.json', 'geo-data.json', 'deploy-version.json',
    'sitemap.xml', 'robots.txt', OFFICIAL_30,
]
PUBLIC_TEXT_FILES = [
    'index.html', 'products.html', 'choose.html', 'dm.html', 'guide.html',
    'brand.html', 'faq.html', 'contact.html', 'trial.html', 'brand-facts.html',
    'product-guilu-gao.html', 'product-guilu-drink-30cc.html',
    'product-guilu-drink-180cc.html', 'product-guilu-tangkuai.html',
    'product-guilu-jiao.html', 'product-luerong-fen.html',
    'data.json', 'catalog-public.json', 'geo-data.json', 'deploy-version.json',
    'llms.txt', 'llms-full.txt',
]
FORBIDDEN_PUBLIC_VALUES = [
    '龜鹿飲30cc玻璃瓶', '30cc／瓶（小玻璃瓶）', '小玻璃瓶',
    '龜鹿湯塊150g', '龜鹿湯塊300g', '龜鹿湯塊600g',
    '600g／盒（1斤）｜32塊裝｜每塊約18.75g',
    '台北市萬華區西昌街52號', '台北市萬華區西昌街 52 號',
    '門市自取', 'guilu-drink-30-clean.svg',
    'images/guilu-drink-30cc-glass.jpg',
    'images/dm-final/02_guilu-drink-30cc-dm.jpg',
]


def load_json(relative_path):
    path = ROOT / relative_path
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        raise AssertionError(f'{relative_path}不是有效JSON：{exc}') from exc


def main():
    missing = [name for name in REQUIRED_FILES if not (ROOT / name).is_file()]
    assert not missing, f'缺少必要檔案：{missing}'
    assert not (ROOT / 'site-product-authority.js').exists(), '不得保留舊字串執行期改寫器'

    data = load_json('data.json')
    catalog = load_json('catalog-public.json')
    geo = load_json('geo-data.json')
    deploy = load_json('deploy-version.json')

    products = {
        item.get('id'): item
        for item in data.get('products', [])
        if isinstance(item, dict) and item.get('id')
    }
    assert set(products) == set(EXPECTED_PRODUCTS), f'產品必須剛好六項：{sorted(products)}'
    for product_id, specification in EXPECTED_PRODUCTS.items():
        assert products[product_id].get('size') == specification, f'{product_id}規格錯誤'

    assert [item.get('name') for item in data.get('combos', [])] == EXPECTED_COMBOS, '正式搭配必須剛好三組且順序一致'
    assert [item.get('name') for item in data.get('offers', {}).get('comboOffers', [])] == EXPECTED_COMBOS, '搭配鏡像必須剛好三組且順序一致'

    drink30 = products['guilu-drink-30']
    assert drink30.get('image', '').startswith(OFFICIAL_30), '30cc主圖未使用正式原圖'
    assert drink30.get('dmImage', '').startswith(OFFICIAL_30), '30cc DM圖未使用正式原圖'
    details = drink30.get('detailImages', [])
    assert details and all(str(item).startswith(OFFICIAL_30) for item in details), '30cc詳圖仍含舊來源'
    assert drink30.get('imagePolicy') == 'official-original-contain-no-crop', '30cc圖片政策錯誤'

    for product_id in ('guilu-drink-30', 'guilu-drink-180'):
        product = products[product_id]
        assert product.get('fulfillmentType') == 'made-to-order-drink', f'{product_id}出貨分類錯誤'
        assert '5～7個工作天' in product.get('fulfillmentNotice', ''), f'{product_id}缺少製作時間'
    for product_id in ('guilu-gao', 'guilu-tangkuai', 'guilu-jiao', 'luerong-fen'):
        product = products[product_id]
        assert product.get('fulfillmentType') == 'ready-stock', f'{product_id}出貨分類錯誤'
        assert '5～7個工作天' not in product.get('fulfillmentNotice', ''), f'{product_id}被錯套龜鹿飲交期'

    catalog_text = json.dumps(catalog, ensure_ascii=False)
    geo_text = json.dumps(geo, ensure_ascii=False)
    assert len(catalog.get('products', [])) == 6, '公開目錄必須剛好六項'
    assert OFFICIAL_30 in catalog_text, '公開目錄30cc圖錯誤'
    assert OFFICIAL_30 in geo_text, 'GEO 30cc圖錯誤'
    assert deploy.get('catalog') == 'six-official-products', '部署版本檔仍不是六項正式產品'
    assert deploy.get('imagePolicy', {}).get('guiluDrink30ccImage', '').startswith(OFFICIAL_30), '部署版本檔30cc圖錯誤'

    public_text = '\n'.join(
        (ROOT / relative_path).read_text(encoding='utf-8', errors='ignore')
        for relative_path in PUBLIC_TEXT_FILES
        if (ROOT / relative_path).is_file()
    )
    for value in FORBIDDEN_PUBLIC_VALUES:
        assert value not in public_text, f'公開呈現資料仍含舊資料：{value}'

    safety = (ROOT / 'site-product-image-safety.js').read_text(encoding='utf-8')
    assert OFFICIAL_30 in safety, '圖片安全層未指向30cc正式原圖'
    assert 'images/guilu-drink-30cc-glass.jpg' in safety, '圖片安全層缺少舊路徑攔截'
    assert 'guilu-drink-30-clean.svg' in safety, '圖片安全層缺少舊SVG攔截'
    assert 'site-product-authority.js' not in (ROOT / 'site.js').read_text(encoding='utf-8'), '入口不得載入舊字串改寫器'

    contact = (ROOT / 'contact.html').read_text(encoding='utf-8', errors='ignore')
    assert 'https://lin.ee/sHZW7NkR' in contact, '聯絡頁缺少官方LINE'
    assert 'maps.google' not in contact and 'google.com/maps' not in contact, '聯絡頁不得保留地圖'

    print('PASS 官網正式發布驗收：六項產品、三組搭配、30cc正式原圖、龜鹿膠規格、出貨政策、GEO、公開資料與聯絡頁全部通過。')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f'FAIL {exc}', file=sys.stderr)
        raise SystemExit(1)
