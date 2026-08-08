#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
V6 = ROOT / "publishing-center-data-v6.js"
V7 = ROOT / "publishing-center-data-v7.js"
MANIFEST = ROOT / "content/post-bank-v6-manifest.json"
QUEUE = ROOT / "content/image-generation-queue-v20260808.json"


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    v6 = V6.read_text(encoding="utf-8")
    v7 = V7.read_text(encoding="utf-8")
    combined = v6 + "\n" + v7
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))

    require("posts.length!==300" in v6, "v6 必須明確驗證300篇")
    require("extra.length!==177" in v7, "v7 必須明確驗證177篇")
    require("bossCount!==32||companionCount!==16" in v7, "v7 必須驗證32篇小老闆與16篇陪伴角色")

    forbidden_patterns = [
        r"龜鹿湯塊\s*300\s*g",
        r"龜鹿湯塊\s*600\s*g",
        r"guilu-tangkuai-300",
        r"guilu-tangkuai-600",
        r"小老闆出現時小鹿與小烏龜必須一起出現",
        r"PRODUCTS\.length\s*!==\s*8",
    ]
    for pattern in forbidden_patterns:
        require(not re.search(pattern, combined, flags=re.I), f"500篇母生成器仍含舊規則：{pattern}")

    official_ids = ["guilu-gao", "guilu-drink-30", "guilu-drink-180", "guilu-tangkuai", "guilu-jiao", "luerong-fen"]
    for product_id in official_ids:
        require(product_id in v6, f"v6 缺少正式產品：{product_id}")
    require("只有75g深藍正式盒裝" in v6, "v6 未鎖龜鹿湯塊75g-only")
    require("姿勢依情境自由變化" in combined, "生成器未同步小老闆自由姿勢")
    require("不是每張強制出現" in combined, "生成器未同步夥伴非每張必出現")

    counts = manifest.get("counts", {})
    require(counts.get("base") == 23, "base貼文數不是23")
    require(counts.get("generatedCopyQueueV6") == 300, "v6 manifest不是300")
    require(counts.get("generatedCopyQueueV7") == 177, "v7 manifest不是177")
    require(counts.get("runtimeTotal") == 500, "runtime總數不是500")
    require(counts.get("activeImageGenerationRequired") == 465, "待生成圖片數不是465")
    require(counts.get("existingCandidateNeeds16PointReview") == 21, "候選待16項審核數不是21")

    queue_summary = queue.get("summary", {})
    require(queue.get("runtimeContentTotal") == 500, "圖片佇列runtimeContentTotal不是500")
    require(queue_summary.get("generationRequiredActive") == 465, "圖片佇列待生成數與manifest不一致")
    require(queue_summary.get("existingCandidateNeeds16PointReview") == 21, "圖片佇列候選數與manifest不一致")
    require(queue_summary.get("publishedFinalLocked") == 3, "已發布鎖定數不是3")
    require(queue_summary.get("campaignHold") == 11, "活動冷卻數不是11")

    pillars = manifest.get("generatedCopyQueueByPillar", {})
    require(sum(int(v) for v in pillars.values()) == 477, "生成文案分類合計必須為477，與base23合計500")
    require(pillars.get("小老闆與夥伴") == 32, "小老闆內容數不是32")
    require(pillars.get("陪伴角色") == 16, "陪伴角色內容數不是16")
    require(pillars.get("FAQ") == 48, "FAQ內容數不是48")
    require(pillars.get("試喝活動") == 12, "試喝內容數不是12")

    print("PASS post bank generators: base23 + v6 300 + v7 177 = 500; six current products only; image queue 465/21/3/11")


if __name__ == "__main__":
    main()
