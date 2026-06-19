import argparse
import json
from pathlib import Path

from PIL import Image


class ManifestError(ValueError):
    pass


def load_manifest(path: Path) -> dict:
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ManifestError(f"Manifest not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ManifestError(f"Manifest is not valid JSON: {path}") from exc

    if manifest.get("version") != 1:
        raise ManifestError("Manifest version must be 1")
    if not isinstance(manifest.get("assets"), list):
        raise ManifestError("Manifest must contain an assets list")
    return manifest


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    raw = str(value or "").strip()
    if len(raw) != 7 or not raw.startswith("#"):
        raise ManifestError(f"Invalid chroma color: {value}")
    try:
        return tuple(int(raw[index:index + 2], 16) for index in (1, 3, 5))
    except ValueError as exc:
        raise ManifestError(f"Invalid chroma color: {value}") from exc


def bbox_for_alpha(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def bbox_for_chroma(image: Image.Image, chroma: tuple[int, int, int], threshold: int = 24) -> tuple[int, int, int, int] | None:
    pixels = image.convert("RGBA").load()
    min_x = image.width
    min_y = image.height
    max_x = -1
    max_y = -1

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, alpha = pixels[x, y]
            if alpha == 0:
                continue
            distance = abs(r - chroma[0]) + abs(g - chroma[1]) + abs(b - chroma[2])
            if distance > threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < min_x or max_y < min_y:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def trim_image(image: Image.Image, asset: dict) -> Image.Image:
    mode = asset.get("trimMode", "fixed")
    if mode == "fixed":
        return image
    if mode == "alpha":
        bbox = bbox_for_alpha(image)
    elif mode == "chroma":
        bbox = bbox_for_chroma(image, hex_to_rgb(asset.get("chroma", "#f5f7ea")))
    else:
        raise ManifestError(f"Unsupported trimMode: {mode}")

    if not bbox:
        return image
    return image.crop(bbox)


def pad_for_output(image: Image.Image, asset: dict, target_size: tuple[int, int]) -> Image.Image:
    if asset.get("trimMode", "fixed") == "fixed":
        return image

    padding = float(asset.get("padding", 0))
    subject_width, subject_height = image.size
    side = max(subject_width, subject_height, 1)
    side = int(round(side * (1 + max(0, padding) * 2)))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    x = (side - subject_width) // 2
    y = (side - subject_height) // 2
    canvas.alpha_composite(image.convert("RGBA"), (x, y))

    if target_size[0] != target_size[1]:
        output = Image.new("RGBA", target_size, (0, 0, 0, 0))
        fitted = canvas.resize((min(target_size), min(target_size)), Image.Resampling.LANCZOS)
        output.alpha_composite(fitted, ((target_size[0] - fitted.width) // 2, (target_size[1] - fitted.height) // 2))
        return output

    return canvas


def validate_asset(asset: dict, root: Path) -> tuple[Path, Path, int, int, tuple[int, int], str, list[str]]:
    asset_id = asset.get("id", "<missing>")
    source = root / str(asset.get("source", ""))
    output_dir = root / str(asset.get("outputDir", ""))
    cols = int(asset.get("cols", 0))
    rows = int(asset.get("rows", 0))
    size = asset.get("size", [])
    output_format = str(asset.get("format", "")).lower()
    outputs = asset.get("outputs", [])

    if not source.exists():
        raise ManifestError(f"{asset_id}: source does not exist: {source}")
    if cols < 1 or rows < 1:
        raise ManifestError(f"{asset_id}: cols and rows must be positive")
    if not (isinstance(size, list) and len(size) == 2 and all(int(item) > 0 for item in size)):
        raise ManifestError(f"{asset_id}: size must contain two positive numbers")
    if output_format not in {"png", "webp"}:
        raise ManifestError(f"{asset_id}: format must be png or webp")
    if not isinstance(outputs, list) or len(outputs) != cols * rows:
        raise ManifestError(f"{asset_id}: outputs count must match cols * rows")
    for output in outputs:
        if Path(str(output)).name != str(output):
            raise ManifestError(f"{asset_id}: output filename must not contain directories: {output}")

    return source, output_dir, cols, rows, (int(size[0]), int(size[1])), output_format, [str(item) for item in outputs]


def save_image(image: Image.Image, path: Path, output_format: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "png":
        image.save(path, "PNG", optimize=True)
    elif output_format == "webp":
        image.convert("RGB").save(path, "WEBP", quality=86, method=6)
    else:
        raise ManifestError(f"Unsupported output format: {output_format}")


def process_manifest(manifest_path: Path, root: Path, check_only: bool = False) -> list[dict]:
    manifest = load_manifest(manifest_path)
    report = []

    for asset in manifest["assets"]:
        source, output_dir, cols, rows, target_size, output_format, outputs = validate_asset(asset, root)
        with Image.open(source) as source_image:
            image = source_image.convert("RGBA")
            cell_width = image.width // cols
            cell_height = image.height // rows
            if cell_width < 1 or cell_height < 1:
                raise ManifestError(f"{asset.get('id')}: source is too small for grid")

            for index, output_name in enumerate(outputs):
                row = index // cols
                col = index % cols
                left = col * cell_width
                top = row * cell_height
                cell = image.crop((left, top, left + cell_width, top + cell_height))
                trimmed = trim_image(cell, asset)
                padded = pad_for_output(trimmed, asset, target_size)
                final = padded.resize(target_size, Image.Resampling.LANCZOS)
                output_path = output_dir / output_name

                if not check_only:
                    save_image(final, output_path, output_format)

                report.append({
                    "asset": asset.get("id"),
                    "output": str(output_path.relative_to(root)).replace("\\", "/"),
                    "width": target_size[0],
                    "height": target_size[1],
                    "format": output_format,
                    "written": not check_only,
                })

    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Process Puzzle Garden generated asset source sheets.")
    parser.add_argument("--manifest", default="assets/source/imagegen/asset-manifest.json")
    parser.add_argument("--root", default=".")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    manifest_path = (root / args.manifest).resolve()

    try:
        report = process_manifest(manifest_path, root, check_only=args.check)
    except ManifestError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        return 1

    print(json.dumps({"ok": True, "check": args.check, "outputs": report}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
