// Service worker di GLS Help: uso senza internet e aggiornamenti.
// La versione viene scritta a ogni pubblicazione: così il telefono capisce che c'è una versione nuova.
const VERSIONE = '__VERSIONE__';
const CACHE = 'gls-help-' + VERSIONE;

const FILE = [
  './',
  'index.html',
  'css/app.css',
  'js/config.js',
  'js/db.js',
  'js/app.js',
  'manifest.webmanifest',
  'favicon.svg',
  'favicon.ico',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(FILE.map((f) => cache.add(new Request(f, { cache: 'reload' }))))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n.startsWith('gls-help-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// L'utente ha toccato "Aggiorna"
self.addEventListener('message', (event) => {
  if (event.data && event.data.tipo === 'ATTIVA') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Le richieste al server (Worker) e ad altri siti non passano dalla cache
  if (url.origin !== self.location.origin) return;

  // Pagine: sempre la versione salvata (aggiornata solo con "Aggiorna")
  if (req.mode === 'navigate') {
    event.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req))
  );
});
