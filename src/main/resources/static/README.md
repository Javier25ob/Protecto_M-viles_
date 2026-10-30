# Depósito Dental — PWA (cliente de la API)

App web instalable (PWA) de una sola página (SPA) que consume la API Spring Boot del proyecto.
Sin frameworks ni herramientas de compilación: HTML + CSS + JavaScript (módulos ES).

## Cómo correrla

Esta carpeta vive dentro del backend (`src/main/resources/static/`): **Spring Boot sirve la app y la API en el mismo puerto**.

1. Abre la carpeta `demo` en VS Code y arranca el backend con ▶️ sobre `DemoApplication.java`
   (así lee tu archivo `.env` con `MONGODB_URI`).
2. Abre **http://localhost:8080** en Chrome o Edge. Aparece el botón **Instalar app** cuando el navegador la considera instalable.
3. La documentación de la API sigue en http://localhost:8080/swagger-ui.html

Si cambias un archivo de esta carpeta, **reinicia el backend** (Stop y ▶️) o recarga con `Ctrl+Shift+R`:
Spring copia los archivos al arrancar y el service worker guarda una copia en caché.

Alternativa para editar rápido: abre `index.html` con **Live Server** (puerto 5500). En ese caso la app llama
a la API en `http://localhost:8080` (con el backend corriendo). Está definido en `js/config.js`.

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
    ├── router.js           Cambia de pantalla según el # de la URL (#/catalogo, #/carrito, #/cuenta, #/registro)
    ├── config.js           URL de la API (mismo origen; localhost:8080 si usas Live Server) y moneda
    ├── api.js              ÚNICO archivo que habla con el backend (fetch + manejo de errores)
    ├── dom.js              Ayudante para crear HTML de forma segura (texto, no HTML)
    ├── util.js             Formato de precio, búsqueda sin tildes, validación de URL de imagen
    ├── usuario.js          Recuerda el usuario registrado (localStorage) para las ventas
    ├── carrito.js          Carrito en localStorage: agregar, cambiar cantidad, quitar, total, verificar con el servidor
    └── views/
        ├── catalogo.js     GET /api/categorias + GET /api/productos (búsqueda, filtro, botón Agregar)
        ├── carrito.js      Cantidades, total y «Confirmar compra»: POST /api/ventas + resumen
        ├── cuenta.js       Inicio de sesión (POST /api/usuarios/login), datos de la cuenta y cerrar sesión
        └── registro.js     POST /api/usuarios
```

## Cómo agregar una pantalla nueva (ej. historial de compras)

1. Crear `js/views/compras.js` que exporte una función que devuelva un elemento HTML.
2. En `js/app.js`: `registrarRuta("compras", { titulo: "Mis compras", vista: vistaCompras });`
3. Agregar el enlace en el menú de `index.html` y el archivo nuevo a `ARCHIVOS_APP` en `sw.js`.
4. Si necesita la API, agregar la función en `js/api.js`.

## Usarla desde el celular (sin descargarla)

La PWA se instala solo si se abre por **HTTPS**. Por eso se publica el proyecto completo (backend + esta carpeta)
en un hosting, por ejemplo Railway o Render, que entrega una dirección `https://...`. Desde Chrome en el celular
se entra a esa dirección y se elige **Menú → Instalar aplicación**.
Variables del hosting: `MONGODB_URI` (la misma de tu `.env`). El puerto lo define el hosting con `PORT`.
En MongoDB Atlas hay que permitir el acceso desde el hosting (Network Access).
