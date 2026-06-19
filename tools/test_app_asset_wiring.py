import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AppAssetWiringTests(unittest.TestCase):
    def test_app_uses_generated_assets_for_primary_surfaces(self):
        app_js = (ROOT / "app.js").read_text(encoding="utf-8")
        styles = (ROOT / "styles.css").read_text(encoding="utf-8")
        campaign = json.loads((ROOT / "campaign.json").read_text(encoding="utf-8"))
        sw_js = (ROOT / "sw.js").read_text(encoding="utf-8")

        self.assertIn('const GENERATED_ASSET_ROOT = "assets/generated";', app_js)
        self.assertIn('art: "assets/generated/game-icons/number-grid.png"', app_js)
        self.assertIn('art: "assets/generated/game-icons/tile-pairs.png"', app_js)
        self.assertIn('art: "assets/generated/game-icons/falling-shapes.png"', app_js)
        self.assertIn('art: "assets/generated/game-icons/crate-trail.png"', app_js)
        self.assertIn('assets/generated/hero-garden.webp', app_js)
        self.assertIn("function tileFaceAssetPath(face)", app_js)
        self.assertIn("tile-face-image", app_js)
        self.assertIn("generated\\/worlds", app_js)

        for world in campaign["worlds"]:
            self.assertTrue(world["art"].startswith("assets/generated/worlds/"))
            self.assertTrue(world["art"].endswith(".webp"))

        self.assertIn(".tile-face-image", styles)
        self.assertIn("./assets/generated/tile-faces/w1-f0.png", sw_js)
        self.assertIn("./assets/generated/worlds/starlight-terrace.webp", sw_js)
        self.assertIn("./assets/generated/hero-garden.webp", sw_js)


if __name__ == "__main__":
    unittest.main()
