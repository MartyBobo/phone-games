import tempfile
import unittest
from pathlib import Path

from PIL import Image

try:
    from generate_placeholder_sources import generate_sources
except ModuleNotFoundError:
    generate_sources = None


class GeneratePlaceholderSourcesTests(unittest.TestCase):
    def test_generate_sources_writes_all_expected_source_sheets(self):
        self.assertIsNotNone(generate_sources, "generate_placeholder_sources must define generate_sources")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            outputs = generate_sources(root)

            expected = {
                "assets/source/imagegen/tile-faces-source.png": (1760, 1320),
                "assets/source/imagegen/game-icons-source.png": (1280, 320),
                "assets/source/imagegen/worlds-source.png": (1920, 720),
                "assets/source/imagegen/hero-source.png": (640, 420),
                "assets/source/imagegen/app-icon-source.png": (1024, 1024),
                "assets/source/imagegen/board-texture-source.png": (512, 512),
                "assets/source/imagegen/ui-accents-source.png": (512, 128),
            }

            self.assertEqual(set(outputs), set(expected))
            for relative_path, size in expected.items():
                path = root / relative_path
                self.assertTrue(path.exists(), f"{path} should exist")
                with Image.open(path) as image:
                    self.assertEqual(image.size, size)


if __name__ == "__main__":
    unittest.main()
