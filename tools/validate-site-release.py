#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

EXPECTED_PRODUCTS = {
    'guilu-gao': '100g／罐',
    'guilu-drink-30': '30cc／罐（小玻璃罐）',
    'guilu-drink-180': '180cc／包（鋁袋）',
    'guilu-tangkuai': '75g／盒｜8塊裝｜每塊約9.375g',
    'guilu-jiao': '600g（1斤）／盒｜32塊裝｜每塊約18.75g',
    'luerong-fen': '75g／罐',
}

EXPECTED_TANGKUAI_VARIANTS = [
    '75g／盒｜8塊裝｜每塊約9.375g',
    '300g／盒｜16塊裝｜每塊約18.75g',
    '600g／盒｜32塊裝｜每塊約18.75g',
]

REQUIRED_FILES = [
    'index.html', 'products.html', 'trial.html', 'data.json', 'deploy-version.json',
    'config/official-products.json',
    'assets/data/official-products.json',
    'content/social-guilu-drink-trial-v1.json',
    'content/public-post-library.json',
    'content/public-asset-library.json',
    'content/public-content-policy.json',
    'images/products-v3/guilu-drink-30.jpg',
    'images/posts/approved-v412/guilu-drink-trial-evergreen.jpg',
]

FORBIDDEN_PUBLIC_KEYS = {
    'customer', 'customer_name', 'contact_name', 'phone', 'address', 'line_id',
    'order', 'order_no', 'payment_status', 'cost', 'margin', 'profit',
    'wholesale_price', 'api_key', 'token', 'secret', 'client_secret',
    'cloudflare_api_token', 'channel_access_token', 'channel_secret',
}

FORBIDDEN_OLD_TEXT = [
    '正式售價50元／罐', '買10送1｜11罐500元',
    '龜鹿飲30cc玻璃瓶', '30cc／瓶（小玻璃瓶）',
    '龜鹿湯塊150g',
]


