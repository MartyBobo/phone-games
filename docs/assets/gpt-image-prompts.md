# GPT Image Prompt List

Use these prompts to generate replacement source sheets for Puzzle Garden. Save each result to the exact source filename shown, then run:

```powershell
python tools\process_assets.py
```

The script will slice, trim, resize, and export runtime assets into `assets/generated/` plus the PWA icon files.

If you give Codex a finished image sheet instead, put it in `assets/source/imagegen/` with the matching filename below and I can format it into the game assets.

## Shared Style Block

Append this to every prompt:

```text
Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouettes, soft studio lighting, gentle garden fantasy, tactile toy-like materials, clean edges.
Rules: no text, no letters, no labels, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
Source sheet rules: strict grid, one isolated subject per cell, centered subject, generous margins, consistent scale, consistent camera angle, flat chroma-safe pale background #f5f7ea or transparent background, no overlapping cells.
```

## 1. Tile Face Source Sheet

Save as:

```text
assets/source/imagegen/tile-faces-source.png
```

Prompt:

```text
Create an 8 columns by 6 rows source sheet of isolated garden puzzle symbols for a cozy mobile puzzle game.

Row 1 Seedling Meadow: seedling leaf, curled sprout, meadow flower, warm sun disk, soft cloud, friendly bee-like garden charm, watering can, seed packet.
Row 2 Lantern Grove: paper lantern, spotted mushroom, bark spiral, tiny moth charm, warm flame, acorn, crescent leaf, grove amulet.
Row 3 Moonlit Pond: lily pad, water ripple, reed bundle, moon disk, water bloom, smooth pebble, pond fish charm, droplet.
Row 4 Crystal Conservatory: crystal cluster, curling vine, glass pane, prism shard, orchid bloom, gem leaf, greenhouse arch, sparkle star.
Row 5 Cloud Orchard: round fruit, orchard branch, puff cloud, tiny windmill, fruit basket, blossom, feather-light leaf, floating island charm.
Row 6 Starlight Terrace: star flower, small comet, constellation knot, moonlit path stone, night leaf, glowing seed, terrace stone, aurora petal.

Each symbol must be readable as a small tile-face icon on an ivory game tile. Use balanced greens, warm yellows, pond blues, crystal violets, sky blues, and starlight purples.

Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouettes, soft studio lighting, gentle garden fantasy, tactile toy-like materials, clean edges.
Rules: no text, no letters, no labels, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
Source sheet rules: strict 8 by 6 grid, one isolated subject per cell, centered subject, generous margins, consistent scale, consistent camera angle, flat chroma-safe pale background #f5f7ea or transparent background, no overlapping cells.
```

## 2. Game Icons Source Sheet

Save as:

```text
assets/source/imagegen/game-icons-source.png
```

Prompt:

```text
Create a 4 columns by 1 row source sheet of isolated polished game icons for a cozy mobile puzzle game called Puzzle Garden.

Cell 1 Number Grid: a garden-styled number/grid tile with a bold simple numeral shape and subtle leaf corner.
Cell 2 Tile Pairs: two matching ivory puzzle tiles with small botanical symbols.
Cell 3 Falling Shapes: three colorful falling block pieces with soft garden accents.
Cell 4 Crate Trail: a small stack of wooden crates tipping to form a path with a warm red lantern-like goal marker.

Each icon must be readable in a 64px game-card icon.

Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouettes, soft studio lighting, gentle garden fantasy, tactile toy-like materials, clean edges.
Rules: no words, no letters except one simple numeral shape in the Number Grid icon, no labels, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
Source sheet rules: strict 4 by 1 grid, one isolated icon cluster per cell, centered subject, generous margins, consistent scale, consistent camera angle, flat chroma-safe pale background #f5f7ea or transparent background, no overlapping cells.
```

## 3. World Scene Source Sheet

Save as:

```text
assets/source/imagegen/worlds-source.png
```

Prompt:

