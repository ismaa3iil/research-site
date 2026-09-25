"""Build lossless, tightly framed display crops for the quadtree Top 120.

The source PNGs contain a thin full-canvas border that prevents ordinary CSS
cropping from finding the actual attractor. This script ignores that border,
finds the dark-pixel bounds, adds a small margin, preserves the atlas aspect
ratio, and crops without resampling. Original PNGs remain unchanged and are
still used for downloads.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


SOURCE_WIDTH = 6667
SOURCE_HEIGHT = 5779
SOURCE_ASPECT = SOURCE_WIDTH / SOURCE_HEIGHT
BORDER_IGNORE = 64
PADDING_FRACTION = 0.025


def dark_bounds_without_border(image: Image.Image) -> tuple[int, int, int, int]:
    gray = image.convert("L")
    mask = gray.point(lambda value: 255 if value < 128 else 0)
    width, height = mask.size
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 0, width - 1, BORDER_IGNORE - 1), fill=0)
    draw.rectangle((0, height - BORDER_IGNORE, width - 1, height - 1), fill=0)
    draw.rectangle((0, 0, BORDER_IGNORE - 1, height - 1), fill=0)
    draw.rectangle((width - BORDER_IGNORE, 0, width - 1, height - 1), fill=0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("No plotted pixels found after removing the canvas border")
    return bounds


def expand_crop(
    bounds: tuple[int, int, int, int], width: int, height: int
) -> tuple[int, int, int, int]:
    left, top, right, bottom = bounds
    content_width = right - left
    content_height = bottom - top
    padding = max(24, round(max(content_width, content_height) * PADDING_FRACTION))

    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(width, right + padding)
    bottom = min(height, bottom + padding)

    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    crop_width = right - left
    crop_height = bottom - top

    if crop_width / crop_height < SOURCE_ASPECT:
        crop_width = round(crop_height * SOURCE_ASPECT)
    else:
        crop_height = round(crop_width / SOURCE_ASPECT)

    crop_width = min(crop_width, width)
    crop_height = min(crop_height, height)
    left = round(center_x - crop_width / 2)
    top = round(center_y - crop_height / 2)
    left = min(max(0, left), width - crop_width)
    top = min(max(0, top), height - crop_height)
    return left, top, left + crop_width, top + crop_height


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
    )
    args = parser.parse_args()

    root = args.project_root.resolve()
    atlas_path = root / "data" / "atlas.json"
    output_dir = root / "images" / "quadtree-tight"
    output_dir.mkdir(parents=True, exist_ok=True)

    atlas = json.loads(atlas_path.read_text(encoding="utf-8-sig"))
    generated: set[str] = set()

    for pair in atlas["pairs"]:
        diagram = pair["quadtree"]
        diagram_id = diagram["diagramId"]
        source_path = root / diagram["image"]
        output_name = f"{diagram_id}_50k-tight.png"
        output_path = output_dir / output_name

        with Image.open(source_path) as source:
            if source.size != (SOURCE_WIDTH, SOURCE_HEIGHT):
                raise ValueError(f"Unexpected source dimensions for {diagram_id}: {source.size}")
            bounds = dark_bounds_without_border(source)
            crop_box = expand_crop(bounds, *source.size)
            crop = source.crop(crop_box)
            crop.save(output_path, format="PNG", optimize=True)

        diagram["displayImage"] = f"images/quadtree-tight/{output_name}"
        diagram["displayWidth"] = crop.width
        diagram["displayHeight"] = crop.height
        generated.add(output_name)
        print(f"{diagram_id}: {source.size[0]}x{source.size[1]} -> {crop.width}x{crop.height}")

    for path in output_dir.glob("*.png"):
        if path.name not in generated:
            path.unlink()

    atlas_path.write_text(json.dumps(atlas, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(generated)} lossless display crops and updated {atlas_path}")


if __name__ == "__main__":
    main()
