# Puzzle Garden image-generation prompt pack

Use these prompts to create replacement raster artwork. The website already includes lightweight original SVG icons; these prompts are for a richer optional art pass.

## Shared style block

Append this block to every prompt:

```text
Original artwork for a family-friendly mobile puzzle game called Puzzle Garden. Calm contemporary storybook vector illustration, rounded geometric forms, friendly expressions, thick smooth dark-teal outlines, simple silhouettes readable at 64–96 pixels, limited harmonious palette, subtle paper texture, very light soft shading, high foreground/background contrast, generous clear space, no text, no letters, no numbers, no logos, no signatures, no watermark, no copyrighted character, no commercial-game trade dress, no photorealism, no complex 3D rendering, no thin outlines, no muddy colors, no frightening expression, no cropped ears, wings, tails, or objects.
```

## Character sheets

Generate each character sheet at **2048×2048**. Use an exact 2×2 grid with one character per square, transparent background, equal scale, front-facing or slight three-quarter view, head and upper torso, and at least 12% empty margin around each character. Nothing may cross a cell boundary.

### Seedling Meadow

```text
Create an exact 2×2 character sheet with four Puzzle Garden characters.
Top left: cheerful round garden bee, two translucent wings, short antennae, broad golden stripes.
Top right: gentle snail, large spiral shell, two expressive eye stalks.
Bottom left: friendly robin, rounded body, small wings, warm coral breast.
Bottom right: smiling hedgehog, rounded face, clear ring of stylized leaf-shaped spines.
Palette: dark teal #315F5A, leaf green #85B47D, pale mint #DFF3E2, warm yellow #F5D58A, soft coral #EC9A6A, cream #FFF8E8.
Use the shared Puzzle Garden style block.
```

Output filenames: `bee.png`, `snail.png`, `robin.png`, `hedgehog.png`.

### Lantern Grove

```text
Create an exact 2×2 character sheet with four Puzzle Garden characters.
Top left: friendly red-orange fox, oversized triangular ears, cream muzzle, leafy neck ruff.
Top right: wise cheerful owl, large circular eyes, small feather tufts, lantern-shaped chest marking.
Bottom left: soft twilight moth, broad rounded wings, simple glowing spots, curled antennae.
Bottom right: playful raccoon, clear dark eye mask, round ears, striped tail visible behind one shoulder.
Palette: midnight teal #182D31, twilight blue #30334E, violet #70608F, lantern gold #F0B35F, ember coral #EF7F62, warm cream #FFF2BD.
Use the shared Puzzle Garden style block.
```

Output filenames: `fox.png`, `owl.png`, `moth.png`, `raccoon.png`.

### Moonlit Pond

```text
Create an exact 2×2 character sheet with four Puzzle Garden characters.
Top left: happy green frog, large round eyes, smooth cheeks, tiny lily-pad collar.
Top right: friendly koi fish, curved swimming pose, broad fins, simple cream markings.
Bottom left: cheerful duck, rounded body, short bill, one moon-shaped feather marking.
Bottom right: calm otter, rounded ears, cream muzzle, short whiskers, paws held together.
Palette: deep pond teal #163D4B, moonlit blue #5B89A2, water green #8DBFA6, pale moon #DFEAB8, lotus pink #F2C5DB, cream #FFFBE9.
Use the shared Puzzle Garden style block.
```

Output filenames: `frog.png`, `koi.png`, `duck.png`, `otter.png`.

### Crystal Conservatory

```text
Create an exact 2×2 character sheet with four Puzzle Garden characters.
Top left: graceful butterfly, broad symmetrical wings, simple prism-shaped markings.
Top right: smiling gecko, curved tail, rounded toes, small crystal spots.
Bottom left: friendly conservatory cat, pointed ears, leaf-shaped nose, subtle vine markings.
Bottom right: cheerful beetle, smooth jewel-like shell, simple segmented antennae.
Palette: deep indigo #4E557B, conservatory violet #8D75AB, crystal mint #8FD1C7, orchid pink #F0BDE0, pale lilac #ECE4FA, white #FFFDF8.
Use the shared Puzzle Garden style block.
```

