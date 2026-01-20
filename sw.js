const CACHE = 'kleuterwinkel-v18';
const ASSETS = [
  './',
  './index.html',
  './print.html',
  './styles.css',
  './print.css',
  './app.js',
  './print.js',
  './vendor/jsQR.js',
  './manifest.webmanifest',
  './assets/appel.png',
  './assets/appelsap.png',
  './assets/banaan.png',
  './assets/betaalanimatie.gif',
  './assets/betaald.gif',
  './assets/betaald.mp3',
  './assets/biepgeluid.mp3',
  './assets/bonbon.png',
  './assets/boodschappenmand_leeg.png',
  './assets/boter.png',
  './assets/brood.png',
  './assets/cappuccino.png',
  './assets/choco_pops.png',
  './assets/chocola.png',
  './assets/chocolade.png',
  './assets/chocomel.png',
  './assets/cijfercode.png',
  './assets/croissant.png',
  './assets/drinkyoghurt.png',
  './assets/druiven.png',
  './assets/ei.png',
  './assets/eierdoos.png',
  './assets/hagelslag.png',
  './assets/hamburger.png',
  './assets/icon-512.png',
  './assets/ijs.png',
  './assets/inmandje_horizontaal.gif',
  './assets/inmandje_vertikaal.gif',
  './assets/kassa.png',
  './assets/koekjes.png',
  './assets/koffiemelk.png',
  './assets/kruiden.png',
  './assets/kruisje.png',
  './assets/mais.png',
  './assets/mandarijn.png',
  './assets/melk.png',
  './assets/peer.png',
  './assets/philadelphia.png',
  './assets/potje.png',
  './assets/sap.png',
  './assets/scanner.png',
  './assets/sinaasappel.png',
  './assets/snoep.png',
  './assets/soep.png',
  './assets/thee.png',
  './assets/voorbeeld_horizontaal.jpg',
  './assets/winkelmandje2.png',
  './assets/worst.png',
  './assets/wortel.png'
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