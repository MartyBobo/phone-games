import argparse
import json
from pathlib import Path

from PIL import Image


class ImportErrorForUser(ValueError):
    pass


def load_assets(manifest_path: Path) -> list[dict]:
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ImportErrorForUser(f"Manifest not found: {manifest_path}") from exc
    except json.JSONDecodeError as exc:
        raise ImportErrorForUser(f"Manifest is not valid JSON: {manifest_path}") from exc

    assets = manifest.get("assets")
    if not isinstance(assets, list):
        raise ImportErrorForUser("Manifest must contain an assets list")
    return assets


def find_asset(assets: list[dict], asset_id: str) -> dict:
    matches = [asset for asset in assets if asset.get("id") == asset_id]
    if not matches:
        known = ", ".join(sorted(str(asset.get("id")) for asset in assets))
        raise ImportErrorForUser(f"Unknown asset id '{asset_id}'. Known ids: {known}")
    return matches[0]


def save_png(input_path: Path, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with Image.open(input_path) as image:
            image.convert("RGBA").save(output_path, "PNG", optimize=True)
    except OSError as exc:
        raise ImportErrorForUser(f"Input image could not be opened: {input_path}") from exc


def unique_source_paths(assets: list[dict]) -> list[Path]:
    sources = []
    seen = set()
    for asset in assets:
        source_value = str(asset.get("source", ""))
        source = Path(source_value)
        if not source.name:
            raise ImportErrorForUser(f"Asset '{asset.get('id')}' is missing a source path")
        if source_value not in seen:
            seen.add(source_value)
            sources.append(source)
    return sources


def import_source(root: Path, manifest_path: Path, asset_id: str, input_path: Path) -> Path:
    root = Path(root)
    manifest_path = Path(manifest_path)
    input_path = Path(input_path)

    if not input_path.exists():
        raise ImportErrorForUser(f"Input image not found: {input_path}")

    asset = find_asset(load_assets(manifest_path), asset_id)
    source = root / str(asset.get("source", ""))
    if not source.name:
        raise ImportErrorForUser(f"Asset '{asset_id}' is missing a source path")

    save_png(input_path, source)
    return source


def import_sources_from_dir(root: Path, manifest_path: Path, input_dir: Path) -> list[Path]:
    root = Path(root)
    input_dir = Path(input_dir)
    if not input_dir.is_dir():
        raise ImportErrorForUser(f"Input directory not found: {input_dir}")

    sources = unique_source_paths(load_assets(Path(manifest_path)))
    missing = [source.name for source in sources if not (input_dir / source.name).exists()]
    if missing:
        raise ImportErrorForUser(
            f"Missing generated source files in {input_dir}: {', '.join(missing)}"
        )

    outputs = []
    for source in sources:
        output = root / source
        save_png(input_dir / source.name, output)
        outputs.append(output)
    return outputs


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Import a generated source image into the Puzzle Garden asset pipeline.")
    parser.add_argument("asset_id", nargs="?", help="Manifest asset id, for example tile-faces or worlds")
    parser.add_argument("input", nargs="?", help="Path to the generated image file to import")
    parser.add_argument("--from-dir", help="Import every unique manifest source from a generated image directory")
    parser.add_argument("--root", default=".", help="Project root")
    parser.add_argument("--manifest", default="assets/source/imagegen/asset-manifest.json")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    manifest = (root / args.manifest).resolve()

    try:
        if args.from_dir:
            outputs = import_sources_from_dir(root, manifest, Path(args.from_dir).resolve())
            print(json.dumps({
                "ok": True,
                "sources": [str(output.relative_to(root)).replace("\\", "/") for output in outputs],
                "next": "python tools\\process_assets.py",
            }, indent=2))
            return 0

        if not args.asset_id or not args.input:
            parser.error("asset_id and input are required unless --from-dir is used")
        output = import_source(root, manifest, args.asset_id, Path(args.input).resolve())
    except ImportErrorForUser as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        return 1

    print(json.dumps({
        "ok": True,
        "asset": args.asset_id,
        "source": str(output.relative_to(root)).replace("\\", "/"),
        "next": "python tools\\process_assets.py",
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