Output filenames: `butterfly.png`, `gecko.png`, `cat.png`, `beetle.png`.

### Cloud Orchard

```text
Create an exact 2×2 character sheet with four Puzzle Garden characters.
Top left: friendly long-eared hare, small apple-leaf neck decoration.
Top right: graceful smiling swan, curved neck, one folded wing.
Bottom left: cheerful hummingbird, long narrow bill, compact body, rounded decorative wings.
Bottom right: gentle fluffy alpaca, rounded muzzle, upright ears, small fruit-blossom decoration.
Palette: orchard blue #4479A3, sky blue #BFE3F4, leaf green #77B37B, fruit gold #F2B96E, apple coral #EF7D76, cloud cream #FFF6DD.
Use the shared Puzzle Garden style block.
```

Output filenames: `hare.png`, `swan.png`, `hummingbird.png`, `alpaca.png`.

### Starlight Terrace

```text
Create an exact 2×2 character sheet with four magical Puzzle Garden characters.
Top left: moon rabbit, tall ears, pale crescent chest marking, small star beside one ear.
Top right: star fox, pointed ears, cream crescent muzzle marking, star-shaped forehead marking.
Bottom left: comet owl, large circular eyes, feather tufts, one curved comet-tail marking.
Bottom right: constellation cat, pointed ears, crescent smile, small connected-star pattern on one cheek.
Palette: night blue #1F234C, deep navy #151735, constellation violet #5C4D91, moon yellow #FFF1AA, starlight pink #E5BFE8, soft white #FFFDF8.
Use the shared Puzzle Garden style block.
```

Output filenames: `moon-rabbit.png`, `star-fox.png`, `comet-owl.png`, `constellation-cat.png`.

## Game texture atlases

Generate each atlas at **2048×2048** with an exact 2×2 grid. Each quadrant must be independently seamless and tileable, straight top-down, evenly lit, quiet enough for game pieces, and contain no symbols, text, numbers, perspective, or cast shadows.

Quadrant order for every atlas:

1. top left — Sudoku board surface
2. top right — matching-tile surface
3. bottom left — falling-shape block material
4. bottom right — crate/tower material

### Seedling Meadow atlas

```text
Create a 2×2 seamless texture atlas for Seedling Meadow.
Top left: very pale mint Sudoku board paper with faint pressed-leaf fibers and strong readability for dark numbers.
Top right: warm cream matching-tile surface made from smooth painted oak with tiny leaf-grain marks and a subtle rounded rim.
Bottom left: leaf-green falling-block material with a soft inset edge and one broad cream highlight.
Bottom right: dark-teal wooden crate material with rounded plank seams and leaf-shaped corner joints.
Palette: #315F5A, #85B47D, #DFF3E2, #F5D58A, #FFF8E8.
Use the shared Puzzle Garden style block.
```

Output filenames: `seedling-meadow-sudoku.webp`, `seedling-meadow-tiles.webp`, `seedling-meadow-falling.webp`, `seedling-meadow-crates.webp`.

### Lantern Grove atlas

```text
Create a 2×2 seamless texture atlas for Lantern Grove.
Top left: muted twilight-blue Sudoku surface with extremely faint tree-ring lines and readable cream numbers.
Top right: dark stained-wood matching-tile surface with a lantern-gold inset border and subtle mushroom-cap grain.
Bottom left: deep-violet falling-block material with one simple amber center highlight and rounded bevels.
Bottom right: midnight-teal forest-timber crate material with small lantern-gold corner caps.
Palette: #182D31, #30334E, #70608F, #F0B35F, #EF7F62, #FFF2BD.
Use the shared Puzzle Garden style block.
```

