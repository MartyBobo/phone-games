const CACHE_NAME = "puzzle-garden-mobile-v3-campaign";
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
  "./assets/hero-garden.svg",
  "./assets/icons/number-grid.svg",
  "./assets/icons/tile-pairs.svg",
  "./assets/icons/falling-shapes.svg",
  "./assets/icons/crate-trail.svg",
  "./assets/worlds/seedling-meadow.svg",
  "./assets/worlds/lantern-grove.svg",
  "./assets/worlds/moonlit-pond.svg",
  "./assets/worlds/crystal-conservatory.svg",
  "./assets/worlds/cloud-orchard.svg",
  "./assets/worlds/starlight-terrace.svg",
  "./assets/textures/board-paper.svg"
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