def load_json(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def walk_keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            yield str(key).lower()
            yield from walk_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_keys(child)


def local_asset_exists(url_or_path):
    value = str(url_or_path or '')
    prefix = 'https://ts15825868.github.io/xianjiawei/'
    if value.startswith(prefix):
        value = value[len(prefix):]
    if value.startswith('http://') or value.startswith('https://'):
        return True
    value = value.split('?', 1)[0].lstrip('/')
    return bool(value) and (ROOT / value).is_file()


def validate_variant_authority(document, spec_key):
    products = {item['id']: item for item in document.get('products', [])}
    assert set(products) == set(EXPECTED_PRODUCTS), '正式產品分類必須剛好六項'
    tangkuai = products['guilu-tangkuai']
    variants = tangkuai.get('variants', [])
    actual_specs = [item.get(spec_key) for item in variants]
    assert actual_specs == EXPECTED_TANGKUAI_VARIANTS, f'龜鹿湯塊三規格錯誤：{actual_specs}'
    deprecated = set(document.get('deprecated_product_ids', []))
    assert deprecated == {'PROD-SOUP-150'}, f'只有150g可列為廢止規格：{sorted(deprecated)}'


def main():
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    assert not missing, f'缺少必要檔案：{missing}'

    data = load_json('data.json')
    deploy = load_json('deploy-version.json')
    official_config = load_json('config/official-products.json')
    official_assets = load_json('assets/data/official-products.json')
    posts_doc = load_json('content/public-post-library.json')
    assets_doc = load_json('content/public-asset-library.json')
    trial = load_json('content/social-guilu-drink-trial-v1.json')
    policy = load_json('content/public-content-policy.json')

    products = {item['id']: item for item in data.get('products', [])}
    assert set(products) == set(EXPECTED_PRODUCTS), '正式產品分類必須剛好六項'
    for product_id, spec in EXPECTED_PRODUCTS.items():
        item = products[product_id]
        assert item.get('size') == spec, f'{product_id}主顯示規格錯誤'

    validate_variant_authority(official_config, 'spec')
    validate_variant_authority(official_assets, 'specification')

    drink30 = products['guilu-drink-30']
    drink180 = products['guilu-drink-180']
    assert drink30.get('price') == 60, '30cc售價必須為60元'
    assert drink30.get('offers') == [{'qty': 11, 'total': 600, 'label': '買10送1'}], '30cc活動錯誤'
    assert drink180.get('price') == 200, '180cc售價必須為200元'
    assert drink180.get('offers') == [{'qty': 11, 'total': 2000, 'label': '買10送1'}], '180cc活動錯誤'

    assert str(deploy.get('version', '')).startswith('2026-08-06-canonical-v7'), '部署版本未更新至v7'
    assert deploy.get('pricingPolicy', {}).get('guiluDrink30cc') == '正式售價60元／罐｜買10送1｜11罐600元'
    assert deploy.get('contentPolicy', {}).get('preventRepublish') is True

    posts = posts_doc.get('posts', [])
    assert posts_doc.get('authority') == 'TS15825868/xianjiawei'
    assert len(posts) == 23, f'公開貼文應為23篇，實際{len(posts)}篇'
    assert len({post.get('id') for post in posts}) == 23, '公開貼文ID重複'
    published = [post for post in posts if post.get('status') == 'published']
    pending = [post for post in posts if post.get('status') == 'pending_review']
    assert len(published) == 2, '已發布鎖定應為2篇'
    assert len(pending) == 21, '待人工審核應為21篇'
    for post in posts:
        assert post.get('id') and post.get('copy'), '公開貼文缺少ID或文案'
        assert local_asset_exists(post.get('image_url')), f"貼文圖片不存在：{post.get('id')}"
        if post.get('status') == 'published':
            assert post.get('prevent_republish') is True, f"已發布貼文缺少防重發鎖：{post.get('id')}"

    public_keys = set(walk_keys(posts_doc))
    leaked = sorted(public_keys & FORBIDDEN_PUBLIC_KEYS)
    assert not leaked, f'公開貼文資料含私人欄位：{leaked}'

    assets = assets_doc.get('assets', [])
    assert len(assets) >= 20, '公開素材清單不足'
    assert len({asset.get('id') for asset in assets}) == len(assets), '公開素材ID重複'
    for asset in assets:
        assert asset.get('id') and local_asset_exists(asset.get('path')), f"素材不存在：{asset.get('id')}"

    assert policy.get('publicRepository') == 'TS15825868/xianjiawei'
    assert policy.get('privateRepository') == 'TS15825868/xianjiawei-internal'
    assert policy.get('erpPolicy', {}).get('customerDataPublic') is False
    assert policy.get('erpPolicy', {}).get('secretDataPublic') is False

    trial_copy = trial.get('copy', '')
    for value in ['正式售價 60元／罐', '買10送1｜11罐600元', '買10送1｜11包2,000元', '官方LINE']:
        assert value in trial_copy, f'試喝文案缺少：{value}'
    assert trial.get('publishingSafety', {}).get('preventRepublish') is True

    official_trial_jpg = 'images/posts/approved-v412/guilu-drink-trial-evergreen.jpg'
    trial_html = (ROOT / 'trial.html').read_text(encoding='utf-8')
    assert official_trial_jpg in trial_html, '試喝頁未使用指定正式JPG海報'

    public_text = '\n'.join([
        json.dumps(posts_doc, ensure_ascii=False),
        json.dumps(assets_doc, ensure_ascii=False),
        json.dumps(trial, ensure_ascii=False),
        json.dumps(data, ensure_ascii=False),
        json.dumps(official_config, ensure_ascii=False),
        json.dumps(official_assets, ensure_ascii=False),
    ])
    for value in FORBIDDEN_OLD_TEXT:
        assert value not in public_text, f'公開資料仍含舊內容：{value}'

    print('PASS 官網與公開內容母本驗收：六項產品分類、龜鹿湯塊75/300/600g、23篇貼文、指定試喝JPG、Git圖片、防私人資料外洩與防重發鎖全部通過。')


if __name__ == '__main__':
    main()
