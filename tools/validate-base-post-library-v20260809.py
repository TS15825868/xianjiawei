#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content/public-post-library.json').read_text(encoding='utf-8'))
POSTS = {p['id']: p for p in DATA.get('posts', [])}


def req(ok: bool, message: str):
    if not ok:
        raise AssertionError(message)


def main():
    req(DATA.get('version') == '2026-08-09-public-posts-v6-formal-image-state', '公開基礎貼文母本版本錯誤')
    req(len(POSTS) == 23, f'基礎母本應為23篇，目前{len(POSTS)}篇')
    req(DATA.get('productAuthority', {}).get('imageAuthority') == 'images/products-v3/', '基礎母本未鎖 products-v3')
    req(DATA.get('productAuthority', {}).get('physicalScaleAuthority') == 'content/product-physical-scale-authority-v20260809.json', '基礎母本未指向尺寸權威')

    forced = {
        'POST-PRODUCT-OVERVIEW',
        'POST-COMBO',
        'POST-GUIDE',
        'POST-CHOOSE',
        'POST-CHOOSE-BY-HABIT',
    }
    for pid in forced:
        p = POSTS[pid]
        req(p.get('image_status') == 'needs_generation', f'{pid} 必須維持 needs_generation')
        req(not p.get('image_url'), f'{pid} 不得帶舊 image_url')
        req(not p.get('image_asset_id'), f'{pid} 不得綁舊 image_asset_id')
        req(p.get('regeneration_mode') == 'chatgpt_handoff', f'{pid} 必須走 ChatGPT 重生成')

    safe = {
        'XJW-WORK-REST-001': 'work-rest.svg',
        'POST-STORAGE': 'storage.svg',
        'POST-SEASONS-RHYTHM': 'four-seasons.svg',
        'POST-INGREDIENT-PRINCIPLE': 'ingredient-principle.svg',
        'POST-DAILY-SOUP': 'daily-soup.svg',
        'POST-WEATHER-HOT': 'weather-hot.svg',
        'POST-WEATHER-TEMP': 'weather-temp.svg',
        'POST-WEATHER-RAIN': 'weather-rain.svg',
        'POST-STORE': 'contact-line.svg',
        'POST-RECIPES': 'recipes.svg',
    }
    for pid, filename in safe.items():
        p = POSTS[pid]
        req('generated-v20260808-preflight/' + filename in str(p.get('image_url', '')), f'{pid} 未使用安全預檢候選 {filename}')
        req(p.get('image_status') in {'candidate-review-required', 'live-check-required'}, f'{pid} 預檢狀態錯誤')

    single_product_paths = {
        'POST-GAO-100': 'images/products-v3/guilu-gao.jpg',
        'POST-DRINK-30': 'images/products-v3/guilu-drink-30.jpg',
        'POST-DRINK-180': 'images/products-v3/guilu-drink-180.jpg',
        'POST-SOUP-75': 'images/products-v3/guilu-tangkuai.jpg',
        'POST-JIAO-600': 'images/products-v3/guilu-jiao.jpg',
        'POST-LUERONG': 'images/products-v3/luerong-fen.jpg',
    }
    for pid, path in single_product_paths.items():
        p = POSTS[pid]
        req(path in str(p.get('image_url', '')), f'{pid} 未直接使用 products-v3 正式原圖')
        req(p.get('image_status') == 'official-reference-pending-layout-review', f'{pid} 正式原圖仍須版面審核')

    trial = POSTS['POST-GUILU-DRINK-TRIAL-EVERGREEN']
    req(trial.get('status') == 'published', '試喝正式貼文必須保持已發布鎖定')
    req(trial.get('do_not_regenerate') is True and trial.get('prevent_republish') is True, '試喝正式貼文必須禁止重生成與重發')
    req('guilu-drink-trial-final-20260808-web.svg' in str(trial.get('image_url', '')), '試喝正式貼文必須使用600×600 Web正式圖，不得退回preview')

    raw = (ROOT / 'content/public-post-library.json').read_text(encoding='utf-8')
    req('images/products-v2/' not in raw, '基礎母本不得引用 products-v2')
    req('30cc／瓶' not in raw and '30cc玻璃瓶' not in raw and '小玻璃瓶' not in raw, '基礎母本仍含30cc瓶型舊稱')

    print('PASS base post library: 5 forced regenerations, 10 safe preflights, 6 products-v3 originals, trial web lock')


if __name__ == '__main__':
    main()
