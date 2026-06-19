const CACHE_NAME = "puzzle-garden-mobile-v4-generated-assets";
const APP_SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./styles.css",
  "./app.js",
  "./campaign.json",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./assets/generated/hero-garden.webp",
  "./assets/generated/game-icons/number-grid.png",
  "./assets/generated/game-icons/tile-pairs.png",
  "./assets/generated/game-icons/falling-shapes.png",
  "./assets/generated/game-icons/crate-trail.png",
  "./assets/generated/worlds/seedling-meadow.webp",
  "./assets/generated/worlds/lantern-grove.webp",
  "./assets/generated/worlds/moonlit-pond.webp",
  "./assets/generated/worlds/crystal-conservatory.webp",
  "./assets/generated/worlds/cloud-orchard.webp",
  "./assets/generated/worlds/starlight-terrace.webp",
  "./assets/generated/textures/board-paper.png",
  "./assets/generated/ui/sparkle-burst.png",
  "./assets/generated/ui/leafy-completion-badge.png",
  "./assets/generated/ui/star-bloom.png",
  "./assets/generated/ui/flower-confetti.png",
  "./assets/generated/tile-faces/w1-f0.png",
  "./assets/generated/tile-faces/w1-f1.png",
  "./assets/generated/tile-faces/w1-f2.png",
  "./assets/generated/tile-faces/w1-f3.png",
  "./assets/generated/tile-faces/w1-f4.png",
  "./assets/generated/tile-faces/w1-f5.png",
  "./assets/generated/tile-faces/w1-f6.png",
  "./assets/generated/tile-faces/w1-f7.png",
  "./assets/generated/tile-faces/w2-f0.png",
  "./assets/generated/tile-faces/w2-f1.png",
  "./assets/generated/tile-faces/w2-f2.png",
  "./assets/generated/tile-faces/w2-f3.png",
  "./assets/generated/tile-faces/w2-f4.png",
  "./assets/generated/tile-faces/w2-f5.png",
  "./assets/generated/tile-faces/w2-f6.png",
  "./assets/generated/tile-faces/w2-f7.png",
  "./assets/generated/tile-faces/w3-f0.png",
  "./assets/generated/tile-faces/w3-f1.png",
  "./assets/generated/tile-faces/w3-f2.png",
  "./assets/generated/tile-faces/w3-f3.png",
  "./assets/generated/tile-faces/w3-f4.png",
  "./assets/generated/tile-faces/w3-f5.png",
  "./assets/generated/tile-faces/w3-f6.png",
  "./assets/generated/tile-faces/w3-f7.png",
  "./assets/generated/tile-faces/w4-f0.png",
  "./assets/generated/tile-faces/w4-f1.png",
  "./assets/generated/tile-faces/w4-f2.png",
  "./assets/generated/tile-faces/w4-f3.png",
  "./assets/generated/tile-faces/w4-f4.png",
  "./assets/generated/tile-faces/w4-f5.png",
  "./assets/generated/tile-faces/w4-f6.png",
  "./assets/generated/tile-faces/w4-f7.png",
  "./assets/generated/tile-faces/w5-f0.png",
  "./assets/generated/tile-faces/w5-f1.png",
  "./assets/generated/tile-faces/w5-f2.png",
  "./assets/generated/tile-faces/w5-f3.png",
  "./assets/generated/tile-faces/w5-f4.png",
  "./assets/generated/tile-faces/w5-f5.png",
  "./assets/generated/tile-faces/w5-f6.png",
  "./assets/generated/tile-faces/w5-f7.png",
  "./assets/generated/tile-faces/w6-f0.png",
  "./assets/generated/tile-faces/w6-f1.png",
  "./assets/generated/tile-faces/w6-f2.png",
  "./assets/generated/tile-faces/w6-f3.png",
  "./assets/generated/tile-faces/w6-f4.png",
  "./assets/generated/tile-faces/w6-f5.png",
  "./assets/generated/tile-faces/w6-f6.png",
  "./assets/generated/tile-faces/w6-f7.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preloaded = await event.preloadResponse;
        const response = preloaded || await fetch(request);
        if (response?.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./index.html", response.clone());
        }
        return response;
      } catch {
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const networkPromise = fetch(request)
      .then(async (response) => {
        if (response?.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(networkPromise);
      return cached;
    }

    const network = await networkPromise;
    return network || Response.error();
  })());
});
