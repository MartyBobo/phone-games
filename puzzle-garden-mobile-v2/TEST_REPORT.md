# Mobile test report

## Automated interaction run

The touch-oriented smoke test rendered the app and exercised the core interaction path of every game at these viewport sizes:

| Test viewport | CSS pixels | Result |
|---|---:|---|
| Extra-small phone | 280×653 | Passed |
| iPhone SE-sized | 320×568 | Passed |
| Small Android | 360×640 | Passed |
| Modern iPhone | 390×844 | Passed |
| Large phone | 430×932 | Passed |
| Phone landscape | 844×390 | Passed |
| Tablet landscape | 1024×600 | Passed |

The test performed the following actions at each main phone viewport:

- Opened the home screen and checked for horizontal overflow.
- Opened Number Grid, selected a square, and entered a number.
- Opened Tile Pairs and selected a valid matching pair.
- Started Falling Shapes and used left, rotate, hard-drop, and pause touch controls.
- Opened Crate Trail, selected a reachable tower, and used an enabled direction.
- Audited visible non-board controls for a minimum 44×44 CSS-pixel touch target.
- Captured browser console and page errors.

No horizontal overflow, undersized standard controls, page exceptions, or console errors were detected in this run.

## Files

- `tests/mobile_smoke.py` — Playwright-based interaction and layout test.
- `test-screenshots/` — generated screen captures.
- `MOBILE_PREVIEW.png` — combined visual preview.

## Remaining physical-device checks

A browser emulator cannot completely reproduce mobile Safari and Android device behavior. Before public release, verify on at least one physical iPhone and one physical Android device:

- Add to Home Screen / installation flow.
- Safe-area spacing around a notch or Dynamic Island.
- Audio start after the first touch.
- Vibration behavior.
- Offline launch after the initial online visit.
- Very long play sessions and low-memory tab restoration.
