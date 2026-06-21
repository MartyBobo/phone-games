const CACHE_PREFIX = "puzzle-garden-";
const CACHE_NAME = `${CACHE_PREFIX}mobile-v7`;
const GENERATED_ASSET_VERSION = "mobile-v2";
const OFFLINE_PAGE = "./index.html";

function versionGeneratedAssetPath(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${encodeURIComponent(GENERATED_ASSET_VERSION)}`;
}

const TILE_FACE_PATHS = Array.from({ length: 6 }, (_, worldIndex) =>
  Array.from({ length: 8 }, (_, faceIndex) => `./assets/generated/tile-faces/w${worldIndex + 1}-f${faceIndex}.png`)
).flat();

const GENERATED_ASSET_PATHS = [
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
  ...TILE_FACE_PATHS
];

const CORE_ASSETS = [
  "./",
  OFFLINE_PAGE,
  "./404.html",
  "./styles.css",
  "./styles.css?v=mobile-v2",
  "./app.js",
  "./app.js?v=mobile-v2",
  "./campaign.json",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

const OPTIONAL_ASSETS = GENERATED_ASSET_PATHS.map(versionGeneratedAssetPath);

async function cacheOptionalAssets(cache) {
  await Promise.allSettled(
    OPTIONAL_ASSETS.map(async (path) => {
      const response = await fetch(path, { cache: "reload" });
      if (response.ok) await cache.put(path, response);
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await cacheOptionalAssets(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function withTimeout(promise, milliseconds) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Network timeout")), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function networkFirst(request, preloadResponse) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = preloadResponse || await withTimeout(fetch(request), 3500);
    if (response?.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) ||
      (request.mode === "navigate" ? await cache.match(OFFLINE_PAGE) : undefined);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: false }) || await cache.match(request, { ignoreSearch: true });
  const update = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  return (await update) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const preload = await event.preloadResponse;
      return (await networkFirst(request, preload)) || Response.error();
    })());
    return;
  }

  if (url.pathname.endsWith("/campaign.json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (["script", "style", "image", "font", "manifest"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
