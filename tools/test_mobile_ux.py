import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class MobileUxTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.index = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        cls.manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))

    def test_mobile_viewport_and_zoom_remain_available(self):
        self.assertIn('content="width=device-width, initial-scale=1, viewport-fit=cover"', self.index)
        self.assertNotIn("user-scalable=no", self.index)
        self.assertNotIn("maximum-scale=1", self.index)

    def test_game_pages_use_compact_mobile_layout(self):
        self.assertIn('document.body.classList.toggle("game-active", Boolean(gameId))', self.app)
        self.assertIn(".game-layout > .game-intro", self.css)
        self.assertIn(".toolbar-primary", self.css)
        self.assertIn(".toolbar-actions", self.css)

    def test_standard_touch_controls_have_44px_minimum(self):
        self.assertIn("min-height: 44px;", self.css)
        self.assertIn("--tap-size: 48px", self.css)
        self.assertIn("viewport-fit=cover", self.index)
        self.assertIn("env(safe-area-inset-bottom", self.css)

    def test_falling_board_can_start_from_a_tap(self):
        self.assertIn('aria-label="Falling Shapes game board. Tap to start or resume."', self.app)
        self.assertIn("if (!running) {", self.app)
        self.assertIn("startNewGame();", self.app)
        self.assertIn("movementButtons.forEach", self.app)

    def test_stale_completion_ids_do_not_unlock_worlds(self):
        self.assertIn("knownLevelIds", self.app)
        self.assertIn("knownLevelIds.has(id)", self.app)

    def test_manifest_is_installable_and_has_shortcuts(self):
        self.assertEqual(self.manifest["display"], "standalone")
        self.assertEqual(self.manifest["start_url"], "./")
        self.assertEqual(len(self.manifest["shortcuts"]), 4)
        purposes = {icon["purpose"] for icon in self.manifest["icons"]}
        self.assertIn("maskable", purposes)

    def test_service_worker_tolerates_optional_asset_failure(self):
        self.assertIn("Promise.allSettled", self.sw)
        self.assertIn("withTimeout", self.sw)
        self.assertIn('key.startsWith(CACHE_PREFIX)', self.sw)
        self.assertNotIn("keys.filter((key) => key !== CACHE_NAME)", self.sw)


if __name__ == "__main__":
    unittest.main()
