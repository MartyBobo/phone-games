# Game Asset Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete static asset pipeline for Puzzle Garden: prompt pack, source sheets, slicer, generated runtime assets, and app integration.

**Architecture:** Authoring inputs live under `assets/source/imagegen/`; runtime files live under `assets/generated/` plus existing root PWA icons. A Pillow-based processor reads `asset-manifest.json`, slices source sheets into stable filenames, and the static PWA references generated outputs with fallbacks.

**Tech Stack:** Static HTML/CSS/JS PWA, Python 3, Pillow, JSON manifests, OpenAI Image API prompts documented for later live generation.

---

## File Structure

- Create `docs/assets/prompt-pack.md`: complete copy/paste image-generation prompts for all game asset families.
- Create `assets/source/imagegen/asset-manifest.json`: source-sheet slicing instructions for tile faces, game icons, worlds, hero, app icon, board texture, and UI accents.
- Create `tools/process_assets.py`: deterministic processor for grid slicing, trimming, padding, resizing, and reporting.
- Create `tools/generate_placeholder_sources.py`: local stand-in source-sheet generator used when `OPENAI_API_KEY` is unavailable.
- Create `tools/test_process_assets.py`: focused unit tests for the processor.
- Modify `app.js`: generated tile face rendering, generated game icons, generated hero, generated world path validation.
- Modify `styles.css`: stable generated image sizing inside existing UI.
- Modify `campaign.json`: generated world art paths after generated world assets exist.
- Modify `sw.js`: cache generated runtime assets and bump cache version.
- Modify root app icon PNGs: write processed generated PWA icons.

## Task 1: Prompt Pack And Manifest

**Files:**
- Create: `docs/assets/prompt-pack.md`
- Create: `assets/source/imagegen/asset-manifest.json`

- [ ] **Step 1: Add the prompt pack**

Create `docs/assets/prompt-pack.md` with sections for Tile Pairs face sheets, game icons, world scenes, hero/app icon, board texture, and UI accents. Each prompt must use this common constraint block:

```text
Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp silhouette, soft studio lighting, gentle garden fantasy, no text, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
Composition constraints for source sheets: strict evenly spaced grid, one isolated object per cell, centered subject, generous margins, consistent scale, flat chroma-safe pale background or transparent background.
```

- [ ] **Step 2: Add the slicing manifest**

Create `assets/source/imagegen/asset-manifest.json` with entries:

```json
{
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
      "outputs": [
        "w1-f0.png", "w1-f1.png", "w1-f2.png", "w1-f3.png", "w1-f4.png", "w1-f5.png", "w1-f6.png", "w1-f7.png",
        "w2-f0.png", "w2-f1.png", "w2-f2.png", "w2-f3.png", "w2-f4.png", "w2-f5.png", "w2-f6.png", "w2-f7.png",
        "w3-f0.png", "w3-f1.png", "w3-f2.png", "w3-f3.png", "w3-f4.png", "w3-f5.png", "w3-f6.png", "w3-f7.png",
        "w4-f0.png", "w4-f1.png", "w4-f2.png", "w4-f3.png", "w4-f4.png", "w4-f5.png", "w4-f6.png", "w4-f7.png",
        "w5-f0.png", "w5-f1.png", "w5-f2.png", "w5-f3.png", "w5-f4.png", "w5-f5.png", "w5-f6.png", "w5-f7.png",
        "w6-f0.png", "w6-f1.png", "w6-f2.png", "w6-f3.png", "w6-f4.png", "w6-f5.png", "w6-f6.png", "w6-f7.png"
      ]
    }
  ]
}
```

Add additional manifest entries for `game-icons`, `worlds`, `hero`, `app-icons`, `board-texture`, and `ui-accents`.

- [ ] **Step 3: Commit prompt and manifest**

Run:

```powershell
git add docs/assets/prompt-pack.md assets/source/imagegen/asset-manifest.json
git commit -m "Add generated asset prompt pack and manifest"
```

Expected: commit succeeds with only documentation and manifest changes.

## Task 2: Asset Processor With Tests

**Files:**
- Create: `tools/process_assets.py`
- Create: `tools/test_process_assets.py`

- [ ] **Step 1: Write processor tests**

Create tests that build a temporary 2x1 source image, process it, and assert that two output PNGs exist at `64x64`. Include tests for manifest validation errors.

Run:

```powershell
python tools/test_process_assets.py
```

Expected before implementation: fails because `tools/process_assets.py` is missing.

- [ ] **Step 2: Implement processor**

`tools/process_assets.py` must expose:

```python
def load_manifest(path: Path) -> dict: ...
def process_manifest(manifest_path: Path, root: Path, check_only: bool = False) -> list[dict]: ...
def main(argv: list[str] | None = None) -> int: ...
```

CLI commands:

```powershell
python tools/process_assets.py --check
python tools/process_assets.py
```

Expected: `--check` validates the manifest and source presence; normal mode writes outputs and prints a JSON report.

- [ ] **Step 3: Run tests**

Run:

```powershell
python tools/test_process_assets.py
```

Expected: all tests pass.

- [ ] **Step 4: Commit processor**

Run:

