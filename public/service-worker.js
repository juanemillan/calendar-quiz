// public/service-worker.js
const CACHE = "calendar-quiz-v1";
const ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

// Instalar y cachear shell
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activar y tomar control
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache-first básico
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});