Output filenames: `lantern-grove-sudoku.webp`, `lantern-grove-tiles.webp`, `lantern-grove-falling.webp`, `lantern-grove-crates.webp`.

### Moonlit Pond atlas

```text
Create a 2×2 seamless texture atlas for Moonlit Pond.
Top left: pale moonlit-water Sudoku surface with extremely subtle horizontal ripple lines and a matte finish.
Top right: smooth lily-pad-green matching-tile surface with a rounded pale edge and one barely visible leaf vein.
Bottom left: blue-green falling-block material resembling polished water glass with one broad soft highlight.
Bottom right: dark pond-stone crate material with rounded stone divisions and tiny reed-green corner accents.
Palette: #163D4B, #31586B, #5B89A2, #8DBFA6, #DFEAB8, #F2C5DB.
Use the shared Puzzle Garden style block.
```

Output filenames: `moonlit-pond-sudoku.webp`, `moonlit-pond-tiles.webp`, `moonlit-pond-falling.webp`, `moonlit-pond-crates.webp`.

### Crystal Conservatory atlas

```text
Create a 2×2 seamless texture atlas for Crystal Conservatory.
Top left: pale-lilac frosted-glass Sudoku surface with faint geometric pane lines that do not interfere with numbers.
Top right: soft crystal-mint matching-tile surface with a rounded violet rim and one subtle faceted highlight.
Bottom left: polished violet falling-block material with broad prism color separation, rounded edges, and no sharp glare.
Bottom right: deep-indigo crate material resembling strong translucent crystal blocks with mint corner joints.
Palette: #4E557B, #8D75AB, #8FD1C7, #F0BDE0, #ECE4FA, #FFFDF8.
Use the shared Puzzle Garden style block.
```

Output filenames: `crystal-conservatory-sudoku.webp`, `crystal-conservatory-tiles.webp`, `crystal-conservatory-falling.webp`, `crystal-conservatory-crates.webp`.

### Cloud Orchard atlas

```text
Create a 2×2 seamless texture atlas for Cloud Orchard.
Top left: pale sky-blue Sudoku surface with extremely faint cloud-paper fibers and clear dark-number readability.
Top right: cream orchard-wood matching-tile surface with a rounded fruit-gold edge and subtle circular wood grain.
Bottom left: clear sky-blue falling-block material with rounded white cloud-like corners and a simple central highlight.
Bottom right: medium-blue painted orchard-wood crate material with warm fruit-gold joints and subtle plank seams.
Palette: #4479A3, #BFE3F4, #77B37B, #F2B96E, #EF7D76, #FFF6DD.
Use the shared Puzzle Garden style block.
```

Output filenames: `cloud-orchard-sudoku.webp`, `cloud-orchard-tiles.webp`, `cloud-orchard-falling.webp`, `cloud-orchard-crates.webp`.

### Starlight Terrace atlas

```text
Create a 2×2 seamless texture atlas for Starlight Terrace.
Top left: very dark navy Sudoku surface with only a few faint constellation-line marks and readable pale numbers.
Top right: deep-violet matching-tile surface with a rounded moon-yellow rim and tiny scattered-star grain.
Bottom left: rich constellation-violet falling-block material with a broad moonlit highlight and two or three tiny star points.
Bottom right: midnight-blue celestial-stone crate material with pale moon-yellow corner joints.
Palette: #151735, #1F234C, #5C4D91, #FFF1AA, #E5BFE8, #FFFDF8.
Use the shared Puzzle Garden style block.
```

Output filenames: `starlight-terrace-sudoku.webp`, `starlight-terrace-tiles.webp`, `starlight-terrace-falling.webp`, `starlight-terrace-crates.webp`.

## Processing generated sheets

Use `tools/slice_artwork.py` in this project to crop character sheets, texture atlases, or 4×2 symbol sheets. It trims transparency, adds safe padding, creates phone-friendly sizes, and exports PNG or WebP files.
