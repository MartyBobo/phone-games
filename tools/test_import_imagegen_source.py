import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

try:
    from import_imagegen_source import ImportErrorForUser, import_source, import_sources_from_dir
except ModuleNotFoundError:
    ImportErrorForUser = None
    import_source = None
    import_sources_from_dir = None


class ImportImagegenSourceTests(unittest.TestCase):
    def make_manifest(self, root: Path) -> Path:
        manifest = {
            "version": 1,
            "assets": [
                {
                    "id": "tile-faces",
                    "source": "assets/source/imagegen/tile-faces-source.png",
                    "outputDir": "assets/generated/tile-faces",
                    "cols": 8,
                    "rows": 6,
                    "trimMode": "chroma",
                    "chroma": "#f5f7ea",
                    "padding": 0.16,
                    "size": [192, 192],
                    "format": "png",
                    "outputs": [f"face-{index}.png" for index in range(48)],
                },
                {
                    "id": "hero",
                    "source": "assets/source/imagegen/hero-source.png",
                    "outputDir": "assets/generated",
                    "cols": 1,
                    "rows": 1,
                    "trimMode": "fixed",
                    "padding": 0,
                    "size": [640, 420],
                    "format": "webp",
                    "outputs": ["hero-garden.webp"],
                },
                {
                    "id": "app-icon-192",
                    "source": "assets/source/imagegen/app-icon-source.png",
                    "outputDir": ".",
                    "cols": 1,
                    "rows": 1,
                    "trimMode": "fixed",
                    "padding": 0,
                    "size": [192, 192],
                    "format": "png",
                    "outputs": ["icon-192.png"],
                },
                {
                    "id": "app-icon-512",
                    "source": "assets/source/imagegen/app-icon-source.png",
                    "outputDir": ".",
                    "cols": 1,
                    "rows": 1,
                    "trimMode": "fixed",
                    "padding": 0,
                    "size": [512, 512],
                    "format": "png",
                    "outputs": ["icon-512.png"],
                }
            ],
        }
        path = root / "assets" / "source" / "imagegen" / "asset-manifest.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(manifest), encoding="utf-8")
        return path

    def make_input(self, root: Path, name: str = "downloaded-sheet.jpg") -> Path:
        path = root / name
        image = Image.new("RGB", (800, 600), "#f5f7ea")
        image.save(path, "JPEG")
        return path

    def test_import_source_converts_image_to_manifest_source_path(self):
        self.assertIsNotNone(import_source, "import_imagegen_source must define import_source")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = self.make_manifest(root)
            input_path = self.make_input(root)

            output = import_source(root, manifest, "tile-faces", input_path)

            expected = root / "assets/source/imagegen/tile-faces-source.png"
            self.assertEqual(output, expected)
            self.assertTrue(expected.exists())
            with Image.open(expected) as image:
                self.assertEqual(image.mode, "RGBA")
                self.assertEqual(image.size, (800, 600))

    def test_import_source_rejects_unknown_asset_id(self):
        self.assertIsNotNone(ImportErrorForUser, "import_imagegen_source must define ImportErrorForUser")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = self.make_manifest(root)
            input_path = self.make_input(root)

            with self.assertRaises(ImportErrorForUser):
                import_source(root, manifest, "not-real", input_path)

    def test_import_sources_from_dir_imports_each_unique_source_name_once(self):
        self.assertIsNotNone(import_sources_from_dir, "import_imagegen_source must define import_sources_from_dir")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = self.make_manifest(root)
            input_dir = root / "output" / "imagegen" / "puzzle-garden"
            input_dir.mkdir(parents=True)
            for filename, color in [
                ("tile-faces-source.png", "#f5f7ea"),
                ("hero-source.png", "#ddeeff"),
                ("app-icon-source.png", "#88aa66"),
            ]:
                Image.new("RGB", (64, 64), color).save(input_dir / filename)

            outputs = import_sources_from_dir(root, manifest, input_dir)

            expected = {
                root / "assets/source/imagegen/tile-faces-source.png",
                root / "assets/source/imagegen/hero-source.png",
                root / "assets/source/imagegen/app-icon-source.png",
            }
            self.assertEqual(set(outputs), expected)
            self.assertEqual(len(outputs), 3)
            for output in outputs:
                with Image.open(output) as image:
                    self.assertEqual(image.mode, "RGBA")

    def test_import_sources_from_dir_reports_missing_source_files(self):
        self.assertIsNotNone(import_sources_from_dir, "import_imagegen_source must define import_sources_from_dir")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = self.make_manifest(root)
            input_dir = root / "output" / "imagegen" / "puzzle-garden"
            input_dir.mkdir(parents=True)
            Image.new("RGB", (64, 64), "#f5f7ea").save(input_dir / "tile-faces-source.png")

            with self.assertRaises(ImportErrorForUser) as context:
                import_sources_from_dir(root, manifest, input_dir)

            self.assertIn("hero-source.png", str(context.exception))


if __name__ == "__main__":
    unittest.main()
