// Service worker: guarda uma cópia dos arquivos do app para ele abrir sem internet.
// Estratégia "rede primeiro": com internet, sempre busca a versão mais nova
// (assim cada "git push" aparece na hora); sem internet, usa a cópia guardada.

var CACHE = "lista-compras-v1";
var ARQUIVOS = [
  "./",
  "index.html",
  "css/style.css",
  "js/app.js",
  "manifest.json",
  "icons/icon.svg",
  "icons/icon-192.png",
];

// Instalação: baixa e guarda os arquivos principais
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ARQUIVOS);
    }),
  );
  self.skipWaiting();
});

// Ativação: apaga caches de versões antigas (se um dia mudarmos o nome do CACHE)
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(
        nomes
          .filter(function (n) {
            return n !== CACHE;
          })
          .map(function (n) {
            return caches.delete(n);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Cada pedido: tenta a rede; se falhar (offline), responde com o cache
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(function (resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) {
          c.put(e.request, copia);
        });
        return resp;
      })
      .catch(function () {
        return caches.match(e.request, { ignoreSearch: true });
      }),
  );
});
