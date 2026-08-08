#!/usr/bin/env python3
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    site_js = (ROOT / "site.js").read_text(encoding="utf-8")
    hotfix = (ROOT / "site-ux-v4104.css").read_text(encoding="utf-8")
    character = json.loads((ROOT / "brand-character-spec.json").read_text(encoding="utf-8"))
    visual = json.loads((ROOT / "content/visual-production-spec-v20260807.json").read_text(encoding="utf-8"))
    ai = json.loads((ROOT / "content/ai-brand-control-v20260807.json").read_text(encoding="utf-8"))

    require("site-ux-v4104.css" in site_js, "site.js 必須全站載入 v410.4 手機／圖片比例修正")
    require("product-grid{grid-template-columns:1fr!important" in hotfix.replace(" ", ""), "窄手機產品卡必須改單欄")
    require("object-fit:contain!important" in hotfix.replace(" ", ""), "正式產品與小老闆圖必須 contain")
    require(".table-scroll{display:none!important" in hotfix.replace(" ", ""), "手機比較表必須隱藏桌面表格")
    require(".mobile-compare-cards{display:block!important" in hotfix.replace(" ", ""), "手機必須使用比較卡")

    sitemap = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text or "" for node in sitemap.findall("sm:url/sm:loc", ns)]
    html_names = []
    for url in urls:
        name = url.rsplit("/", 1)[-1] or "index.html"
        if not name.endswith(".html"):
            continue
        if name in {"publishing-center.html"}:
            continue
        path = ROOT / name
        if not path.exists():
            continue
        html_names.append(name)
        html = path.read_text(encoding="utf-8")
        require("site.js" in html, f"{name} 未載入全站核心 site.js")

    require(len(html_names) >= 12, f"納入全站核心驗收的頁面過少：{len(html_names)}")

    mascot = character.get("mascot", {})
    partners = character.get("partners", {})
    require("網站原版柔和立體Q版" in mascot.get("style", ""), "角色母本必須鎖網站原版柔和立體Q版")
    require("任何合理姿勢皆可" in mascot.get("posePolicy", ""), "小老闆姿勢必須允許自由變化")
    require(partners.get("requiredEveryImage") is False, "小鹿小烏龜不應每張強制出現")

    visual_mascot = visual.get("mascot", {})
    require(visual_mascot.get("companions_required_every_image") is False, "視覺規範仍強制每張夥伴")
    require("姿勢可以自由變化" in visual_mascot.get("pose_policy", ""), "視覺規範未同步自由姿勢")
    require("approved-v405" in visual_mascot.get("reference", ""), "視覺規範未指向網站正式小老闆母圖")

    ai_rules = ai.get("imageRules", {})
    require("姿勢可自由變化" in ai_rules.get("mascot", ""), "AI控制檔未同步自由姿勢")
    require("不是每張強制出現" in ai_rules.get("mascotCompanions", ""), "AI控制檔仍強制每張夥伴")
    require(ai.get("generationRouting", {}).get("queueSummary", {}).get("activeGenerationRequired") == 465, "圖片生成佇列數量未同步")
    require(ai.get("generationRouting", {}).get("queueSummary", {}).get("candidateReviewRequired") == 21, "候選待審數量未同步")

    print(f"PASS mobile/mascot runtime: {len(html_names)} public pages use site.js; v410.4 and approved website chibi rules are locked")


if __name__ == "__main__":
    main()
