/*
 * Service worker de la PWA.
 *
 * Qué hace:
 *  - Guarda en caché los archivos de la app (HTML, CSS, JS, íconos) para que
 *    la interfaz abra incluso sin internet.
 *  - NO guarda las respuestas de la API (otro origen: localhost:8080). Los
 *    productos y las ventas siempre se piden al servidor.
 *
 * Estrategia: "primero la red, si falla la caché". Así, mientras desarrollas,
 * ves tus cambios al recargar sin quedarte pegado con archivos viejos.
 *
 * Si agregas archivos nuevos a la app, añádelos a ARCHIVOS_APP y sube la VERSION.
 */
const VERSION = "v2";
const CACHE = `deposito-dental-${VERSION}`;

const ARCHIVOS_APP = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "js/app.js",
  "js/api.js",
  "js/carrito.js",
  "js/config.js",
  "js/dom.js",
  "js/router.js",
  "js/usuario.js",
  "js/util.js",
  "js/views/carrito.js",
  "js/views/catalogo.js",
  "js/views/registro.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARCHIVOS_APP))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith("deposito-dental-") && n !== CACHE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;

  // La API (otro origen) y cualquier recurso externo van directo a la red.
  if (new URL(peticion.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      })
      .catch(async () => {
        const guardada = await caches.match(peticion);
        if (guardada) return guardada;
        if (peticion.mode === "navigate") return caches.match("index.html");
        return Response.error();
      })
  );
});