```text
Create a 3 columns by 2 rows source sheet of wide 16:9 fantasy garden world scenes for mobile campaign cards.

Row 1 cell 1 Seedling Meadow: sunny grass, leaves, flowers, gentle clouds, warm seedling path.
Row 1 cell 2 Lantern Grove: twilight trees, warm hanging lanterns, mushrooms, dark wood, safe cozy glow.
Row 1 cell 3 Moonlit Pond: lily pads, reeds, silver moonlight, ripples, calm water.
Row 2 cell 1 Crystal Conservatory: glass greenhouse, vines, crystals, prism light, refined magical garden.
Row 2 cell 2 Cloud Orchard: floating orchards, fruit trees, clouds, tiny windmills, bright airy sky.
Row 2 cell 3 Starlight Terrace: constellations, comets, moon flowers, glowing paths, deep night garden.

Each cell must be a complete landscape scene with no frame and no text. Keep important objects in the center third and leave enough calm space for card overlays.

Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, soft painterly depth, crisp shapes, gentle garden fantasy.
Rules: no text, no letters, no labels, no logos, no watermark, no people, no hands, no UI screenshot, no photorealism, no clutter, no harsh bloom.
Source sheet rules: strict 3 by 2 grid, each scene wide 16:9, no cell borders, no overlapping scenes.
```

## 4. Hero Source Image

Save as:

```text
assets/source/imagegen/hero-source.png
```

Prompt:

```text
Create a wide 640 by 420 hero illustration for Puzzle Garden, a cozy mobile puzzle game. Show puzzle tiles, garden paths, tiny world hints, soft rolling foliage, and playful puzzle pieces arranged like a welcoming garden table. No characters. Leave gentle negative space around the center and upper right so the layout stays calm on small phones.

Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, soft studio lighting, tactile toy-like materials, crisp shapes.
Rules: no text, no letters, no labels, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no harsh bloom.
Composition: landscape 640 by 420, important details at least 8 percent from all edges, readable when scaled down.
```

## 5. App Icon Source Image

Save as:

```text
assets/source/imagegen/app-icon-source.png
```

Prompt:

```text
Create a square app icon master for Puzzle Garden. Show a stylized ivory puzzle tile with a sprouting leaf and tiny star/number motif, set on a warm green garden background. It must feel like a polished cozy puzzle game icon and remain readable at 192px and 48px.

Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouette, soft studio lighting, gentle garden fantasy.
Rules: no text, no letters, no labels, no logos, no watermark, no hands, no photorealism, no clutter, no tiny details, no harsh bloom.
Composition: square, centered symbol, maskable-safe with key content inside the central 72 percent, rounded-corner-friendly, high contrast against phone home screens.
```

## 6. Board Texture Source Image

Save as:

```text
assets/source/imagegen/board-texture-source.png
```

Prompt:

```text
Create a square subtle ivory paper texture for cozy puzzle boards, with faint fibers, barely visible garden flecks, and a soft handmade material feel. It must tile cleanly enough for small panels and never compete with puzzle symbols.

Style: subtle, refined, low contrast, warm ivory.
Rules: no text, no letters, no labels, no logos, no watermark, no obvious pattern seams, no objects, no dirt, no stains, no harsh shadows.
Composition: square texture, evenly distributed detail, no focal point, no border.
```

## 7. UI Accents Source Sheet

Save as:

```text
assets/source/imagegen/ui-accents-source.png
```

Prompt:

```text
Create a 4 columns by 1 row source sheet of tiny decorative UI accents for a cozy garden puzzle game.

Cell 1 soft sparkle burst.
Cell 2 leafy completion badge.
Cell 3 tiny star bloom.
Cell 4 gentle confetti flower cluster.

Style: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp silhouette, soft studio lighting.
Rules: no text, no letters, no labels, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no harsh bloom.
Source sheet rules: strict 4 by 1 grid, one accent per cell, centered subject, generous margins, transparent or flat chroma-safe pale background #f5f7ea, no overlapping cells.
```
