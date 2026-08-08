#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DETAILS={
 'product-guilu-gao.html':'images/products-v2/guilu-gao.jpeg',
 'product-guilu-drink-30cc.html':'images/products-v2/guilu-drink-30.jpeg',
 'product-guilu-drink-180cc.html':'images/products-v2/guilu-drink-180.jpeg',
 'product-guilu-tangkuai.html':'images/products-v2/guilu-tangkuai.jpeg',
 'product-guilu-jiao.html':'images/products-v2/guilu-jiao-open-new.jpg',
 'product-luerong-fen.html':'images/products-v2/luerong-fen.jpeg',
}

def text(path): return (ROOT/path).read_text(encoding='utf-8')
def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    for page,photo in DETAILS.items():
        body=text(page)
        req(photo in body,f'{page} 未直接使用 products-v2 實際產品照片')
        req('images/products-v3/' not in body,f'{page} 仍含 products-v3 宣傳版面')
        req('images/dm-final/' not in body,f'{page} 仍含舊DM作產品表面')
        req('實際產品照片' in body,f'{page} 未明確標示實際產品照片')
    knowledge=text('knowledge.html')
    req('五種型態' not in knowledge,'知識專區仍有「五種型態」舊說法')
    req('六項正式產品・六項正式規格' in knowledge,'知識專區未明確寫六產品六規格')
    trial=text('trial.html')
    req('約5～7個工作天出貨' not in trial,'試喝頁仍把製作期寫成直接出貨期')
    req('製作加工約需5～7個工作天' in trial and '完成後才安排出貨' in trial,'試喝頁製作／出貨分段說法不完整')
    dm=text('dm.html')
    req('images/products-v3/' not in dm,'產品圖文頁仍用products-v3作產品照片')
    req('images/products-v2/' in dm and '宣傳版面' in dm,'產品圖文頁未鎖products-v2實際照片權威')
    products=text('products.html')
    req('製作加工約5～7個工作天，完成後安排出貨' in products,'產品總覽龜鹿飲製作與出貨說法未更新')
    print('PASS new-recording public fixes: six product detail pages use products-v2; six-product wording and drink lead-time corrected')

if __name__=='__main__': main()
