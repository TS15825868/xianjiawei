#!/usr/bin/env python3
"""Compatibility entrypoint for current review workflow and dynamic AI facts."""
from pathlib import Path
import runpy

ROOT=Path(__file__).resolve().parents[1]

def main():
    ai=(ROOT/'publishing-center-ai-tools.js').read_text(encoding='utf-8')
    assert 'public-product-master.json' in ai and 'currentRules()' in ai, 'AI重生成必須讀取最新公開產品權威'
    assert '正式產品只有六項、六個規格' not in ai, 'AI重生成不得固定產品數'
    assert "window.open('about:blank','_blank')" in ai, 'iPhone必須在點擊時預留重生成視窗'
    assert 'new Set(ids).size!==ids.length' in ai and "ids.includes('qixuan-guilu-drink-powder')" in ai, '母資料錯誤或暫緩品項不得生成公開提示'
    runpy.run_path(str(ROOT/'tools/validate-publishing-content-match-v20260809.py'),run_name='__main__')
    print('PASS current review workflow and dynamic AI regeneration authority')

if __name__=='__main__':main()
