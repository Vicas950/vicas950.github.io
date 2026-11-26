// Оболочка приложения хранится на телефоне, чтобы открываться без сети.
// Данные (Supabase) и внешние библиотеки всегда берутся из сети.
const CACHE = "rufers-v1.0";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // чужие домены (Supabase, CDN) — только сеть
  if (url.origin !== self.location.origin) return;

  // страница: сначала сеть, если нет — сохранённая копия
  if (req.mode === "navigate" || url.pathname.endsWith("index.html")) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // картинки и манифест: сначала кэш
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
