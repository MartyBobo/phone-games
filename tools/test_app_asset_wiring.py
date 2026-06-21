import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AppAssetWiringTests(unittest.TestCase):
    def test_app_uses_generated_assets_for_primary_surfaces(self):
        app_js = (ROOT / "app.js").read_text(encoding="utf-8")
        index_html = (ROOT / "index.html").read_text(encoding="utf-8")
        styles = (ROOT / "styles.css").read_text(encoding="utf-8")
        campaign = json.loads((ROOT / "campaign.json").read_text(encoding="utf-8"))
        sw_js = (ROOT / "sw.js").read_text(encoding="utf-8")

        self.assertIn('const GENERATED_ASSET_ROOT = "assets/generated";', app_js)
        self.assertIn('const GENERATED_ASSET_VERSION = "mobile-v2";', app_js)
        self.assertIn("function versionGeneratedAssetPath(path)", app_js)
        self.assertIn('art: versionGeneratedAssetPath("assets/generated/game-icons/number-grid.png")', app_js)
        self.assertIn('art: versionGeneratedAssetPath("assets/generated/game-icons/tile-pairs.png")', app_js)
        self.assertIn('art: versionGeneratedAssetPath("assets/generated/game-icons/falling-shapes.png")', app_js)
        self.assertIn('art: versionGeneratedAssetPath("assets/generated/game-icons/crate-trail.png")', app_js)
        self.assertIn('versionGeneratedAssetPath(`${GENERATED_ASSET_ROOT}/hero-garden.webp`)', app_js)
        self.assertIn("versionGeneratedAssetPath(world.art)", app_js)
        self.assertIn("versionGeneratedAssetPath(`${GENERATED_ASSET_ROOT}/tile-faces/${id}.png`)", app_js)
        self.assertIn("function tileFaceAssetPath(face)", app_js)
        self.assertIn("tile-face-image", app_js)
        self.assertIn("generated\\/worlds", app_js)

        for world in campaign["worlds"]:
            self.assertTrue(world["art"].startswith("assets/generated/worlds/"))
            self.assertTrue(world["art"].endswith(".webp"))

        self.assertIn(".tile-face-image", styles)
        self.assertIn('<script src="app.js?v=mobile-v2" defer></script>', index_html)
        self.assertIn('const GENERATED_ASSET_VERSION = "mobile-v2";', sw_js)
        self.assertIn('const GENERATED_ASSET_PATHS = [', sw_js)
        self.assertIn('const TILE_FACE_PATHS = Array.from', sw_js)
        self.assertIn('`./assets/generated/tile-faces/w${worldIndex + 1}-f${faceIndex}.png`', sw_js)
        self.assertIn('"./assets/generated/worlds/starlight-terrace.webp"', sw_js)
        self.assertIn('"./assets/generated/hero-garden.webp"', sw_js)
        self.assertIn("GENERATED_ASSET_PATHS.map(versionGeneratedAssetPath)", sw_js)
        self.assertIn("Promise.allSettled", sw_js)


if __name__ == "__main__":
    unittest.main()
