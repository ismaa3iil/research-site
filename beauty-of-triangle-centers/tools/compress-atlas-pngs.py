"""Convert referenced web-atlas PNG copies to the established lossless 1-bit format.

The source render cache is not modified. Existing 1-bit files are left intact.
Pillow's default monochrome conversion matches the previously published atlas
images pixel-for-pixel, including its density-preserving dithering.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_PATH = ROOT / "data" / "atlas.json"
METHODS = ("interestingness", "compressibility", "modifiedCompression")


def main() -> None:
    atlas = json.loads(ATLAS_PATH.read_text(encoding="utf-8-sig"))
    image_paths = sorted(
        {
            ROOT / comparison[method]["image"]
            for comparison in atlas["comparisons"]
            for method in METHODS
        }
    )
    converted = 0
    before = 0
    after = 0
    for path in image_paths:
        before += path.stat().st_size
        with Image.open(path) as source:
            if source.mode != "1":
                output = source.convert("1")
                temporary = path.with_suffix(".publishing.png")
                output.save(temporary, format="PNG", optimize=True)
                temporary.replace(path)
                converted += 1
        after += path.stat().st_size
    print(f"Referenced images: {len(image_paths)}")
    print(f"Converted images: {converted}")
    print(f"Before bytes: {before}")
    print(f"After bytes: {after}")


if __name__ == "__main__":
    main()
