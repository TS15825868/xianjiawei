#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import re
from pathlib import Path

OUTPUT = Path("images/posts/generated/post-ingredient-principle.webp")
PART_ROOT = Path("artifacts/uploads")
EXPECTED_NAMES = [f"ingredient-q3.part-{index:02d}.b64" for index in range(8)]
EXPECTED_LENGTHS = [6000, 6000, 6000, 6000, 6000, 6000, 6000, 5848]
EXPECTED_BASE64_LENGTH = 47848
EXPECTED_SIZE = 35886
EXPECTED_SHA256 = "b44b5b1d62f0efc770fd077b6dac541abc192046cc1b52743d0e797e4405b1c3"


def verify_image(data: bytes) -> None:
    if len(data) != EXPECTED_SIZE:
        raise SystemExit(f"圖片大小錯誤：{len(data)}，預期 {EXPECTED_SIZE}")
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_sha != EXPECTED_SHA256:
        raise SystemExit(f"圖片 SHA256 錯誤：{actual_sha}")
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise SystemExit("圖片不是有效 WebP RIFF")


def decode_parts() -> bytes:
    parts = sorted(PART_ROOT.glob("ingredient-q3.part-*.b64"))
    actual_names = [part.name for part in parts]
    if actual_names != EXPECTED_NAMES:
        raise SystemExit(f"安全分片不完整：{actual_names}")

    encoded_parts: list[str] = []
    for part, expected_length in zip(parts, EXPECTED_LENGTHS):
        text = "".join(part.read_text(encoding="utf-8").split())
        if len(text) != expected_length:
            raise SystemExit(
                f"{part.name} 長度錯誤：{len(text)}，預期 {expected_length}"
            )
        if not re.fullmatch(r"[A-Za-z0-9+/=]+", text):
            raise SystemExit(f"{part.name} 含非 Base64 字元")
        encoded_parts.append(text)

    encoded = "".join(encoded_parts)
    if len(encoded) != EXPECTED_BASE64_LENGTH:
        raise SystemExit(
            f"合併後 Base64 長度錯誤：{len(encoded)}，預期 {EXPECTED_BASE64_LENGTH}"
        )
    try:
        return base64.b64decode(encoded, validate=True)
    except Exception as exc:  # pragma: no cover - CI diagnostic path
        raise SystemExit(f"Base64 解碼失敗：{exc}") from exc


def main() -> None:
    if OUTPUT.is_file():
        data = OUTPUT.read_bytes()
    else:
        data = decode_parts()
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(data)

    verify_image(data)
    print(
        f"PASS {OUTPUT}: {len(data)} bytes, "
        f"SHA-256 {hashlib.sha256(data).hexdigest()}"
    )


if __name__ == "__main__":
    main()
