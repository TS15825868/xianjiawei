#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://ts15825868.github.io/xianjiawei/'

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
    'index.html', 'products.html', 'choose.html', 'guide.html', 'combo.html',
    'faq.html', 'brand-facts.html', 'product-guilu-tangkuai.html', 'trial.html',
    'site.js', 'site-core-v410.js', 'site-official-product-variants.js',
    'data.json', 'deploy-version.json', 'catalog-public.json', 'geo-data.json',
    'llms.txt', 'llms-full.txt',
    'config/official-products.json',
    'assets/data/official-products.json',
    'content/social-guilu-drink-trial-v1.json',
    'content/public-post-library.json',
    'content/public-asset-library.json',
    'content/public-content-policy.json',
    'images/products-v3/guilu-drink-30.jpg',
    'images/posts/approved-v412/guilu-drink-trial-evergreen.jpg',
]

FORBIDDEN_SUPERSEDED_FILES = [
    'content/public-post-library-v2.json',
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
    '龜鹿湯塊150g', 'approved-v413/guilu-drink-trial-60.svg',
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


def normalize_public_path(url_or_path):
    value = str(url_or_path or '').strip()
    if value.startswith(BASE):
        value = value[len(BASE):]
    return value.split('?', 1)[0].lstrip('/')


def local_asset_exists(url_or_path):
    value = str(url_or_path or '').strip()
    if value.startswith('http://') or value.startswith('https://'):
        if not value.startswith(BASE):
            return True
    path = normalize_public_path(value)
    return bool(path) and (ROOT / path).is_file()


def validate_variant_authority(document, spec_key):
    products = {item['id']: item for item in document.get('products', [])}
    assert set(products) == set(EXPECTED_PRODUCTS), '正式產品分類必須剛好六項'
    tangkuai = products['guilu-tangkuai']
    actual_specs = [item.get(spec_key) for item in tangkuai.get('variants', [])]
    assert actual_specs == EXPECTED_TANGKUAI_VARIANTS, f'龜鹿湯塊三規格錯誤：{actual_specs}'
    deprecated = set(document.get('deprecated_product_ids', []))
    assert deprecated == {'PROD-SOUP-150'}, f'只有150g可列為廢止規格：{sorted(deprecated)}'


def validate_post_states(posts_doc, assets_doc):
    posts = posts_doc.get('posts', [])
    defaults = posts_doc.get('publishing_defaults', {})
    assets = assets_doc.get('assets', [])
    asset_by_id = {str(asset.get('id') or ''): asset for asset in assets}

    assert posts, '公開貼文不可為空'
    ids = [str(post.get('id') or '') for post in posts]
    assert all(ids), '公開貼文缺少ID'
    assert len(ids) == len(set(ids)), '公開貼文ID重複'
    assert len(asset_by_id) == len(assets), '公開素材ID重複或空白'

    image_urls = []
    image_asset_ids = []
    published = 0
    pending = 0

    for post in posts:
        effective = {**defaults, **post}
        post_id = post['id']
        assert post.get('copy'), f'公開貼文缺少文案：{post_id}'
        assert post.get('image_asset_id'), f'公開貼文缺少素材綁定：{post_id}'
        assert local_asset_exists(post.get('image_url')), f'貼文圖片不存在：{post_id}'

        asset_id = str(post['image_asset_id'])
        asset = asset_by_id.get(asset_id)
        assert asset, f'貼文引用不存在素材：{post_id} -> {asset_id}'
        assert normalize_public_path(post.get('image_url')) == normalize_public_path(asset.get('path')), (
            f'貼文圖片網址與素材路徑不一致：{post_id}'
        )
        image_urls.append(normalize_public_path(post.get('image_url')))
        image_asset_ids.append(asset_id)

        status = str(post.get('status') or '')
        if status == 'published':
            published += 1
            assert effective.get('prevent_republish') is True, f'已發布貼文缺少防重發鎖：{post_id}'
            assert effective.get('do_not_republish') is True, f'已發布貼文缺少永久禁止重發：{post_id}'
            assert effective.get('publish_allowed') is False, f'已發布貼文不得再次允許發布：{post_id}'
            assert effective.get('schedule_enabled') is False, f'已發布貼文不得開啟排程：{post_id}'
            assert effective.get('scheduled_at') in (None, ''), f'已發布貼文不得再次排程：{post_id}'
        else:
            pending += 1
            assert status in {'pending_review', 'draft', 'rejected', 'archived'}, f'未知貼文狀態：{post_id}={status}'
            if status != 'archived':
                assert effective.get('owner_review_required') is True, f'待審貼文缺少老闆審核：{post_id}'
                assert effective.get('approval_required') is True, f'待審貼文缺少核准閘門：{post_id}'
                assert effective.get('approved') is not True, f'待審貼文不得預先核准：{post_id}'
                assert effective.get('publish_allowed') is False, f'待審貼文不得允許發布：{post_id}'
                assert effective.get('schedule_enabled') is False, f'待審貼文不得開啟排程：{post_id}'
                assert effective.get('scheduled_at') in (None, ''), f'待審貼文不得排程：{post_id}'
                assert effective.get('auto_approve') is False, f'待審貼文不得自動核准：{post_id}'
                assert effective.get('auto_schedule') is False, f'待審貼文不得自動排程：{post_id}'
                assert effective.get('auto_publish') is False, f'待審貼文不得自動發布：{post_id}'

    assert published >= 1, '至少需要一篇已發布且鎖定的正式貼文'
    assert len(image_urls) == len(set(image_urls)), '公開貼文主圖片路徑重複'
    assert len(image_asset_ids) == len(set(image_asset_ids)), '公開貼文主素材ID重複'
    assert posts_doc.get('counts', {}).get('total') == len(posts), '貼文摘要總數與實際資料不一致'
    assert posts_doc.get('counts', {}).get('published_locked') == published, '已發布鎖定摘要數錯誤'
    assert posts_doc.get('counts', {}).get('pending_review') == pending, '待審摘要數錯誤'
    assert posts_doc.get('counts', {}).get('duplicate_primary_images') == 0, '貼文摘要不得宣稱存在重複圖片'
    assert posts_doc.get('counts', {}).get('missing_asset_bindings') == 0, '貼文摘要不得宣稱缺少素材綁定'
    return posts, published, pending


def main():
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    assert not missing, f'缺少必要檔案：{missing}'
    superseded = [path for path in FORBIDDEN_SUPERSEDED_FILES if (ROOT / path).exists()]
    assert not superseded, f'仍保留重複或已取代檔案：{superseded}'

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
        assert products[product_id].get('size') == spec, f'{product_id}主顯示規格錯誤'

    validate_variant_authority(official_config, 'spec')
    validate_variant_authority(official_assets, 'specification')

    drink30 = products['guilu-drink-30']
    drink180 = products['guilu-drink-180']
    assert drink30.get('price') == 60, '30cc售價必須為60元'
    assert drink30.get('offers') == [{'qty': 11, 'total': 600, 'label': '買10送1'}], '30cc活動錯誤'
    assert drink180.get('price') == 200, '180cc售價必須為200元'
    assert drink180.get('offers') == [{'qty': 11, 'total': 2000, 'label': '買10送1'}], '180cc活動錯誤'

    assert str(deploy.get('version', '')).startswith('2026-08-07-canonical-v8'), '部署版本未更新至2026-08-07 v8'
    assert deploy.get('catalog') == 'six-official-product-families-with-three-soup-variants'
    assert deploy.get('pricingPolicy', {}).get('guiluDrink30cc') == '正式售價60元／罐｜買10送1｜11罐600元'
    assert deploy.get('contentPolicy', {}).get('preventRepublish') is True
    assert deploy.get('imagePolicy', {}).get('trialPosterAssetId') == 'post-trial-evergreen-v412'

    assert posts_doc.get('authority') == 'TS15825868/xianjiawei'
    posts, published_count, pending_count = validate_post_states(posts_doc, assets_doc)

    public_keys = set(walk_keys(posts_doc))
    leaked = sorted(public_keys & FORBIDDEN_PUBLIC_KEYS)
    assert not leaked, f'公開貼文資料含私人欄位：{leaked}'

    assets = assets_doc.get('assets', [])
    assert assets, '公開素材清單不可為空'
    for asset in assets:
        assert asset.get('id') and local_asset_exists(asset.get('path')), f"素材不存在：{asset.get('id')}"

    assert policy.get('publicRepository') == 'TS15825868/xianjiawei'
    assert policy.get('privateRepository') == 'TS15825868/xianjiawei-internal'
    assert policy.get('erpPolicy', {}).get('customerDataPublic') is False
    assert policy.get('erpPolicy', {}).get('secretDataPublic') is False
    assert policy.get('publishingSafety', {}).get('ownerReviewRequiredBeforePublish') is True

    trial_copy = trial.get('copy', '')
    for value in ['正式售價 60元／罐', '買10送1｜11罐600元', '買10送1｜11包2,000元', '官方LINE']:
        assert value in trial_copy, f'試喝文案缺少：{value}'
    assert trial.get('poster', {}).get('assetId') == 'post-trial-evergreen-v412'
    assert trial.get('poster', {}).get('format') == 'JPG'
    assert trial.get('publishingSafety', {}).get('preventRepublish') is True

    official_trial_jpg = 'images/posts/approved-v412/guilu-drink-trial-evergreen.jpg'
    assert official_trial_jpg in (ROOT / 'trial.html').read_text(encoding='utf-8'), '試喝頁未使用指定正式JPG海報'

    variants_runtime = (ROOT / 'site-official-product-variants.js').read_text(encoding='utf-8')
    site_entry = (ROOT / 'site.js').read_text(encoding='utf-8')
    variant_pages = {
        'products.html': (ROOT / 'products.html').read_text(encoding='utf-8'),
        'choose.html': (ROOT / 'choose.html').read_text(encoding='utf-8'),
        'guide.html': (ROOT / 'guide.html').read_text(encoding='utf-8'),
        'combo.html': (ROOT / 'combo.html').read_text(encoding='utf-8'),
        'faq.html': (ROOT / 'faq.html').read_text(encoding='utf-8'),
        'brand-facts.html': (ROOT / 'brand-facts.html').read_text(encoding='utf-8'),
        'product-guilu-tangkuai.html': (ROOT / 'product-guilu-tangkuai.html').read_text(encoding='utf-8'),
    }
    for spec in EXPECTED_TANGKUAI_VARIANTS:
        assert spec in variants_runtime, f'動態規格顯示層缺少：{spec}'
        for page, source in variant_pages.items():
            assert spec in source, f'{page}缺少龜鹿湯塊規格：{spec}'
    assert 'site-official-product-variants.js' in site_entry, '全站入口未載入正式規格顯示層'

    public_text = '\n'.join([
        json.dumps(posts_doc, ensure_ascii=False),
        json.dumps(assets_doc, ensure_ascii=False),
        json.dumps(trial, ensure_ascii=False),
        json.dumps(data, ensure_ascii=False),
        json.dumps(official_config, ensure_ascii=False),
        json.dumps(official_assets, ensure_ascii=False),
    ])
    for value in FORBIDDEN_OLD_TEXT:
        assert value not in public_text, f'公開正式資料仍含舊內容：{value}'

    print(
        'PASS 官網與公開內容母本驗收：'
        f'六個產品分類、八個正式規格、龜鹿湯塊75/300/600g、{len(posts)}篇現有貼文'
        f'（已發布鎖定{published_count}、其餘{pending_count}）、每篇唯一可追溯圖片、指定試喝JPG、'
        '防私人資料外洩與防重發鎖全部通過；貼文與素材數量不設人為門檻。'
    )


if __name__ == '__main__':
    main()
