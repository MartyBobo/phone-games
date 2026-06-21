# Puzzle Garden — touch-first mobile PWA

Puzzle Garden is a static Progressive Web App with four original puzzle games and a 240-level campaign:

- **Number Grid** — Sudoku-style number placement.
- **Tile Pairs** — layered matching inspired by Mahjong Solitaire.
- **Falling Shapes** — a falling-block mission game with touch gestures.
- **Crate Trail** — a crate-tipping path puzzle.

It runs entirely in the browser, requires no backend, and can be installed from the website on iPhone, iPad, and Android. Progress and settings are stored locally on the device.

## Mobile experience

The interface is designed around phone play rather than shrinking a desktop page:

- Compact game headers leave more room for the board.
- Standard controls meet a 44 CSS-pixel minimum touch target.
- Game boards fit narrow portrait screens without horizontal page scrolling.
- Short-landscape layouts place boards and controls side by side where useful.
- iPhone safe areas and Android display cutouts are respected through `viewport-fit=cover` and safe-area insets.
- Dynamic viewport measurements adapt when mobile browser bars or the on-screen keyboard change the usable height.
- Falling Shapes can be started, resumed, moved, rotated, and dropped using the board or visible controls.
- The home page puts Quick Play first and uses a swipeable campaign-world carousel on phones.
- Pinch-to-zoom remains available.
- Reduced-motion preferences, visible keyboard focus, screen-reader labels, large text, and sound controls are supported.

## Progressive Web App behavior

- Android browsers can show the native install prompt when eligible.
- iPhone and iPad users receive Safari **Add to Home Screen** instructions.
- The manifest includes maskable icons and shortcuts to all four games.
- The service worker caches the core app shell first and treats decorative generated art as optional, so one missing image cannot block installation.
- Navigation uses a short network timeout with an offline fallback, while static assets use stale-while-revalidate caching.
- Old Puzzle Garden caches are removed without deleting unrelated caches from the same origin.

## Run locally

From the repository root:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Opening `index.html` directly can display the games, but PWA installation, service workers, and campaign fetching require HTTP on localhost or HTTPS in production.

## Tests

Install Pillow, then run the complete unit suite:

```bash
python -m pip install Pillow
PYTHONPATH=tools python -m unittest discover -s tools -p "test_*.py" -v
```

On Windows PowerShell:

```powershell
$env:PYTHONPATH = "tools"
python -m unittest discover -s tools -p "test_*.py" -v
```

Validate the generated-asset manifest without writing files:

```bash
python tools/process_assets.py --check
```

## Asset pipeline

Generated source sheets live in `assets/source/imagegen/`. To rebuild runtime art and PWA icons:

```bash
python tools/process_assets.py
```

The app reads optimized runtime assets from `assets/generated/`.

## Publish with GitHub Pages

Publish the repository from the `main` branch root. GitHub Pages serves `index.html` at:

```text
https://martybobo.github.io/phone-games/
```

After deploying a service-worker change, reopen the page once online so the browser can install the new cache. Installed copies receive the update on their next launch.

## Install on iPhone or iPad

1. Open the deployed site in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Tap **Add**.

## Install on Android

1. Open the deployed site in Chrome or another PWA-capable browser.
2. Use the in-app install button or the browser menu.
3. Choose **Install app** or **Add to Home screen**.

## Project structure

```text
phone-games/
├── index.html
├── styles.css
├── app.js
├── campaign.json
├── manifest.webmanifest
├── sw.js
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
├── assets/
│   ├── generated/
│   └── source/imagegen/
└── tools/
    ├── process_assets.py
    └── test_*.py
```

## Storage limitation

This is intentionally a static application. Progress does not sync between browsers or devices, and clearing site data removes local progress. Accounts, shared leaderboards, and cloud saves require a separate backend.
