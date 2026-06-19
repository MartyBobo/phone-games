import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


BG = "#f5f7ea"

WORLDS = [
    {
        "name": "Seedling Meadow",
        "palette": ("#315f5a", "#9fc995", "#f5d58a", "#fff8e8"),
        "symbols": ("leaf", "sprout", "flower", "sun", "cloud", "bee", "can", "packet"),
    },
    {
        "name": "Lantern Grove",
        "palette": ("#263f46", "#70608f", "#f0b35f", "#f8e4b9"),
        "symbols": ("lantern", "mushroom", "spiral", "moth", "flame", "acorn", "crescent_leaf", "amulet"),
    },
    {
        "name": "Moonlit Pond",
        "palette": ("#224f5b", "#5b89a2", "#8dbfa6", "#e9efce"),
        "symbols": ("lily", "ripple", "reeds", "moon", "water_bloom", "pebble", "fish", "drop"),
    },
    {
        "name": "Crystal Conservatory",
        "palette": ("#4e557b", "#8d75ab", "#8fd1c7", "#f4e9ff"),
        "symbols": ("crystal", "vine", "glass", "prism", "orchid", "gem_leaf", "arch", "sparkle"),
    },
    {
        "name": "Cloud Orchard",
        "palette": ("#4479a3", "#98c9e9", "#f2b96e", "#fff2c9"),
        "symbols": ("fruit", "branch", "cloud", "windmill", "basket", "blossom", "feather_leaf", "island"),
    },
    {
        "name": "Starlight Terrace",
        "palette": ("#262a59", "#5c4d91", "#e5bfe8", "#fff1aa"),
        "symbols": ("star_flower", "comet", "constellation", "path_stone", "night_leaf", "glowing_seed", "terrace_stone", "aurora"),
    },
]


def source_path(root: Path, name: str) -> Path:
    return root / "assets" / "source" / "imagegen" / name


def save(image: Image.Image, path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)
    return path.as_posix()


def ellipse(draw: ImageDraw.ImageDraw, cx: float, cy: float, rx: float, ry: float, **kwargs) -> None:
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), **kwargs)


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, **kwargs) -> None:
    draw.rounded_rectangle(box, radius=radius, **kwargs)


def polygon_points(cx: float, cy: float, radius: float, sides: int, rotation: float = 0) -> list[tuple[float, float]]:
    return [
        (
            cx + math.cos(rotation + math.tau * index / sides) * radius,
            cy + math.sin(rotation + math.tau * index / sides) * radius,
        )
        for index in range(sides)
    ]


