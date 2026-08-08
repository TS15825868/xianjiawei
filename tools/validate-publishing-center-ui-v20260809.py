#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'publishing-center-v2.js').read_text(encoding='utf-8')
HTML=(ROOT/'publishing-center.html').read_text(encoding='utf-8')
BRIDGE=(ROOT/'publishing-center-erp-bridge.js').read_text(encoding='utf-8')
STATE_CSS=(ROOT/'publishing-center-state-v20260809.css').read_text(encoding='utf-8')


def req(ok,message):
    if not ok:
        raise AssertionError(message)


def main():
    req("public-post-library.json?v=20260809-06" in JS,'publishing-center-v2 未讀最新版基礎母本')
    req("function needsGeneration" in JS and "return'needs-image'" in JS,'needs_generation 尚未成為一級UI狀態')
    req("這篇目前標記為「需重生成」" in JS,'公開預審缺少需重生成硬擋')
    req("disabled title=\"需先換上可審核的新圖\"" in JS or "disabled title=\"需先換上新候選圖\"" in JS,'需重生成卡片未停用預審按鈕')
    req("重新生成符合文案" in JS and "需重生成" in JS,'卡片未清楚顯示重生成狀態')
    req("請直接使用圖像生成能力" in JS and "不要只回提示詞" in JS,'ChatGPT按鈕沒有要求直接生成候選圖')
    for value in ['images/products-v3/guilu-gao.jpg','images/products-v3/guilu-drink-30.jpg','images/products-v3/guilu-drink-180.jpg','images/products-v3/guilu-tangkuai.jpg','images/products-v3/guilu-jiao.jpg','images/products-v3/luerong-fen.jpg']:
        req(value in JS,f'ChatGPT生成缺正式原圖：{value}')
    for value in ['Ø42×H51','51×78','0.64','8%','不得為排版強制等高或等寬']:
        req(value in JS,f'發佈中心UI缺少正式尺寸／構圖規則：{value}')
    req("publishing-center-v2.js?v=20260809-07" in HTML,'HTML未強制載入新版needs-generation UI')
    req('publishing-center-state-v20260809.css?v=20260809-01' in HTML,'HTML未載入需重生成警示樣式')
    req('>需重生成／待更換<' in HTML,'狀態篩選仍未清楚標示需重生成')
    req('.status.needs-image' in STATE_CSS and '[data-image-status="needs-image"]' in STATE_CSS,'需重生成狀態缺少獨立可視化樣式')
    req("requiresGeneration(post)" in BRIDGE and "const sourceImage=mustRegenerate?'':" in BRIDGE,'ERP bridge仍可能帶入needs-generation舊圖')
    req("requires_image_generation:mustRegenerate" in BRIDGE,'ERP bridge未傳遞需重生成旗標')
    print('PASS publishing center UI: visible needs-generation state, no preapproval without new image, products-v3 direct generation, ERP image-free handoff')


if __name__=='__main__':
    main()
