# Puzzle Garden mobile UI v2 — deployment notes

## What changed

- Rebuilt the phone home screen around Quick Play, install guidance, campaign progress, and swipeable world cards.
- Made game screens more compact so boards and controls appear sooner on iPhone and Android.
- Added safe-area handling, dynamic viewport sizing, short-landscape layouts, and 44px minimum standard touch controls.
- Made Falling Shapes start or resume when the board is tapped and disabled movement controls until play begins.
- Corrected Number Grid copy for both 6×6 and 9×9 levels.
- Removed a duplicate Crate Trail level-label assignment.
- Prevented stale saved IDs from incorrectly contributing to world unlocks.
- Improved PWA metadata, install shortcuts, caching, offline fallback, and service-worker update behavior.

## Validation performed

- JavaScript syntax checks for `app.js` and `sw.js`.
- Manifest JSON validation.
- 16 unit tests.
- Generated-asset manifest validation for 67 outputs.
- Automated viewport audit at 320×568, 390×844, 412×915, and 844×390.
- No page-level horizontal overflow at the audited sizes.
- No standard visible control below 44×44 CSS pixels.
- Falling Shapes board-tap test changed the state from Ready to Playing and enabled all five movement controls.

## Deploy

Copy the files in this package over the repository root, preserving the folder structure, then commit and push to `main`.

```bash
git add .
git commit -m "Polish mobile UI and PWA behavior"
git push origin main
```

GitHub Pages should redeploy automatically. Because the service worker has a new cache version, open the site once online, close it, and reopen it when testing the installed app.

## Recommended device checks after deployment

- Safari on an iPhone with a notch or Dynamic Island.
- Chrome on Android in both browser and installed modes.
- Portrait and short landscape orientation.
- Add to Home Screen / Install App flow.
- Offline reopen after one successful online visit.
