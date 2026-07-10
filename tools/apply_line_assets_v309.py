from __future__ import annotations

import base64
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / ".line-assets-v309"

FILES = {
    "welcome": ("xianjiawei-mascot-line-welcome-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-welcome.jpg", (1200, 900)),
    "products": ("xianjiawei-mascot-line-products-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-products.jpg", (1200, 900)),
    "recommend": ("xianjiawei-mascot-line-recommend-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-recommend.jpg", (1200, 900)),
    "combo": ("xianjiawei-mascot-line-combo-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-combo.jpg", (1200, 900)),
    "usage": ("xianjiawei-mascot-line-usage-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-usage.jpg", (1200, 900)),
    "faq": ("xianjiawei-mascot-line-faq-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-faq.jpg", (1200, 900)),
    "service": ("xianjiawei-mascot-line-service-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-service.jpg", (1200, 900)),
    "brand": ("xianjiawei-mascot-line-brand-v309.jpg", ROOT / "images/line-mascot/xianjiawei-mascot-line-brand.jpg", (1200, 900)),
    "richmenu": ("xianjiawei-rich-menu-2500x1686-v309.jpg", ROOT / "images/line/xianjiawei-rich-menu-2500x1686-v309.jpg", (2500, 1686)),
}


def decode_asset(prefix: str, original_name: str, destination: Path, expected_size: tuple[int, int]) -> None:
    chunks = sorted(STAGE.glob(f"{prefix}.part*.b64"))
    if not chunks:
        raise FileNotFoundError(f"missing staged chunks for {prefix}")
    encoded = "".join(part.read_text(encoding="ascii").strip() for part in chunks)
    raw = base64.b64decode(encoded, validate=True)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(raw)
    with Image.open(destination) as image:
        if image.size != expected_size:
            raise ValueError(f"{destination}: expected {expected_size}, got {image.size}")
        image.verify()
    print(f"decoded {original_name} -> {destination.relative_to(ROOT)} ({len(raw)} bytes)")


for key, (name, destination, expected_size) in FILES.items():
    decode_asset(key, name, destination, expected_size)

# Remove only obsolete LINE-specific mascot variants; the website's current scene images are kept intact.
for old in (ROOT / "images/line-mascot").glob("*-v30*.jpg"):
    old.unlink(missing_ok=True)

shutil.rmtree(STAGE, ignore_errors=True)
print("LINE OA v309 image assets applied successfully")
