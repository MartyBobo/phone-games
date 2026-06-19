import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

try:
    from process_assets import ManifestError, process_manifest
except ModuleNotFoundError:
    ManifestError = None
    process_manifest = None


class ProcessAssetsTests(unittest.TestCase):
    def image_pixels(self, image):
        if hasattr(image, "get_flattened_data"):
            return image.get_flattened_data()
        return image.getdata()

    def make_source(self, root: Path) -> Path:
        source = root / "source.png"
        image = Image.new("RGBA", (200, 100), "#f5f7ea")
        draw = ImageDraw.Draw(image)
        draw.ellipse((28, 22, 72, 66), fill="#315f5a")
        draw.rectangle((128, 20, 172, 66), fill="#f0b35f")
        image.save(source)
        return source

    def make_manifest(self, root: Path, source: Path, outputs=None) -> Path:
        manifest = {
            "version": 1,
            "assets": [
                {
                    "id": "test-sheet",
                    "source": source.relative_to(root).as_posix(),
                    "outputDir": "out",
                    "cols": 2,
                    "rows": 1,
                    "trimMode": "chroma",
                    "chroma": "#f5f7ea",
                    "padding": 0.1,
                    "size": [64, 64],
                    "format": "png",
                    "outputs": outputs or ["left.png", "right.png"],
                }
            ],
        }
        path = root / "manifest.json"
        path.write_text(json.dumps(manifest), encoding="utf-8")
        return path

    def test_process_manifest_slices_and_resizes_outputs(self):
        self.assertIsNotNone(process_manifest, "process_assets module must define process_manifest")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = self.make_source(root)
            manifest = self.make_manifest(root, source)

            report = process_manifest(manifest, root)

            self.assertEqual(len(report), 2)
            for name in ["left.png", "right.png"]:
                output = root / "out" / name
                self.assertTrue(output.exists(), f"{output} should be written")
                with Image.open(output) as image:
                    self.assertEqual(image.size, (64, 64))
                    self.assertEqual(image.mode, "RGBA")
                    self.assertEqual(image.getpixel((0, 0))[3], 0)
                    opaque_chroma = [
                        pixel for pixel in self.image_pixels(image)
                        if pixel[:3] == (245, 247, 234) and pixel[3] > 0
                    ]
                    self.assertEqual(opaque_chroma, [])

    def test_check_only_validates_without_writing_outputs(self):
        self.assertIsNotNone(process_manifest, "process_assets module must define process_manifest")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = self.make_source(root)
            manifest = self.make_manifest(root, source)

            report = process_manifest(manifest, root, check_only=True)

            self.assertEqual(len(report), 2)
            self.assertFalse((root / "out").exists())

    def test_manifest_output_count_must_match_grid(self):
        self.assertIsNotNone(ManifestError, "process_assets module must define ManifestError")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = self.make_source(root)
            manifest = self.make_manifest(root, source, outputs=["only-one.png"])

            with self.assertRaises(ManifestError):
                process_manifest(manifest, root, check_only=True)


if __name__ == "__main__":
    unittest.main()
