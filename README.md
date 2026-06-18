# Puzzle Garden - touch-first mobile PWA

Puzzle Garden is a static Progressive Web App containing four original puzzle games and a 240-level campaign catalog:

- **Number Grid** - Sudoku-style number placement.
- **Tile Pairs** - layered matching inspired by Mahjong Solitaire.
- **Falling Shapes** - an original falling-block game.
- **Crate Trail** - an original crate-tipping path puzzle.

The campaign is loaded from `campaign.json` and contains six worlds with 40 levels each: 10 levels per game in every world. Progress is stored locally in the browser by catalog level ID.

This version adapts the uploaded game for phone and tablet browsers. A single hosted website works on iPhone, iPad, Android, and desktop without distributing an Android application file.

## Mobile improvements

The app now includes:

- Layouts tested from 280-pixel-wide phones through tablets.
- Portrait and short-landscape layouts.
- Dynamic viewport-height handling for mobile browser bars.
- iPhone and Android safe-area padding.
- No horizontal page overflow at tested sizes.
- Touch targets of at least 44 CSS pixels for standard controls.
- Immediate pointer feedback when a control is pressed.
- Long-press menu prevention on active game boards.
- Sticky thumb controls for Number Grid, Falling Shapes, and Crate Trail.
- Side-by-side boards and controls on short landscape phones.
- Touch gestures for Falling Shapes, in addition to on-screen buttons.
- Responsive game boards that use the available content width rather than overflowing the viewport.
- A browser installation prompt where supported.
- iPhone Add-to-Home-Screen instructions.
- A standalone PWA manifest and offline service worker.
- Original SVG game icons and a garden hero illustration.

## Run locally

From the repository root, run:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Opening `index.html` directly runs the games, but PWA installation and the service worker require HTTP on localhost or HTTPS on a deployed website.

## Publish it

Upload the repository root to a static HTTPS host. No build process or backend is required for this mobile version.

For GitHub Pages, configure the site to publish from the `main` branch root so `index.html` is served at `https://martybobo.github.io/phone-games/`. Suitable static hosts also include Cloudflare Pages, Netlify, or an ordinary HTTPS web server. Keep all paths and filenames together.

## Install on iPhone or iPad

1. Open the published HTTPS website in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**.
4. Confirm the name and tap **Add**.

The Home Screen icon opens Puzzle Garden in a standalone window. Visit the website once while online before testing offline launch.

## Install on Android

1. Open the published HTTPS website in Chrome or another browser that supports PWA installation.
2. Tap **Install app** when the prompt appears, or open the browser menu.
3. Choose **Install app** or **Add to Home screen**.

## Touch controls

### Number Grid

Tap a square, then tap a number. The number pad stays near the bottom of the screen on narrow phones. Pencil notes, hints, undo, reset, and mistake highlighting remain available.

### Tile Pairs

Tap one open tile, then tap its matching open tile. Blocked tiles are dimmed. The complete layered board scales to the available phone width.

### Falling Shapes

Use the large on-screen buttons or swipe on the game board:

- Tap the board or swipe up to rotate.
- Swipe left or right to move.
- Swipe down to hard-drop.
- The arrow and drop buttons provide an alternative for every gesture.

### Crate Trail

Tap a highlighted reachable tower, then tap an enabled direction. The direction pad stays near the bottom on narrow screens. In short landscape mode, the board and direction controls appear side by side.

## Accessibility

- Large-text control.
- Sound on/off control.
- Visible keyboard focus.
- Screen-reader labels on interactive board elements.
- Reduced-motion support through the operating-system preference.
- State is not communicated by color alone.
- The browser's normal pinch-to-zoom remains available.

## File structure

```text
phone-games/
|-- index.html
|-- styles.css
|-- app.js
|-- campaign.json
|-- manifest.webmanifest
|-- sw.js
|-- icon-192.png
|-- icon-512.png
|-- apple-touch-icon.png
`-- assets/
    |-- hero-garden.svg
    |-- icons/
    |-- textures/
    `-- worlds/
```


## Data and account limitation

This mobile package preserves the current static architecture: progress and settings are stored in the browser on the device. It does not contain the separate server, database, username/password account system, shared leaderboard, or cross-device synchronization described in the larger full-stack expansion plan.
