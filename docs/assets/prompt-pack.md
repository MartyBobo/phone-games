# Puzzle Garden Image Generation Prompt Pack

These prompts are written for generating source sheets that will be sliced by `tools/process_assets.py`. Use an image model for generation; use a reasoning model only to refine these prompts. Keep the source sheets large, evenly spaced, and easy to crop.

Common style constraints for every prompt:

```text
Cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouettes, soft studio lighting, gentle garden fantasy, tactile toy-like materials, clean edges, no text, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
```

Common source-sheet constraints:

```text
Strict evenly spaced grid, one isolated subject per cell, centered subject, generous margins, consistent scale, consistent camera angle, flat chroma-safe pale background (#f5f7ea) or transparent background, no overlapping cells.
```

## Tile Pairs Face Sheet

Use case: `stylized-concept`

Asset type: Tile Pairs symbol source sheet for a mobile puzzle game.

Prompt:

```text
Create one 8 columns by 6 rows source sheet of isolated garden puzzle symbols. Each cell contains exactly one centered icon-like object. Row 1 Seedling Meadow: seedling leaf, curled sprout, meadow flower, warm sun disk, soft cloud, friendly bee-like garden charm, watering can, seed packet. Row 2 Lantern Grove: paper lantern, spotted mushroom, bark spiral, tiny moth charm, warm flame, acorn, crescent leaf, grove amulet. Row 3 Moonlit Pond: lily pad, water ripple, reed bundle, moon disk, water bloom, smooth pebble, pond fish charm, droplet. Row 4 Crystal Conservatory: crystal cluster, curling vine, glass pane, prism shard, orchid bloom, gem leaf, greenhouse arch, sparkle star. Row 5 Cloud Orchard: round fruit, orchard branch, puff cloud, tiny windmill, fruit basket, blossom, feather-light leaf, floating island charm. Row 6 Starlight Terrace: star flower, small comet, constellation knot, moonlit path stone, night leaf, glowing seed, terrace stone, aurora petal.

Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouettes, soft studio lighting, gentle garden fantasy, tactile toy-like materials, clean edges, no text, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
Composition constraints: strict 8 by 6 evenly spaced grid, one isolated object per cell, centered subject, generous margins, consistent scale, flat chroma-safe pale background (#f5f7ea), no labels, no border lines, no overlapping cells.
Color constraints: each row follows its world palette but all symbols remain readable on ivory game tiles. Use balanced greens, warm yellows, pond blues, crystal violets, sky blues, and starlight purples without making the sheet one-note.
Regenerate if: any cell has text, any object touches another cell, symbols are too detailed for 32px display, background is dark, or row themes are mixed.
```

Expected processing:

- Source file: `assets/source/imagegen/tile-faces-source.png`
- Runtime output: `assets/generated/tile-faces/w1-f0.png` through `assets/generated/tile-faces/w6-f7.png`
- Grid: 8 columns by 6 rows

## Game Icons Sheet

Use case: `stylized-concept`

Asset type: Four game-card icons.

Prompt:

```text
Create one 4 columns by 1 row source sheet of isolated polished app game icons for a cozy mobile puzzle game named Puzzle Garden. Cell 1 Number Grid: a garden-styled number/grid tile with a bold number and subtle leaf corner, no readable text beyond a single simple numeral. Cell 2 Tile Pairs: two matching ivory puzzle tiles with small botanical symbols. Cell 3 Falling Shapes: three colorful falling block pieces with soft garden accents. Cell 4 Crate Trail: a small stack of wooden crates tipping to form a path with a red lantern-like goal marker.

Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouettes, soft studio lighting, gentle garden fantasy, tactile toy-like materials, clean edges, no words, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no tiny details, no harsh bloom.
Composition constraints: strict 4 by 1 evenly spaced grid, one isolated icon cluster per cell, centered subject, generous margins, consistent scale, transparent or #f5f7ea background, no labels, no border lines.
Regenerate if: icons do not read at small size, style differs between cells, any label-like text appears, or the crate/trail icon looks like a generic box app icon.
```

Expected processing:

- Source file: `assets/source/imagegen/game-icons-source.png`
- Runtime output: `assets/generated/game-icons/*.png`
- Grid: 4 columns by 1 row

## World Scene Sheet

Use case: `stylized-concept`

Asset type: Six campaign world card scenes.

Prompt:

