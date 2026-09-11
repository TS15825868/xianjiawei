#!/usr/bin/env bash
set -euo pipefail

SOURCE="${1:-}"
CAPTION="${2:-}"
MUSIC="${3:-}"
OUT="${4:-artifacts/xianjiawei-video-candidate.mp4}"

if [[ -z "$SOURCE" || ! -f "$SOURCE" ]]; then
  echo "ERROR: source video not found: $SOURCE" >&2
  exit 2
fi

lower_source="$(printf '%s' "$SOURCE" | tr '[:upper:]' '[:lower:]')"
if [[ "$lower_source" =~ archive|preview|video_free|not-for-publish ]]; then
  echo "ERROR: rejected/archive source is forbidden for formal candidate pipeline: $SOURCE" >&2
  exit 3
fi

if [[ -n "$CAPTION" && ! -f "$CAPTION" ]]; then
  echo "ERROR: caption file not found: $CAPTION" >&2
  exit 4
fi
if [[ -n "$MUSIC" && ! -f "$MUSIC" ]]; then
  echo "ERROR: music file not found: $MUSIC" >&2
  exit 5
fi

mkdir -p "$(dirname "$OUT")"

DUR="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$SOURCE")"
WIDTH="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$SOURCE")"
HEIGHT="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$SOURCE")"

python3 - "$DUR" "$WIDTH" "$HEIGHT" <<'PY'
import sys
D=float(sys.argv[1]); W=int(sys.argv[2]); H=int(sys.argv[3])
if not (2.0 <= D <= 60.0):
    raise SystemExit(f"ERROR: formal short-video source duration must be 2-60s, got {D:.2f}s")
if W < 480 or H < 480:
    raise SystemExit(f"ERROR: source resolution too small: {W}x{H}")
print(f"PASS source container: {W}x{H}, {D:.2f}s")
PY

HAS_AUDIO=0
if ffprobe -v error -select_streams a:0 -show_entries stream=index -of csv=p=0 "$SOURCE" | grep -q .; then
  HAS_AUDIO=1
fi

# Preserve the complete source frame. Never crop formal character/product imagery.
VF="scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xF7F4ED"
if [[ -n "$CAPTION" ]]; then
  # Repository paths must not contain a colon. Use brand-safe Traditional Chinese font.
  CAP_ESC="${CAPTION//\\/\\\\}"
  CAP_ESC="${CAP_ESC//:/\\:}"
  VF+=",subtitles=${CAP_ESC}:force_style='FontName=Noto Sans CJK TC,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00303030,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=150'"
fi

COMMON_VIDEO=(
  -vf "$VF"
  -r 30
  -c:v libx264
  -profile:v high
  -level 4.1
  -pix_fmt yuv420p
  -preset medium
  -crf 20
  -movflags +faststart
)

if [[ -n "$MUSIC" && "$HAS_AUDIO" -eq 1 ]]; then
  ffmpeg -y -i "$SOURCE" -stream_loop -1 -i "$MUSIC" \
    "${COMMON_VIDEO[@]}" \
    -filter_complex "[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[a0];[1:a]volume=0.08,atrim=duration=${DUR}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[a]" \
    -map 0:v:0 -map "[a]" -c:a aac -b:a 160k -t "$DUR" "$OUT"
elif [[ -n "$MUSIC" ]]; then
  ffmpeg -y -i "$SOURCE" -stream_loop -1 -i "$MUSIC" \
    "${COMMON_VIDEO[@]}" \
    -map 0:v:0 -map 1:a:0 -c:a aac -b:a 160k -t "$DUR" "$OUT"
elif [[ "$HAS_AUDIO" -eq 1 ]]; then
  ffmpeg -y -i "$SOURCE" \
    "${COMMON_VIDEO[@]}" \
    -map 0:v:0 -map 0:a:0 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 160k "$OUT"
else
  ffmpeg -y -i "$SOURCE" \
    "${COMMON_VIDEO[@]}" \
    -map 0:v:0 -an "$OUT"
fi

OUT_DUR="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT")"
OUT_W="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$OUT")"
OUT_H="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$OUT")"

python3 - "$DUR" "$OUT_DUR" "$OUT_W" "$OUT_H" "$SOURCE" "$CAPTION" "$MUSIC" "$OUT" <<'PY'
import json, os, sys
src_dur=float(sys.argv[1]); out_dur=float(sys.argv[2]); w=int(sys.argv[3]); h=int(sys.argv[4])
source, caption, music, out = sys.argv[5:9]
if (w,h)!=(1080,1920):
    raise SystemExit(f"ERROR: output must be 1080x1920, got {w}x{h}")
if abs(out_dur-src_dur) > 0.6:
    raise SystemExit(f"ERROR: duration drift too large: source={src_dur:.2f}, output={out_dur:.2f}")
qa={
  "status":"candidate-review-required",
  "source":source,
  "output":out,
  "resolution":"1080x1920",
  "durationSeconds":round(out_dur,3),
  "captions":caption or None,
  "music":music or None,
  "technicalChecks":"passed",
  "manualBrandReviewRequired":True,
  "mustReview":[
    "角色與夥伴是否完全符合正式版本",
    "場景／情境／動作是否自然且不是拼貼紙偶",
    "字幕是否為正確繁體中文且專有名詞無誤",
    "產品外觀與比例是否完全正確",
    "正式Logo是否正確",
    "無療效宣稱、無亂碼、無錯誤AI文字"
  ],
  "autoPublish":False
}
qa_path=os.path.splitext(out)[0]+"-qa.json"
with open(qa_path,"w",encoding="utf-8") as f:
    json.dump(qa,f,ensure_ascii=False,indent=2)
    f.write("\n")
print(f"PASS output candidate: {out}")
print(f"QA: {qa_path}")
print("IMPORTANT: technical PASS is not publication approval.")
PY