```powershell
git add tools/process_assets.py tools/test_process_assets.py
git commit -m "Add generated asset processor"
```

Expected: commit succeeds.

## Task 3: Source Sheets And Runtime Asset Generation

**Files:**
- Create: `tools/generate_placeholder_sources.py`
- Create/modify: `assets/source/imagegen/*.png`
- Create/modify: `assets/generated/**`
- Modify: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`

- [ ] **Step 1: Add local source-sheet fallback generator**

Create `tools/generate_placeholder_sources.py` that writes source sheets matching the manifest when live OpenAI image generation is unavailable:

```powershell
python tools/generate_placeholder_sources.py
```

Expected output files:

- `assets/source/imagegen/tile-faces-source.png`
- `assets/source/imagegen/game-icons-source.png`
- `assets/source/imagegen/worlds-source.png`
- `assets/source/imagegen/hero-source.png`
- `assets/source/imagegen/app-icon-source.png`
- `assets/source/imagegen/board-texture-source.png`
- `assets/source/imagegen/ui-accents-source.png`

- [ ] **Step 2: Generate runtime assets**

Run:

```powershell
python tools/generate_placeholder_sources.py
python tools/process_assets.py
```

Expected: all manifest outputs exist, including `assets/generated/tile-faces/w1-f0.png` through `assets/generated/tile-faces/w6-f7.png`.

- [ ] **Step 3: Commit generated assets**

Run:

```powershell
git add tools/generate_placeholder_sources.py assets/source/imagegen assets/generated icon-192.png icon-512.png apple-touch-icon.png
git commit -m "Generate Puzzle Garden runtime assets"
```

Expected: commit succeeds with source sheets and runtime assets.

## Task 4: App Wiring

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `campaign.json`
- Modify: `sw.js`

- [ ] **Step 1: Wire generated asset paths in `app.js`**

Add constants:

```js
const GENERATED_ASSET_ROOT = "assets/generated";
const TILE_FACE_ASSET_RE = /^w[1-6]-f[0-7]$/;
```

Update `GAME_META[*].art` to `assets/generated/game-icons/*.png`.

Update hero image references from `assets/hero-garden.svg` to `assets/generated/hero-garden.webp`.

Add:

```js
function tileFaceAssetPath(face) {
  const id = String(face || "");
  return TILE_FACE_ASSET_RE.test(id) ? `${GENERATED_ASSET_ROOT}/tile-faces/${id}.png` : "";
}
```

In `renderBoard()`, replace `button.textContent = label;` with image-first fallback rendering.

- [ ] **Step 2: Add CSS for generated images**

Add:

```css
.tile-face-image {
  display: block;
  width: min(78%, 54px);
  height: min(78%, 54px);
  object-fit: contain;
  pointer-events: none;
}

.mahjong-tile .tile-face-fallback {
  line-height: 1;
}
```

Update `.hero-art.hero-image img` and `.game-card-icon img` only if generated images need additional `object-fit` constraints.

- [ ] **Step 3: Update world art and offline cache**

Change six `campaign.json` world `art` values to `assets/generated/worlds/*.webp`.

Update `safeWorldArtPath()` to accept:

```js
/^assets\/(?:worlds\/[a-z0-9-]+\.svg|generated\/worlds\/[a-z0-9-]+\.webp)$/
```

Bump the `CACHE_NAME` in `sw.js` and add all generated runtime paths to `STATIC_ASSETS`.

- [ ] **Step 4: Commit app wiring**

Run:

```powershell
git add app.js styles.css campaign.json sw.js
git commit -m "Wire generated assets into Puzzle Garden"
```

Expected: commit succeeds.

## Task 5: Verification

**Files:**
- Modify only if verification finds defects.

- [ ] **Step 1: Validate processing**

Run:

```powershell
python tools/test_process_assets.py
python tools/process_assets.py --check
```

Expected: tests pass and manifest check succeeds.

- [ ] **Step 2: Start local server**

Run:

```powershell
python -m http.server 8080
```

Expected: static server serves the app at `http://localhost:8080`.

- [ ] **Step 3: Browser QA**

Open `http://localhost:8080` and inspect:

- home screen hero and game cards show generated assets.
- world cards show generated WebP art.
- Tile Pairs board shows generated symbols while button labels remain accessible.
- no console errors appear.
- 320px-wide viewport has no image overlap or tile layout shift.

- [ ] **Step 4: Commit any verification fixes**

Run:

```powershell
git status --short
git add <fixed-files>
git commit -m "Fix generated asset verification issues"
```

Expected: only necessary fixes are committed.

## Self-Review

Spec coverage:

- Prompt pack: Task 1.
- Manifest: Task 1.
- Processor and trimming: Task 2.
- Image/source generation fallback: Task 3.
- Runtime generated assets for the whole game: Task 3.
- Tile Pairs, game icons, world cards, hero/app icons, offline cache integration: Task 4.
- Verification: Task 5.

Placeholder scan: no `TBD`, `TODO`, or open-ended "handle later" instructions are intentionally present.

Type consistency: manifest `id`, `source`, `outputDir`, `cols`, `rows`, `outputs`, `size`, `format`, `trimMode`, `padding`, and `chroma` names are used consistently across the planned processor and manifest.
