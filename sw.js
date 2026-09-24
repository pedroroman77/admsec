/* AdmSec+ · funcionamiento sin conexión y actualizaciones automáticas.
   - La app (index.html) se pide primero a internet: si hay versión nueva, se usa y se guarda.
     Sin conexión, se abre la última guardada.
   - Iconos y manifiesto: se sirven desde la copia guardada.
   - Supabase y Google (datos, IA) nunca se guardan aquí. */
const CACHE = "admsec-v1";
const BASICOS = ["./", "./index.html", "./manifest.webmanifest", "./favicon.ico",
  "./iconos/icono-192.png", "./iconos/icono-512.png", "./iconos/icono-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // Supabase, Google…: directo a internet
  const esPagina = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (esPagina) {
    e.respondWith(fetch(e.request).then((r) => {
      const copia = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copia)); return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then((g) => g || fetch(e.request).then((r) => {
    const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r;
  })));
});
