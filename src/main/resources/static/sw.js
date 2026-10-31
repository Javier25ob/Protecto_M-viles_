/*
 * Service worker de la PWA.
 *
 * Qué hace:
 *  - Guarda en caché los archivos de la app (HTML, CSS, JS, íconos) para que
 *    la interfaz abra incluso sin internet.
 *  - NO guarda las respuestas de la API (/api/...). Los productos y las ventas
 *    siempre se piden al servidor.
 *
 * Estrategia: "primero la red, si falla la caché". Así, mientras desarrollas,
 * ves tus cambios al recargar sin quedarte pegado con archivos viejos.
 *
 * Si agregas archivos nuevos a la app, añádelos a ARCHIVOS_APP y sube la VERSION.
 */
const VERSION = "v10";
const CACHE = `deposito-dental-${VERSION}`;

const ARCHIVOS_APP = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "js/app.js",
  "js/api.js",
  "js/carrito.js",
  "js/componentes.js",
  "js/config.js",
  "js/dom.js",
  "js/instalar.js",
  "js/router.js",
  "js/usuario.js",
  "js/util.js",
  "js/views/carrito.js",
  "js/views/catalogo.js",
  "js/views/compras.js",
  "js/views/formulario-producto.js",
  "js/views/inventario.js",
  "js/views/producto.js",
  "js/views/inicio.js",
  "js/views/cuenta.js",
  "js/views/login.js",
  "js/views/registro.js",
  "js/views/reporte.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/logo.svg",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      // cache: "reload" = pedir siempre al servidor (no copiar archivos viejos de la caché del navegador)
      .then((cache) => cache.addAll(ARCHIVOS_APP.map((ruta) => new Request(ruta, { cache: "reload" }))))
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

  // Recursos de otro origen, la API y Swagger van SIEMPRE directo a la red (nunca a la caché):
  // ahora la app y la API comparten origen, así que hay que excluir las rutas del backend.
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;
  if (["/api/", "/swagger", "/v3/"].some((ruta) => url.pathname.startsWith(ruta))) return;

  evento.respondWith(
    // cache: "no-cache" = preguntar al servidor si el archivo cambió; así el celular no se queda con una versión vieja
    fetch(peticion, { cache: "no-cache" })
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
