# Game Asset Pipeline Design

Date: 2026-06-19

## Purpose

Puzzle Garden needs a complete generated asset set that can be made with image generation, trimmed into the exact pieces the static PWA needs, and wired into the app without making the game heavier or less accessible on phones. The selected direction is to create detailed prompts for every asset family, generate large master sheets, then run a deterministic local processing script that crops, pads, resizes, and names only the parts used by the game.

The first implementation phase will pilot the full loop on Tile Pairs symbols because that game currently renders emoji/text labels on `.mahjong-tile` buttons. Replacing those labels with cropped tile-face images gives the largest visible improvement with a small integration surface. After the pilot works, the same pipeline will produce game icons, world card art, board textures, hero/app icons, and optional UI accents.

## Current Project Context

The app is a static mobile PWA in the repository root. It has no build process and serves `index.html`, `app.js`, `styles.css`, `campaign.json`, `manifest.webmanifest`, and `sw.js` directly.

Existing asset surfaces:

- `assets/icons/*.svg` are used by `GAME_META` for the four game cards.
- `assets/worlds/*.svg` are referenced from `campaign.json` and sanitized by `safeWorldArtPath`.
- `assets/hero-garden.svg` is used on home and campaign screens.
- `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png` are used by the manifest and install surfaces.
- Tile Pairs face data uses IDs such as `w1-f0` through themed face IDs, but `renderBoard()` currently calls `catalogTileFaceLabel()` and puts the result in `button.textContent`.
- `sw.js` explicitly precaches static assets, so new runtime assets must be added there or generated paths must be covered by a manifest-loaded cache list.

## Recommended Approach

Use a prompt-pack plus source-sheet pipeline.

1. Write a detailed prompt pack for every game asset family.
2. Generate master sheets with generous spacing, consistent lighting, no text, no watermark, and easy-to-crop cells.
3. Store the raw generated masters separately from runtime assets.
4. Run a script that slices each master by an explicit grid manifest, trims transparent or near-solid margins, pads to a square when needed, resizes to runtime sizes, and writes stable PNG/WebP filenames.
5. Wire the app to generated assets through a small manifest and keep fallbacks to the existing SVG/text assets.

This is better than generating individual final images because master sheets keep visual style coherent, make regeneration cheaper, and let a local script fix size, alpha, padding, and filenames without hand-editing every image.

## Asset Families

### Tile Pairs Face Sets

Generate six themed 8-symbol sheets, one for each campaign world:

- Seedling Meadow: leaves, sprouts, flowers, sun, cloud, bee-like garden motif, watering can, seed packet.
- Lantern Grove: lantern, mushroom, bark spiral, moth, warm flame, acorn, crescent leaf, grove charm.
- Moonlit Pond: lily pad, ripple, reed, moon, water bloom, smooth pebble, fish-like pond motif, droplet.
- Crystal Conservatory: crystal, vine, glass pane, prism, orchid, gem leaf, greenhouse arch, sparkle.
- Cloud Orchard: fruit, branch, cloud, windmill, basket, blossom, feather-light leaf, floating island motif.
- Starlight Terrace: star flower, comet, constellation, moon path, night leaf, glowing seed, terrace stone, aurora petal.

Runtime output target:

- `assets/generated/tile-faces/w1-f0.png` through `w6-f7.png`
- Optional `@2x` exports only if visual checks show the base size is soft.

Tile faces must remain readable at small phone board sizes. Each symbol should be centered, high contrast against the existing ivory tile background, and not rely on tiny interior details.

### Game Icons

Generate one 1024px source sheet with four isolated polished icons:

- Number Grid: a garden-styled number/grid tile.
- Tile Pairs: two matching garden tiles.
- Falling Shapes: falling blocks with botanical color accents.
- Crate Trail: tipping stacked crates/path marker.

Runtime output target:

- `assets/generated/game-icons/number-grid.png`
- `assets/generated/game-icons/tile-pairs.png`
- `assets/generated/game-icons/falling-shapes.png`
- `assets/generated/game-icons/crate-trail.png`

These can replace `GAME_META[*].art` after visual verification. The existing SVGs remain as fallback assets.

### World Cards

Generate six wide scene masters matching the campaign world descriptions and palettes. The crops must work at `320x180` and larger responsive card sizes.

Runtime output target:

- `assets/generated/worlds/seedling-meadow.webp`
- `assets/generated/worlds/lantern-grove.webp`
- `assets/generated/worlds/moonlit-pond.webp`
- `assets/generated/worlds/crystal-conservatory.webp`
- `assets/generated/worlds/cloud-orchard.webp`
- `assets/generated/worlds/starlight-terrace.webp`

World art can be wired after updating `safeWorldArtPath()` to permit `assets/generated/worlds/*.webp` and updating `campaign.json`.

### Hero And App Icons

