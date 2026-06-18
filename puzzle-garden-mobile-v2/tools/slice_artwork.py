#!/usr/bin/env python3
"""Crop generated Puzzle Garden artwork sheets into production assets.

Examples:
  python tools/slice_artwork.py characters sheet.png output/bee output/snail output/robin output/hedgehog
  python tools/slice_artwork.py textures atlas.png output/sudoku output/tiles output/falling output/crates --format webp
  python tools/slice_artwork.py symbols symbols.png output/leaf output/daisy output/acorn output/bee output/can output/apple output/clover output/sun
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable
from PIL import Image, ImageChops

GRID_BY_MODE = {
    "characters": (2, 2),
    "textures": (2, 2),
    "symbols": (4, 2),
}

SIZES_BY_MODE = {
    "characters": (512, 256, 128),
    "textures": (1024, 512),
    "symbols": (256, 128, 64),
}


def parse_hex_color(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        raise argparse.ArgumentTypeError("Background color must use RRGGBB format")
    try:
        return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))  # type: ignore[return-value]
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Background color must be hexadecimal") from exc


def remove_background(image: Image.Image, color: tuple[int, int, int], tolerance: int) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    assert pixels is not None
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = pixels[x, y]
            distance = max(abs(red - color[0]), abs(green - color[1]), abs(blue - color[2]))
            if distance <= tolerance:
                pixels[x, y] = (red, green, blue, 0)
    return rgba


def trim_and_pad(image: Image.Image, padding_fraction: float) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    side = max(rgba.width, rgba.height)
    padding = max(1, round(side * padding_fraction))
    canvas_side = side + padding * 2
    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    canvas.alpha_composite(rgba, ((canvas_side - rgba.width) // 2, (canvas_side - rgba.height) // 2))
    return canvas


def crop_grid(image: Image.Image, columns: int, rows: int) -> Iterable[Image.Image]:
    for row in range(rows):
        top = round(row * image.height / rows)
        bottom = round((row + 1) * image.height / rows)
        for column in range(columns):
            left = round(column * image.width / columns)
            right = round((column + 1) * image.width / columns)
            yield image.crop((left, top, right, bottom))


def save_variants(image: Image.Image, base_path: Path, sizes: tuple[int, ...], output_format: str, quality: int) -> None:
    base_path.parent.mkdir(parents=True, exist_ok=True)
    for size in sizes:
        resized = image.resize((size, size), Image.Resampling.LANCZOS)
        suffix = ".webp" if output_format == "webp" else ".png"
        target = base_path.with_name(f"{base_path.name}-{size}").with_suffix(suffix)
        if output_format == "webp":
            resized.save(target, "WEBP", quality=quality, method=6, lossless=quality >= 100)
        else:
            resized.save(target, "PNG", optimize=True)
        print(target)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=GRID_BY_MODE)
    parser.add_argument("input", type=Path)
    parser.add_argument("outputs", nargs="+", type=Path, help="Base output paths in left-to-right, top-to-bottom order")
    parser.add_argument("--format", choices=("png", "webp"), default="png")
    parser.add_argument("--quality", type=int, default=92)
    parser.add_argument("--padding", type=float, default=0.12, help="Transparent padding as a fraction of the trimmed side")
    parser.add_argument("--background", type=parse_hex_color, help="Optional solid background color to remove")
    parser.add_argument("--tolerance", type=int, default=20, help="Background-removal RGB tolerance")
    args = parser.parse_args()

    columns, rows = GRID_BY_MODE[args.mode]
    expected = columns * rows
    if len(args.outputs) != expected:
        parser.error(f"{args.mode} mode requires exactly {expected} output base paths")
    if not args.input.exists():
        parser.error(f"Input image does not exist: {args.input}")
    if not 0 <= args.tolerance <= 255:
        parser.error("--tolerance must be between 0 and 255")
    if not 0 <= args.padding <= 0.5:
        parser.error("--padding must be between 0 and 0.5")

    source = Image.open(args.input).convert("RGBA")
    sizes = SIZES_BY_MODE[args.mode]
    for cell, output in zip(crop_grid(source, columns, rows), args.outputs, strict=True):
        if args.background:
            cell = remove_background(cell, args.background, args.tolerance)
        if args.mode != "textures":
            cell = trim_and_pad(cell, args.padding)
        save_variants(cell, output, sizes, args.format, max(1, min(100, args.quality)))


if __name__ == "__main__":
    main()
