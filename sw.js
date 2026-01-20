const CACHE = 'kleuterwinkel-v16';
const ASSETS = [
  './',
  './index.html',
  './print.html',
  './styles.css',
  './print.css',
  './app.js',
  './vendor/jsQR.js',
  './print.js',
  './manifest.webmanifest',
  './assets/icon-512.png',
  './assets/scanner.png',
  './assets/winkelmandje2.png',
  './assets/kassa.png',
  './assets/kruisje.png',
  './assets/inmandje_horizontaal.gif',
  './assets/inmandje_vertikaal.gif',
  './assets/boodschappenmand_leeg.png',
  './assets/brood.png',
  './assets/betaalanimatie.gif',
  './assets/betaald.gif',
  './assets/betaald.mp3',
  './assets/biepgeluid.mp3',
  './assets/banaan.png',
  './assets/sinaasappel.png',
  './assets/croissant.png',
  './assets/melk.png',
  './assets/boter.png',
  './assets/ei.png',
  './assets/eierdoos.png',
  './assets/worst.png',
  './assets/ijs.png',
  './assets/soep.png',
  './assets/snoep.png',
  './assets/chocolade.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});