Generate a hero master and an app-icon master after the game icons and tile faces establish the style.

Runtime output target:

- `assets/generated/hero-garden.webp`
- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`

The app icons must be maskable-safe: important content stays inside the central safe area, with no text or tiny details.

### Board Textures And UI Accents

Generate subtle texture tiles and small accents only after core assets are in place:

- board paper texture replacement or enhancement.
- subtle world accent trims.
- celebratory particles or badge art.

These are optional until the main game surfaces use generated art successfully.

## Prompt Pack Design

The prompt pack should live in `docs/assets/prompt-pack.md` and include one prompt per master sheet. Each prompt should specify:

- Use case: `stylized-concept`.
- Asset type and exact runtime target.
- Subject list in grid order.
- Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp silhouettes.
- Composition: strict evenly spaced grid for sheets, centered subjects, generous margins, no overlap.
- Background: transparent if supported, otherwise flat chroma-safe off-white or pale green for script cleanup.
- Lighting: soft, consistent, no harsh bloom.
- Color: based on campaign palette, but not one-note.
- Constraints: no text, no logos, no watermark, no hands, no UI screenshots, no photorealism.
- Avoid: clutter, tiny details, stock clipart, inconsistent camera angle, dark backgrounds for transparent cutouts.

The prompt pack should also include negative prompts and a short "regenerate if" checklist for each asset family.

## Processing Script Design

Create a local script named `tools/process_assets.py`.

Inputs:

- raw master images under `assets/source/imagegen/`
- a JSON manifest named `assets/source/imagegen/asset-manifest.json`

Manifest fields:

- source image path
- output directory
- grid columns and rows
- ordered output filenames
- output size
- trim mode: alpha, chroma, or fixed cell crop
- padding percentage
- output format

Processing responsibilities:

- Validate that source images exist.
- Divide source images by manifest grid.
- Trim alpha or chroma background when configured.
- Keep centered square padding for tile faces and icons.
- Resize with high-quality filtering.
- Write stable filenames to `assets/generated/...`.
- Emit a report with output dimensions and warnings for suspiciously empty crops.

The script should not depend on a build step. It can use Pillow because the repo is static and asset processing is a local authoring step.

## App Integration Design

Tile Pairs integration:

- Add a `tileFaceAssetPath(face)` helper that accepts IDs like `w1-f0`.
- Render an `<img>` inside each `.mahjong-tile` when a generated tile face exists.
- Keep `catalogTileFaceLabel()` text as `aria-label` and fallback text when images are missing.
- Add CSS for `.tile-face-image` with stable dimensions so image loading does not shift tile layout.

Game icon integration:

- Update `GAME_META[*].art` to generated PNGs after the files exist.
- Keep current SVGs available until visual verification is complete.

World card integration:

- Permit generated world WebP paths in `safeWorldArtPath()`.
- Update `campaign.json` world art paths after generated files exist.

Offline integration:

- Update `sw.js` to precache generated runtime assets.
- Update service worker cache version when asset paths change.

## Error Handling And Fallbacks

- If generated tile face images are missing, Tile Pairs falls back to the existing label text.
- If world generated art is missing, leave the current SVG path in `campaign.json`.
- If a source sheet cannot be sliced, the script exits nonzero and does not partially rewrite unrelated output families.
- If generated files are too large for a static mobile PWA, prefer smaller PNG dimensions or WebP for large scene art.
- Do not remove existing SVG assets until generated replacements have passed visual checks.

## Testing And Verification

Verification must cover both asset correctness and app behavior:

- Run `python tools/process_assets.py --check` or equivalent dry-run validation.
- Confirm every manifest output exists and has the expected dimensions.
- Start a local HTTP server with `python -m http.server 8080`.
- Open the app in the browser and inspect:
  - home screen hero and game cards
  - world cards
  - Tile Pairs board with generated face images
  - narrow phone viewport around 320px wide
- Confirm no console errors.
- Confirm Tile Pairs is still keyboard/screen-reader accessible through button labels.
- Confirm `sw.js` includes generated runtime assets or otherwise caches them through a documented path.

## Scope Boundaries

This work does not change puzzle generation, campaign data semantics, progress storage, scoring, or installation flow. It also does not add a bundler or backend. All generated assets remain static files in the repository.

## Phasing

Phase 1:

- Prompt pack for all core game assets.
- Asset manifest shape.
- Tile Pairs master prompt.
- Tile Pairs slicing script and generated outputs.
- Tile Pairs app integration and verification.

Phase 2:

- Game icon prompts, outputs, and integration.
- Service worker cache update.

Phase 3:

- World card prompts, outputs, integration, and campaign path update.

Phase 4:

- Hero/app icon refresh.
- Optional board textures and accents.

Phase 5:

- Final full-app visual QA on desktop, small phone, and short landscape.
