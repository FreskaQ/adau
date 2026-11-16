// Офлайн-кэш: пульт работает без интернета, связь с платой идёт по BLE.
const CACHE = "adau-ble-v9";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML — всегда с проверкой у сервера (иначе браузер отдаёт свою копию
// до 10 минут и новые версии не видны). Остальное — сначала сеть, потом кэш.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const html = e.request.mode === "navigate" ||
               (e.request.destination === "document");

  e.respondWith(
    fetch(e.request, html ? { cache: "no-cache" } : undefined)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
