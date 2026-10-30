# Depósito Dental — PWA (cliente de la API)

App web instalable (PWA) de una sola página (SPA) que consume la API Spring Boot del proyecto.
Sin frameworks ni herramientas de compilación: HTML + CSS + JavaScript (módulos ES).

## Cómo correrla

1. **Arranca el backend** (carpeta `demo`) con el botón ▶️ de VS Code sobre `DemoApplication.java`
   (así lee tu archivo `.env` con `MONGODB_URI`). Debe quedar en `http://localhost:8080`.
2. **Sirve esta carpeta**: instala la extensión **Live Server** de VS Code, abre `index.html`
   y pulsa *Go Live* (queda en `http://127.0.0.1:5500`).
   Alternativa sin extensión: `npx serve .` dentro de esta carpeta.
3. Abre la dirección en Chrome o Edge. Aparece el botón **Instalar app** cuando el navegador la considera instalable.

> No abras `index.html` con doble clic (`file://`): los módulos JS y el service worker no funcionan así.

## Estructura

```
app-movil/
├── index.html              Única página; contiene <main id="app"> y el menú inferior
├── manifest.webmanifest    Nombre, colores e íconos de la app instalada
├── sw.js                   Service worker: guarda la interfaz en caché (funciona sin internet)
├── css/styles.css
├── icons/                  Íconos 192 y 512
└── js/
    ├── app.js              Arranque: registra pantallas, router, service worker, botón instalar
    ├── router.js           Cambia de pantalla según el # de la URL (#/catalogo, #/carrito, #/registro)
    ├── config.js           URL de la API y moneda  <-- aquí cambias el puerto o la IP
    ├── api.js              ÚNICO archivo que habla con el backend (fetch + manejo de errores)
    ├── dom.js              Ayudante para crear HTML de forma segura (texto, no HTML)
    ├── util.js             Formato de precio, búsqueda sin tildes, validación de URL de imagen
    ├── usuario.js          Recuerda el usuario registrado (localStorage) para las ventas
    ├── carrito.js          Carrito en localStorage: agregar, cambiar cantidad, quitar, total, verificar con el servidor
    └── views/
        ├── catalogo.js     GET /api/categorias + GET /api/productos (búsqueda, filtro, botón Agregar)
        ├── carrito.js      Cantidades, total y «Confirmar compra»: POST /api/ventas + resumen
        └── registro.js     POST /api/usuarios
```

## Cómo agregar una pantalla nueva (ej. historial de compras)

1. Crear `js/views/compras.js` que exporte una función que devuelva un elemento HTML.
2. En `js/app.js`: `registrarRuta("compras", { titulo: "Mis compras", vista: vistaCompras });`
3. Agregar el enlace en el menú de `index.html` y el archivo nuevo a `ARCHIVOS_APP` en `sw.js`.
4. Si necesita la API, agregar la función en `js/api.js`.

## Probar desde un celular

Cambia `API_BASE` en `js/config.js` por la IP de tu PC (`ipconfig`), por ejemplo `http://192.168.1.20:8080`,
y abre la app con la IP de tu PC en el celular (misma red WiFi). Ojo: fuera de `localhost` el navegador
exige HTTPS para activar el service worker y la instalación; para la demo en el celular la app abre y funciona,
pero sin modo instalable/offline hasta que se publique con HTTPS.

## Cómo funciona la compra

- El backend no tiene carrito: el carrito vive en el navegador (`localStorage`) y solo se envía al confirmar.
- `POST /api/ventas` lleva únicamente `{ usuarioId, items: [{ productoId, cantidad }] }`. **El precio nunca lo manda la app**:
  el servidor lo toma del producto, calcula el total y descuenta el stock.
- Todavía no hay inicio de sesión: la compra se hace a nombre del último usuario que se registró en este navegador.
  Si no hay ninguno, el carrito pide crear una cuenta primero.
- Al abrir el carrito se compara con el servidor: si cambió un precio o se agotó algo, se ajusta y se avisa.
- Limitación conocida del backend: no usa transacciones. Si una venta con varios productos falla a la mitad
  (ej. el segundo no tiene stock), el stock de los productos anteriores ya quedó descontado.
