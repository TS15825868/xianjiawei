#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    html=(ROOT/'publishing-center.html').read_text(encoding='utf-8')
    core=(ROOT/'publishing-center-v2.js').read_text(encoding='utf-8')
    ai=(ROOT/'publishing-center-ai-tools.js').read_text(encoding='utf-8')
    bridge=(ROOT/'publishing-center-erp-bridge.js').read_text(encoding='utf-8')

    forbidden='小老闆出現時小鹿與小烏龜必須一起出現'
    require(forbidden not in html, '發布中心HTML仍含舊強制三角色規則')
    require(forbidden not in core, '發布中心核心仍含舊強制三角色規則')
    require(forbidden not in ai, 'AI重生成仍含舊強制三角色規則')
    require('小鹿與小烏龜不是每張強制出現' in html, 'HTML未顯示現行夥伴規則')
    require('小鹿與小烏龜不是每張強制出現' in core, '核心prompt未同步現行夥伴規則')
    require('小鹿與小烏龜不是每張強制出現' in ai, 'AI工具未同步現行夥伴規則')
    require('姿勢可依情境自由變化' in core, '核心prompt未同步小老闆自由姿勢')
    require('姿勢可依情境自由變化' in ai, 'AI工具未同步小老闆自由姿勢')

    require("scheduleStatus='public-preapproved'" in core, '公開預審狀態未獨立於正式排程')
    require("scheduleStatus='published-manual'" not in core, '核心仍會寫舊假發布狀態')
    require("r.publishedAt=new Date().toISOString()" in core, '本機補登功能消失')
    require('真正發布請使用「匯入ERP草稿並發布」' in core, '核心仍可能假裝立即發布')
    require('匯入ERP草稿並發布' in html, 'HTML未說明ERP安全交接')

    require("schema:'xjw-public-to-erp-v1'" in bridge, 'ERP交接缺少明確schema')
    require('xjw_import=' in bridge, 'ERP交接沒有完整貼文payload')
    require("imported_as:'draft'" in bridge, 'ERP交接未鎖草稿')
    require('approval_required:true' in bridge, 'ERP交接未鎖人工審核')
    require('auto_publish:false' in bridge, 'ERP交接仍可能自動發布')
    require("window.open('about:blank','_blank')" in bridge, 'ERP交接未處理iPhone Safari彈窗限制')
    require('location.replace(url)' in bridge, 'ERP預留視窗沒有安全導向')

    require("document.addEventListener('click',async(event)=>" in ai, '圖片重生成沒有新版capture接管')
    require("event.stopImmediatePropagation()" in ai, '圖片重生成無法阻止舊prompt')
    require("window.open('about:blank','_blank')" in ai, 'ChatGPT重生成未處理iPhone Safari彈窗限制')
    require('正式產品只有六項、六個規格' in ai, 'AI重生成沒有六產品權威')
    require('龜鹿湯塊75g／盒深藍盒' in ai, 'AI重生成未鎖75g湯塊')
    require('30cc玻璃罐' in ai and '不得自行新增產品規格' in ai, 'AI重生成產品規則不完整')

    print('PASS publishing workflow: public pre-review -> popup-safe ERP draft import -> ERP final review/publish; current website mascot authority only')


if __name__=='__main__':
    main()