def draw_leaf(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, color: str, stem: str) -> None:
    draw.ellipse((cx - size * 0.38, cy - size * 0.45, cx + size * 0.28, cy + size * 0.22), fill=color, outline=stem, width=max(3, size // 18))
    draw.line((cx - size * 0.15, cy + size * 0.25, cx + size * 0.28, cy - size * 0.30), fill=stem, width=max(3, size // 16))


def draw_flower(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, petal: str, center: str, stem: str) -> None:
    for angle in range(0, 360, 60):
        rad = math.radians(angle)
        ellipse(draw, cx + math.cos(rad) * size * 0.24, cy + math.sin(rad) * size * 0.24, size * 0.18, size * 0.26, fill=petal)
    ellipse(draw, cx, cy, size * 0.16, size * 0.16, fill=center, outline=stem, width=max(2, size // 22))


def draw_cloud(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, color: str, shadow: str) -> None:
    ellipse(draw, cx - size * 0.25, cy + size * 0.05, size * 0.28, size * 0.18, fill=shadow)
    ellipse(draw, cx, cy - size * 0.05, size * 0.33, size * 0.25, fill=color)
    ellipse(draw, cx - size * 0.28, cy, size * 0.22, size * 0.18, fill=color)
    ellipse(draw, cx + size * 0.30, cy + size * 0.03, size * 0.24, size * 0.17, fill=color)
    rounded(draw, (cx - size * 0.46, cy, cx + size * 0.52, cy + size * 0.22), size // 8, fill=color)


def draw_sparkle(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, color: str, outline: str) -> None:
    points = [(cx, cy - size * 0.45), (cx + size * 0.12, cy - size * 0.10), (cx + size * 0.45, cy),
              (cx + size * 0.12, cy + size * 0.10), (cx, cy + size * 0.45), (cx - size * 0.12, cy + size * 0.10),
              (cx - size * 0.45, cy), (cx - size * 0.12, cy - size * 0.10)]
    draw.polygon(points, fill=color, outline=outline)


def draw_tile_symbol(draw: ImageDraw.ImageDraw, symbol: str, cx: int, cy: int, size: int, palette: tuple[str, str, str, str]) -> None:
    dark, mid, warm, pale = palette
    stroke = dark
    if symbol in {"leaf", "night_leaf", "feather_leaf"}:
        draw_leaf(draw, cx, cy, size, mid, stroke)
    elif symbol == "sprout":
        draw.line((cx, cy + size * 0.35, cx, cy - size * 0.12), fill=stroke, width=size // 18)
        draw_leaf(draw, cx - size // 7, cy - size // 8, size // 2, mid, stroke)
        draw_leaf(draw, cx + size // 5, cy - size // 14, size // 2, warm, stroke)
    elif symbol in {"flower", "water_bloom", "blossom", "star_flower", "orchid"}:
        draw_flower(draw, cx, cy, size, warm if symbol != "orchid" else pale, mid, stroke)
    elif symbol == "sun":
        for angle in range(0, 360, 30):
            rad = math.radians(angle)
            draw.line((cx, cy, cx + math.cos(rad) * size * 0.45, cy + math.sin(rad) * size * 0.45), fill=warm, width=size // 18)
        ellipse(draw, cx, cy, size * 0.28, size * 0.28, fill=warm, outline=stroke, width=size // 18)
    elif symbol == "cloud":
        draw_cloud(draw, cx, cy, size, pale, mid)
    elif symbol == "bee":
        ellipse(draw, cx, cy, size * 0.28, size * 0.20, fill=warm, outline=stroke, width=size // 18)
        ellipse(draw, cx - size * 0.18, cy - size * 0.20, size * 0.14, size * 0.18, fill=pale, outline=mid)
        ellipse(draw, cx + size * 0.18, cy - size * 0.20, size * 0.14, size * 0.18, fill=pale, outline=mid)
        draw.line((cx - size * 0.08, cy - size * 0.18, cx - size * 0.08, cy + size * 0.18), fill=stroke, width=size // 26)
        draw.line((cx + size * 0.08, cy - size * 0.18, cx + size * 0.08, cy + size * 0.18), fill=stroke, width=size // 26)
    elif symbol == "can":
        rounded(draw, (cx - size * 0.28, cy - size * 0.14, cx + size * 0.18, cy + size * 0.25), size // 10, fill=mid, outline=stroke, width=size // 18)
        draw.arc((cx + size * 0.05, cy - size * 0.12, cx + size * 0.45, cy + size * 0.25), -70, 95, fill=stroke, width=size // 14)
        draw.line((cx - size * 0.22, cy - size * 0.16, cx - size * 0.48, cy - size * 0.31), fill=stroke, width=size // 18)
    elif symbol == "packet":
        rounded(draw, (cx - size * 0.28, cy - size * 0.36, cx + size * 0.28, cy + size * 0.34), size // 12, fill=pale, outline=stroke, width=size // 16)
        draw_leaf(draw, cx, cy, size // 2, mid, stroke)
    elif symbol == "lantern":
        rounded(draw, (cx - size * 0.25, cy - size * 0.25, cx + size * 0.25, cy + size * 0.30), size // 8, fill=warm, outline=stroke, width=size // 16)
        draw.line((cx, cy - size * 0.48, cx, cy - size * 0.25), fill=stroke, width=size // 18)
        ellipse(draw, cx, cy, size * 0.13, size * 0.18, fill=pale)
    elif symbol == "mushroom":
        ellipse(draw, cx, cy - size * 0.08, size * 0.38, size * 0.25, fill=warm, outline=stroke, width=size // 16)
        rounded(draw, (cx - size * 0.12, cy, cx + size * 0.12, cy + size * 0.35), size // 14, fill=pale, outline=stroke, width=size // 18)
        ellipse(draw, cx - size * 0.14, cy - size * 0.12, size * 0.05, size * 0.05, fill=pale)
        ellipse(draw, cx + size * 0.12, cy - size * 0.18, size * 0.05, size * 0.05, fill=pale)
    elif symbol in {"spiral", "ripple", "constellation"}:
        for offset in range(0, 4):
            box = (cx - size * (0.16 + offset * 0.08), cy - size * (0.16 + offset * 0.08), cx + size * (0.16 + offset * 0.08), cy + size * (0.16 + offset * 0.08))
            draw.arc(box, 20, 310, fill=stroke if offset % 2 else mid, width=size // 18)
        if symbol == "constellation":
            for px, py in [(-0.25, -0.2), (0.08, -0.25), (0.26, 0.07), (-0.12, 0.2)]:
                ellipse(draw, cx + px * size, cy + py * size, size * 0.04, size * 0.04, fill=warm)
    elif symbol == "moth":
        ellipse(draw, cx - size * 0.18, cy, size * 0.22, size * 0.30, fill=pale, outline=mid)
        ellipse(draw, cx + size * 0.18, cy, size * 0.22, size * 0.30, fill=pale, outline=mid)
        rounded(draw, (cx - size * 0.05, cy - size * 0.32, cx + size * 0.05, cy + size * 0.30), size // 16, fill=stroke)
    elif symbol == "flame":
        draw.polygon([(cx, cy - size * 0.42), (cx + size * 0.30, cy + size * 0.08), (cx, cy + size * 0.38), (cx - size * 0.25, cy + size * 0.08)], fill=warm, outline=stroke)
        draw.polygon([(cx, cy - size * 0.16), (cx + size * 0.12, cy + size * 0.10), (cx, cy + size * 0.24), (cx - size * 0.10, cy + size * 0.08)], fill=pale)
    elif symbol == "acorn":
        ellipse(draw, cx, cy + size * 0.08, size * 0.24, size * 0.30, fill=warm, outline=stroke, width=size // 18)
        rounded(draw, (cx - size * 0.28, cy - size * 0.22, cx + size * 0.28, cy + size * 0.02), size // 10, fill=mid, outline=stroke, width=size // 18)
    elif symbol == "crescent_leaf":
        draw.arc((cx - size * 0.35, cy - size * 0.42, cx + size * 0.35, cy + size * 0.40), 70, 280, fill=warm, width=size // 8)
        draw_leaf(draw, cx + size // 7, cy + size // 9, size // 2, mid, stroke)
    elif symbol == "amulet":
        draw.polygon(polygon_points(cx, cy, size * 0.35, 6, math.pi / 6), fill=mid, outline=stroke)
        draw_sparkle(draw, cx, cy, size // 2, warm, stroke)
    elif symbol == "lily":
        ellipse(draw, cx, cy, size * 0.35, size * 0.22, fill=mid, outline=stroke, width=size // 18)
        draw.pieslice((cx - size * 0.36, cy - size * 0.24, cx + size * 0.36, cy + size * 0.24), 300, 35, fill=BG)
    elif symbol == "reeds":
        for offset in (-0.18, 0, 0.18):
            draw.line((cx + offset * size, cy + size * 0.36, cx + offset * size * 0.6, cy - size * 0.28), fill=stroke, width=size // 22)
            ellipse(draw, cx + offset * size * 0.6, cy - size * 0.28, size * 0.04, size * 0.18, fill=warm)
    elif symbol == "moon":
        ellipse(draw, cx, cy, size * 0.34, size * 0.34, fill=warm, outline=stroke, width=size // 18)
        ellipse(draw, cx + size * 0.14, cy - size * 0.04, size * 0.31, size * 0.31, fill=BG)
    elif symbol == "pebble":
        ellipse(draw, cx, cy + size * 0.04, size * 0.35, size * 0.22, fill=mid, outline=stroke, width=size // 18)
        ellipse(draw, cx - size * 0.10, cy - size * 0.03, size * 0.09, size * 0.05, fill=pale)
    elif symbol == "fish":
        ellipse(draw, cx - size * 0.04, cy, size * 0.30, size * 0.18, fill=mid, outline=stroke, width=size // 18)
        draw.polygon([(cx + size * 0.24, cy), (cx + size * 0.45, cy - size * 0.18), (cx + size * 0.45, cy + size * 0.18)], fill=warm, outline=stroke)
        ellipse(draw, cx - size * 0.18, cy - size * 0.04, size * 0.025, size * 0.025, fill=stroke)
    elif symbol == "drop":
        draw.polygon([(cx, cy - size * 0.42), (cx + size * 0.28, cy + size * 0.04), (cx, cy + size * 0.36), (cx - size * 0.28, cy + size * 0.04)], fill=mid, outline=stroke)
        ellipse(draw, cx - size * 0.08, cy, size * 0.06, size * 0.10, fill=pale)
    elif symbol in {"crystal", "prism"}:
        draw.polygon([(cx, cy - size * 0.44), (cx + size * 0.30, cy - size * 0.08), (cx + size * 0.20, cy + size * 0.40), (cx - size * 0.20, cy + size * 0.40), (cx - size * 0.30, cy - size * 0.08)], fill=mid, outline=stroke)
        draw.line((cx, cy - size * 0.44, cx, cy + size * 0.40), fill=pale, width=size // 22)
        if symbol == "prism":
            draw.line((cx + size * 0.28, cy, cx + size * 0.48, cy - size * 0.18), fill=warm, width=size // 18)
    elif symbol == "vine":
        draw.arc((cx - size * 0.35, cy - size * 0.35, cx + size * 0.30, cy + size * 0.35), 100, 430, fill=stroke, width=size // 18)
        draw_leaf(draw, cx - size // 6, cy, size // 3, mid, stroke)
        draw_leaf(draw, cx + size // 6, cy - size // 5, size // 3, warm, stroke)
    elif symbol == "glass":
        rounded(draw, (cx - size * 0.34, cy - size * 0.34, cx + size * 0.34, cy + size * 0.34), size // 12, fill=pale, outline=stroke, width=size // 16)
        draw.line((cx - size * 0.28, cy + size * 0.20, cx + size * 0.24, cy - size * 0.25), fill=mid, width=size // 22)
    elif symbol == "gem_leaf":
        draw_leaf(draw, cx, cy, size, mid, stroke)
        draw_sparkle(draw, cx + size // 5, cy - size // 5, size // 3, warm, stroke)
    elif symbol == "arch":
        draw.arc((cx - size * 0.36, cy - size * 0.32, cx + size * 0.36, cy + size * 0.44), 180, 360, fill=stroke, width=size // 9)
        draw.line((cx - size * 0.36, cy + size * 0.06, cx - size * 0.36, cy + size * 0.38), fill=stroke, width=size // 9)
        draw.line((cx + size * 0.36, cy + size * 0.06, cx + size * 0.36, cy + size * 0.38), fill=stroke, width=size // 9)
    elif symbol == "sparkle":
        draw_sparkle(draw, cx, cy, size, warm, stroke)
    elif symbol == "fruit":
        ellipse(draw, cx, cy + size * 0.06, size * 0.27, size * 0.31, fill=warm, outline=stroke, width=size // 18)
        draw_leaf(draw, cx + size // 8, cy - size // 4, size // 3, mid, stroke)
    elif symbol == "branch":
        draw.line((cx - size * 0.35, cy + size * 0.25, cx + size * 0.35, cy - size * 0.22), fill=stroke, width=size // 15)
        draw_leaf(draw, cx - size // 8, cy, size // 3, mid, stroke)
        draw_leaf(draw, cx + size // 6, cy - size // 5, size // 3, warm, stroke)
    elif symbol == "windmill":
        rounded(draw, (cx - size * 0.12, cy, cx + size * 0.12, cy + size * 0.36), size // 16, fill=mid, outline=stroke, width=size // 20)
        for angle in range(0, 360, 90):
            rad = math.radians(angle)
            draw.polygon([(cx, cy - size * 0.02), (cx + math.cos(rad - 0.22) * size * 0.38, cy + math.sin(rad - 0.22) * size * 0.38), (cx + math.cos(rad + 0.22) * size * 0.20, cy + math.sin(rad + 0.22) * size * 0.20)], fill=warm, outline=stroke)
    elif symbol == "basket":
        rounded(draw, (cx - size * 0.35, cy - size * 0.05, cx + size * 0.35, cy + size * 0.30), size // 12, fill=warm, outline=stroke, width=size // 18)
        draw.arc((cx - size * 0.30, cy - size * 0.35, cx + size * 0.30, cy + size * 0.20), 200, 340, fill=stroke, width=size // 18)
    elif symbol == "island":
        draw_cloud(draw, cx, cy + size // 8, size // 2, pale, mid)
        draw_leaf(draw, cx, cy - size // 5, size // 2, warm, stroke)
    elif symbol == "comet":
        ellipse(draw, cx + size * 0.18, cy - size * 0.10, size * 0.16, size * 0.16, fill=warm, outline=stroke, width=size // 20)
        draw.line((cx + size * 0.04, cy, cx - size * 0.38, cy + size * 0.26), fill=mid, width=size // 14)
        draw.line((cx + size * 0.02, cy - size * 0.08, cx - size * 0.44, cy - size * 0.02), fill=pale, width=size // 18)
    elif symbol in {"path_stone", "terrace_stone"}:
        rounded(draw, (cx - size * 0.34, cy - size * 0.18, cx + size * 0.34, cy + size * 0.22), size // 10, fill=mid, outline=stroke, width=size // 18)
        if symbol == "path_stone":
            draw.arc((cx - size * 0.15, cy - size * 0.08, cx + size * 0.18, cy + size * 0.14), 20, 200, fill=warm, width=size // 22)
    elif symbol == "glowing_seed":
        ellipse(draw, cx, cy, size * 0.22, size * 0.33, fill=warm, outline=stroke, width=size // 18)
        for radius in (0.36, 0.46):
            draw.arc((cx - size * radius, cy - size * radius, cx + size * radius, cy + size * radius), 210, 330, fill=pale, width=size // 24)
    elif symbol == "aurora":
        for offset, color in [(-0.18, mid), (0.02, warm), (0.22, pale)]:
            draw.arc((cx - size * 0.42, cy - size * (0.30 + offset), cx + size * 0.42, cy + size * (0.36 - offset)), 205, 335, fill=color, width=size // 12)
    else:
        draw_sparkle(draw, cx, cy, size, warm, stroke)


def generate_tile_faces(root: Path) -> str:
    cell = 220
    image = Image.new("RGBA", (cell * 8, cell * 6), BG)
    draw = ImageDraw.Draw(image)
    for row, world in enumerate(WORLDS):
        for col, symbol in enumerate(world["symbols"]):
            cx = col * cell + cell // 2
            cy = row * cell + cell // 2
            draw_tile_symbol(draw, symbol, cx, cy, 132, world["palette"])
    return save(image, source_path(root, "tile-faces-source.png"))


def draw_game_icon(draw: ImageDraw.ImageDraw, index: int, cx: int, cy: int) -> None:
    if index == 0:
        rounded(draw, (cx - 86, cy - 86, cx + 86, cy + 86), 30, fill="#fffdf8", outline="#315f5a", width=8)
        for offset in (-28, 28):
            draw.line((cx - 86, cy + offset, cx + 86, cy + offset), fill="#9fc995", width=5)
            draw.line((cx + offset, cy - 86, cx + offset, cy + 86), fill="#9fc995", width=5)
        draw.polygon([(cx - 16, cy - 42), (cx + 40, cy - 42), (cx + 10, cy + 58)], fill="#315f5a")
    elif index == 1:
        for dx, rot in [(-42, -1), (42, 1)]:
            rounded(draw, (cx + dx - 58, cy - 62, cx + dx + 58, cy + 62), 22, fill="#fffdf8", outline="#315f5a", width=7)
            draw_flower(draw, cx + dx, cy, 70, "#f5d58a", "#9fc995", "#315f5a")
    elif index == 2:
        colors = ["#315f5a", "#f0b35f", "#8d75ab", "#8fd1c7"]
        coords = [(-66, -36), (-16, -36), (-16, 14), (34, 14)]
        for (dx, dy), color in zip(coords, colors):
            rounded(draw, (cx + dx, cy + dy, cx + dx + 48, cy + dy + 48), 10, fill=color, outline="#263835", width=4)
    else:
        for layer in range(3):
            rounded(draw, (cx - 62 + layer * 26, cy + 42 - layer * 42, cx + 4 + layer * 26, cy + 96 - layer * 42), 8, fill="#b98545", outline="#315f5a", width=5)
        draw.line((cx - 80, cy + 100, cx + 88, cy + 100), fill="#315f5a", width=9)
        rounded(draw, (cx + 42, cy - 76, cx + 92, cy - 20), 14, fill="#f0b35f", outline="#76392c", width=5)


def generate_game_icons(root: Path) -> str:
    cell = 320
    image = Image.new("RGBA", (cell * 4, cell), BG)
    draw = ImageDraw.Draw(image)
    for index in range(4):
        draw_game_icon(draw, index, index * cell + cell // 2, cell // 2)
    return save(image, source_path(root, "game-icons-source.png"))


def draw_world(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], palette: tuple[str, str, str, str], kind: int) -> None:
    x0, y0, x1, y1 = box
    width = x1 - x0
    height = y1 - y0
    dark, mid, warm, pale = palette
    draw.rectangle(box, fill=pale)
    if kind in {1, 5}:
        draw.rectangle((x0, y0, x1, y1), fill=dark)
        for offset in range(8):
            ellipse(draw, x0 + width * (0.12 + offset * 0.11), y0 + height * (0.16 + (offset % 3) * 0.08), 4, 4, fill=warm)
    elif kind in {2}:
        draw.rectangle((x0, y0, x1, y1), fill="#dbeaf2")
    else:
        draw.rectangle((x0, y0, x1, y1), fill=pale)
    draw.pieslice((x0 - width * 0.12, y0 + height * 0.46, x0 + width * 0.62, y1 + height * 0.25), 180, 360, fill=mid)
    draw.pieslice((x0 + width * 0.25, y0 + height * 0.50, x1 + width * 0.20, y1 + height * 0.28), 180, 360, fill=dark)
    if kind == 0:
        ellipse(draw, x0 + width * 0.80, y0 + height * 0.20, 42, 42, fill=warm)
        for px in (0.18, 0.30, 0.70):
            draw_leaf(draw, int(x0 + width * px), int(y0 + height * 0.62), 86, mid, dark)
    elif kind == 1:
        for px in (0.2, 0.38, 0.58, 0.78):
            draw.line((x0 + width * px, y0 + height * 0.30, x0 + width * px, y0 + height * 0.72), fill="#1c3034", width=18)
            rounded(draw, (x0 + width * px - 18, y0 + height * 0.36, x0 + width * px + 18, y0 + height * 0.48), 8, fill=warm)
        draw_tile_symbol(draw, "mushroom", int(x0 + width * 0.50), int(y0 + height * 0.72), 78, palette)
    elif kind == 2:
        draw.rectangle((x0, y0 + height * 0.58, x1, y1), fill="#5b89a2")
        for px in (0.20, 0.45, 0.72):
            draw_tile_symbol(draw, "lily", int(x0 + width * px), int(y0 + height * 0.70), 90, palette)
        draw_tile_symbol(draw, "moon", int(x0 + width * 0.76), int(y0 + height * 0.22), 90, palette)
    elif kind == 3:
        rounded(draw, (x0 + width * 0.18, y0 + height * 0.18, x0 + width * 0.82, y0 + height * 0.72), 42, fill="#dff8f4", outline=dark, width=8)
        for px in (0.32, 0.50, 0.68):
            draw_tile_symbol(draw, "crystal", int(x0 + width * px), int(y0 + height * 0.58), 90, palette)
    elif kind == 4:
        for px in (0.18, 0.45, 0.72):
            draw_cloud(draw, int(x0 + width * px), int(y0 + height * 0.38), 90, "#ffffff", mid)
            draw_tile_symbol(draw, "fruit", int(x0 + width * px), int(y0 + height * 0.58), 82, palette)
        draw_tile_symbol(draw, "windmill", int(x0 + width * 0.80), int(y0 + height * 0.48), 98, palette)
    else:
        draw_tile_symbol(draw, "comet", int(x0 + width * 0.72), int(y0 + height * 0.22), 84, palette)
        for px in (0.20, 0.42, 0.64):
            draw_tile_symbol(draw, "star_flower", int(x0 + width * px), int(y0 + height * 0.68), 80, palette)


def generate_worlds(root: Path) -> str:
    cell_w, cell_h = 640, 360
    image = Image.new("RGBA", (cell_w * 3, cell_h * 2), BG)
    draw = ImageDraw.Draw(image)
    for index, world in enumerate(WORLDS):
        col = index % 3
        row = index // 3
        draw_world(draw, (col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h), world["palette"], index)
    return save(image, source_path(root, "worlds-source.png"))


def generate_hero(root: Path) -> str:
    image = Image.new("RGBA", (640, 420), "#dceae6")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 640, 420), fill="#dceae6")
    draw.pieslice((-80, 210, 360, 510), 180, 360, fill="#9fc995")
    draw.pieslice((200, 225, 760, 530), 180, 360, fill="#315f5a")
    for index, x in enumerate((110, 250, 390)):
        rounded(draw, (x, 70 + index * 18, x + 118, 188 + index * 18), 26, fill="#fffdf8", outline="#315f5a", width=7)
    draw_tile_symbol(draw, "sprout", 169, 129, 74, WORLDS[0]["palette"])
    draw_tile_symbol(draw, "sparkle", 309, 147, 74, WORLDS[3]["palette"])
    draw_tile_symbol(draw, "star_flower", 449, 165, 74, WORLDS[5]["palette"])
    for x in (96, 525, 574):
        draw_flower(draw, x, 330 + (x % 3) * 10, 54, "#f5d58a", "#9fc995", "#315f5a")
    return save(image, source_path(root, "hero-source.png"))


def generate_app_icon(root: Path) -> str:
    image = Image.new("RGBA", (1024, 1024), "#315f5a")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1024, 1024), fill="#315f5a")
    ellipse(draw, 300, 250, 210, 120, fill="#9fc995")
    ellipse(draw, 780, 770, 260, 150, fill="#263f46")
    rounded(draw, (234, 206, 790, 762), 142, fill="#fffdf8", outline="#f5d58a", width=38)
    for offset in (0, 1, 2):
        draw.line((344 + offset * 112, 244, 344 + offset * 112, 724), fill="#d9ead0", width=12)
        draw.line((272, 340 + offset * 112, 752, 340 + offset * 112), fill="#d9ead0", width=12)
    draw_tile_symbol(draw, "sprout", 512, 482, 300, WORLDS[0]["palette"])
    draw_sparkle(draw, 660, 330, 120, "#fff1aa", "#315f5a")
    return save(image, source_path(root, "app-icon-source.png"))


def generate_board_texture(root: Path) -> str:
    image = Image.new("RGBA", (512, 512), "#fffdf8")
    draw = ImageDraw.Draw(image)
    for x in range(0, 512, 24):
        draw.line((x, 0, x + 80, 512), fill="#efe7d5", width=1)
    for y in range(14, 512, 32):
        draw.line((0, y, 512, y + 28), fill="#f6eddc", width=1)
    for x, y, color in [(80, 120, "#e8d7b7"), (300, 96, "#dce8cf"), (220, 360, "#eadfc5"), (430, 300, "#d9ead0")]:
        ellipse(draw, x, y, 3, 2, fill=color)
    return save(image, source_path(root, "board-texture-source.png"))


def generate_ui_accents(root: Path) -> str:
    cell = 128
    image = Image.new("RGBA", (cell * 4, cell), BG)
    draw = ImageDraw.Draw(image)
    draw_sparkle(draw, 64, 64, 78, "#f5d58a", "#315f5a")
    draw_leaf(draw, 192, 64, 82, "#9fc995", "#315f5a")
    draw_flower(draw, 320, 64, 78, "#e5bfe8", "#fff1aa", "#262a59")
    for angle in range(0, 360, 60):
        rad = math.radians(angle)
        ellipse(draw, 448 + math.cos(rad) * 28, 64 + math.sin(rad) * 22, 10, 8, fill="#f0b35f", outline="#315f5a")
    return save(image, source_path(root, "ui-accents-source.png"))


def generate_sources(root: Path) -> list[str]:
    root = Path(root)
    outputs = [
        generate_tile_faces(root),
        generate_game_icons(root),
        generate_worlds(root),
        generate_hero(root),
        generate_app_icon(root),
        generate_board_texture(root),
        generate_ui_accents(root),
    ]
    return [str(Path(path).relative_to(root)).replace("\\", "/") if Path(path).is_absolute() else path for path in outputs]


def main() -> int:
    root = Path(".").resolve()
    outputs = generate_sources(root)
    print(json.dumps({"ok": True, "outputs": outputs}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