```text
Create one 3 columns by 2 rows source sheet of wide cozy fantasy garden world scenes for mobile campaign cards. Each cell is a complete landscape scene with no text and no frame. Row 1 cell 1 Seedling Meadow: sunny grass, leaves, flowers, gentle clouds, warm seedling path. Row 1 cell 2 Lantern Grove: twilight trees, warm hanging lanterns, mushrooms, dark wood, safe cozy glow. Row 1 cell 3 Moonlit Pond: lily pads, reeds, silver moonlight, ripples, calm water. Row 2 cell 1 Crystal Conservatory: glass greenhouse, vines, crystals, prism light, refined magical garden. Row 2 cell 2 Cloud Orchard: floating orchards, fruit trees, clouds, tiny windmills, bright airy sky. Row 2 cell 3 Starlight Terrace: constellations, comets, moon flowers, glowing paths, deep night garden.

Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, soft painterly depth, crisp shapes, no text, no logos, no watermark, no people, no UI screenshot, no photorealism, no clutter, no harsh bloom.
Composition constraints: strict 3 by 2 grid, each scene uses a wide 16:9 composition, important subject in the center third, no cell borders, no scene overlaps, generous top space for card readability, bright enough for locked/unlocked overlays.
Regenerate if: any scene contains text, characters, heavy darkness, low contrast, cropped focal objects, or a palette that does not match its world.
```

Expected processing:

- Source file: `assets/source/imagegen/worlds-source.png`
- Runtime output: `assets/generated/worlds/*.webp`
- Grid: 3 columns by 2 rows

## Hero Image

Use case: `stylized-concept`

Asset type: Homepage hero illustration.

Prompt:

```text
Create a wide hero illustration for Puzzle Garden, a cozy mobile puzzle game. Show puzzle tiles, garden paths, tiny world hints, soft rolling foliage, and playful puzzle pieces arranged like a welcoming garden table. No characters. Leave gentle negative space around the center and upper right so the layout stays calm on small phones.

Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, soft studio lighting, tactile toy-like materials, crisp shapes, no text, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no harsh bloom.
Composition constraints: 640 by 420 landscape, rounded composition friendly to card display, important details not closer than 8 percent from any edge, readable when scaled down.
Regenerate if: text appears, objects are too dense, the image feels like a stock banner, or the game theme is not clear in the first glance.
```

Expected processing:

- Source file: `assets/source/imagegen/hero-source.png`
- Runtime output: `assets/generated/hero-garden.webp`

## App Icon Master

Use case: `logo-brand`

Asset type: PWA install icon master.

Prompt:

```text
Create a square app icon master for Puzzle Garden. The icon should show a stylized ivory puzzle tile with a sprouting leaf and tiny star/number motif, set on a warm green garden background. It must feel like a polished cozy puzzle game icon and remain readable at 192px and 48px. Do not include letters, words, or logo text.

Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp readable silhouette, soft studio lighting, gentle garden fantasy, no text, no logos, no watermark, no hands, no photorealism, no clutter, no tiny details, no harsh bloom.
Composition constraints: square, centered symbol, maskable-safe with key content inside the central 72 percent, rounded-corner-friendly, high contrast against phone home screens.
Regenerate if: text or letters appear, content touches the edges, or the icon is unreadable at small sizes.
```

Expected processing:

- Source file: `assets/source/imagegen/app-icon-source.png`
- Runtime output: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`

## Board Texture

Use case: `stylized-concept`

Asset type: Subtle repeatable board paper texture.

Prompt:

```text
Create a square subtle ivory paper texture for cozy puzzle boards, with faint fibers, barely visible garden flecks, and a soft handmade material feel. It must tile cleanly enough for small panels and never compete with puzzle symbols.

Style constraints: subtle, low contrast, warm ivory, no text, no logos, no watermark, no obvious pattern seams, no dirt, no stains, no harsh shadows.
Composition constraints: square texture, evenly distributed detail, no focal object, no border.
Regenerate if: contrast is too high, visible objects appear, or it looks dirty rather than refined.
```

Expected processing:

- Source file: `assets/source/imagegen/board-texture-source.png`
- Runtime output: `assets/generated/textures/board-paper.png`

## UI Accents Sheet

Use case: `stylized-concept`

Asset type: Small celebratory and decorative UI accents.

Prompt:

```text
Create one 4 columns by 1 row source sheet of tiny decorative UI accents for a cozy garden puzzle game. Cell 1 soft sparkle burst, cell 2 leafy completion badge, cell 3 tiny star bloom, cell 4 gentle confetti flower cluster.

Style constraints: cohesive cozy mobile puzzle game art, polished 2.5D illustration, crisp silhouette, soft studio lighting, no text, no logos, no watermark, no hands, no UI screenshot, no photorealism, no clutter, no harsh bloom.
Composition constraints: strict 4 by 1 grid, one accent per cell, centered subject, generous margins, transparent or #f5f7ea background, no labels, no borders.
Regenerate if: accents are too complex, too large, or too similar to each other.
```

Expected processing:

- Source file: `assets/source/imagegen/ui-accents-source.png`
- Runtime output: `assets/generated/ui/*.png`
