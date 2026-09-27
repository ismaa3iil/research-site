"""Add lossless client-side crop and orientation metadata to the three-way atlas.

No derivative bitmap is written. The browser displays a tight viewport into the
original 6,667 x 5,779 PNG, so every visible point retains source resolution and
the Git repository does not acquire a second copy of each large image.
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
METHODS = ("interestingness", "compressibility", "modifiedCompression")


def dark_mask(image: Image.Image) -> Image.Image:
    mask = image.convert("L").point(lambda value: 255 if value < 128 else 0)
    width, height = mask.size
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 0, width - 1, BORDER_IGNORE - 1), fill=0)
    draw.rectangle((0, height - BORDER_IGNORE, width - 1, height - 1), fill=0)
    draw.rectangle((0, 0, BORDER_IGNORE - 1, height - 1), fill=0)
    draw.rectangle((width - BORDER_IGNORE, 0, width - 1, height - 1), fill=0)
    return mask


def expand_crop(bounds: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    left, top, right, bottom = bounds
    content_width = right - left
    content_height = bottom - top
    padding = max(24, round(max(content_width, content_height) * PADDING_FRACTION))
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(SOURCE_WIDTH, right + padding)
    bottom = min(SOURCE_HEIGHT, bottom + padding)
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    crop_width = right - left
    crop_height = bottom - top
    if crop_width / crop_height < SOURCE_ASPECT:
        crop_width = round(crop_height * SOURCE_ASPECT)
    else:
        crop_height = round(crop_width / SOURCE_ASPECT)
    crop_width = min(crop_width, SOURCE_WIDTH)
    crop_height = min(crop_height, SOURCE_HEIGHT)
    left = min(max(0, round(center_x - crop_width / 2)), SOURCE_WIDTH - crop_width)
    top = min(max(0, round(center_y - crop_height / 2)), SOURCE_HEIGHT - crop_height)
    return left, top, left + crop_width, top + crop_height


def visual_orientation_score(mask: Image.Image) -> float:
    bounds = mask.getbbox()
    if bounds is None:
        return 0.0
    sample = mask.crop(bounds)
    sample.thumbnail((512, 512), Image.Resampling.NEAREST)
    width, height = sample.size
    pixels = sample.load()
    row_mass: list[float] = []
    row_width: list[float] = []
    for y in range(height):
        columns = [x for x in range(width) if pixels[x, y] > 0]
        row_mass.append(float(len(columns)))
        row_width.append(((columns[-1] - columns[0] + 1) / width) if columns else 0.0)
    total = sum(row_mass)
    if total == 0:
        return 0.0
    ys = [index / max(height - 1, 1) for index in range(height)]
    centroid = sum(y * mass for y, mass in zip(ys, row_mass)) / total
    useful = [(y, width_value, mass**0.5) for y, width_value, mass in zip(ys, row_width, row_mass) if width_value > 0]
    weight_sum = sum(weight for _, _, weight in useful)
    mean_y = sum(y * weight for y, _, weight in useful) / max(weight_sum, 1e-12)
    mean_width = sum(value * weight for _, value, weight in useful) / max(weight_sum, 1e-12)
    numerator = sum(weight * (y - mean_y) * (value - mean_width) for y, value, weight in useful)
    denominator = sum(weight * (y - mean_y) ** 2 for y, _, weight in useful)
    slope = numerator / denominator if denominator else 0.0
    return 2.0 * (centroid - 0.5) + 0.35 * slope


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--source-dir", type=Path, required=True)
    args = parser.parse_args()
    root = args.project_root.resolve()
    source_dir = args.source_dir.resolve()
    atlas_path = root / "data" / "atlas.json"
    atlas = json.loads(atlas_path.read_text(encoding="utf-8-sig"))
    cache: dict[str, tuple[list[int], float]] = {}

    for comparison in atlas["comparisons"]:
        for method in METHODS:
            diagram = comparison[method]
            diagram_id = diagram["diagramId"]
            if diagram_id not in cache:
                path = source_dir / f"{diagram_id}_50k.png"
                with Image.open(path) as source:
                    if source.size != (SOURCE_WIDTH, SOURCE_HEIGHT):
                        raise ValueError(f"Unexpected dimensions for {diagram_id}: {source.size}")
                    mask = dark_mask(source)
                    bounds = mask.getbbox()
                    if bounds is None:
                        raise ValueError(f"No plotted pixels found for {diagram_id}")
                    cache[diagram_id] = (list(expand_crop(bounds)), visual_orientation_score(mask))
            crop, orientation = cache[diagram_id]
            diagram["displayCrop"] = crop
            diagram["rotateForDisplay"] = method == "compressibility" and orientation > 0.0
            diagram["targetOrientation"] = "visually-inverted" if method == "compressibility" else "source"

    atlas_path.write_text(json.dumps(atlas, indent=2) + "\n", encoding="utf-8")
    rotated = sum(1 for comparison in atlas["comparisons"] if comparison["compressibility"]["rotateForDisplay"])
    print(f"Wrote display metadata for {len(cache)} unique images to {atlas_path}")
    print(f"Middle images rotated for display: {rotated}/{atlas['rankCount']}")


if __name__ == "__main__":
    main()
