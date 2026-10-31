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
static/                     (en el proyecto: src/main/resources/static)
├── index.html              Única página; contiene <main id="app">, la barra superior (con botón Volver) y el menú inferior
├── manifest.webmanifest    Nombre, colores e íconos de la app instalada
├── sw.js                   Service worker: guarda la interfaz en caché (nunca la API)
├── css/styles.css
├── icons/                  Logo (logo.svg) e íconos 192, 512 y maskable
└── js/
    ├── app.js              Arranque: registra pantallas, router, service worker, botón instalar, insignia del carrito
    ├── router.js           Pantallas por # de la URL, protección por sesión, botón Volver y menú
    ├── config.js           URL de la API (mismo origen; localhost:8080 si usas Live Server) y moneda
    ├── api.js              ÚNICO archivo que habla con el backend (fetch + manejo de errores)
    ├── dom.js              Ayudantes para crear HTML e iconos SVG de forma segura (texto, no HTML)
    ├── util.js             Formato de precio y fecha, búsqueda sin tildes, validación de URL de imagen
    ├── usuario.js          Sesión: recuerda { id, name, email } del usuario (localStorage)
    ├── componentes.js      Piezas compartidas: recuadro de imagen y texto de stock
    ├── instalar.js         Botón y guía para instalar la PWA
    ├── carrito.js          Carrito en localStorage: agregar, cambiar cantidad, quitar, total, verificar con el servidor
    └── views/
        ├── login.js        POST /api/usuarios/login  (primera pantalla de la app)
        ├── registro.js     POST /api/usuarios
        ├── inicio.js       Saludo, resumen y accesos rápidos
        ├── catalogo.js     GET /api/categorias + GET /api/productos (búsqueda, filtro, orden, solo disponibles, Agregar)
        ├── producto.js     #/producto/<id>: detalle con foto, descripción, cantidad y «Agregar al carrito»
        ├── formulario-producto.js  #/nuevo-producto y #/editar-producto/<id>: POST/PUT /api/productos (+ POST /api/categorias)
        ├── inventario.js   #/inventario: buscar, filtrar, editar, activar/desactivar y eliminar productos
        ├── carrito.js      Cantidades, total y «Confirmar compra»: POST /api/ventas + resumen
        ├── compras.js      GET /api/ventas/usuario/{id}  (historial)
        ├── reporte.js      GET /api/ventas/reporte  (ventas, ingresos y más vendidos)
        └── cuenta.js       Datos del usuario y cerrar sesión
```

## Productos (estilo tienda en línea)

- **Catálogo** → toca una tarjeta para ver el **detalle**; botón **+ Nuevo** para crear un producto.
- **Formulario**: nombre, descripción, precio, categoría (o «+ Nueva categoría»), marca, enlace de imagen con vista previa,
  stock, stock mínimo y estado. Valida en el celular y muestra también los errores que devuelva el servidor.
- **Inventario**: lista todos los productos (activos e inactivos) con filtros y «Stock bajo». *Desactivar* lo oculta del
  catálogo sin perder el historial; *Eliminar* lo borra para siempre (pide confirmación).
- Las rutas aceptan parámetro: `#/producto/<id>` llama a la pantalla `producto` con ese id.
- Ojo: la API aún no tiene roles, así que cualquier usuario con sesión puede crear/editar productos.

## Instalar la app (PWA)

La app cumple lo que pide Chrome para instalarse: HTTPS, `manifest.webmanifest` (nombre, íconos 192/512 y maskable,
`display: standalone`), service worker con caché y un botón propio **Instalar app**.
- **Android (Chrome):** aparece el botón «Instalar app» arriba (o en *Cuenta*); si no, menú ⋮ → «Instalar aplicación».
- **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio» (Safari no manda el aviso de instalación).
- Necesita una dirección `https://` (el túnel de Cloudflare la da) o `localhost`.
- Si publicas cambios, sube `VERSION` en `sw.js` y agrega los archivos nuevos a `ARCHIVOS_APP`.

## Sesión y navegación

- La app **siempre abre en el login**. Sin sesión, el router solo deja ver `login` y `registro`; cualquier otra
  pantalla redirige al login. Con sesión, `login` y `registro` redirigen al inicio.
- El menú inferior solo aparece con sesión. La flecha **Volver** de la barra superior regresa a la pantalla anterior
  (igual que el botón «atrás» del celular).
- El login devuelve un **token** firmado y el **rol** (`ADMIN` o `USER`). La app envía el token en cada petición
  (`Authorization: Bearer ...`) y el servidor decide con él qué se puede hacer. Si el token vence (12 h) o el servidor
  se reinicia sin `TOKEN_SECRET`, la app vuelve al login con un aviso.

## Roles

| Acción | Cliente (`USER`) | Administrador (`ADMIN`) |
|---|---|---|
| Ver catálogo y detalle, comprar, ver **sus** compras | Sí | Sí |
| Crear, editar, activar/desactivar y eliminar productos y categorías | No | Sí |
| Inventario y reporte general de ventas | No | Sí |

- Registrarse siempre crea un `USER`. El primer administrador sale de `ADMIN_EMAIL` (y `ADMIN_PASSWORD` si ese correo
  aún no está registrado) en el archivo `.env`; al arrancar, el backend lo crea o le da el rol.
- Ocultar botones en la app es solo comodidad: la protección real está en el backend (`AutenticacionInterceptor`).

## Cómo agregar una pantalla nueva (ej. una pantalla de ayuda)

1. Crear `js/views/ayuda.js` que exporte una función que devuelva un elemento HTML.
2. En `js/app.js`: `registrarRuta("ayuda", { titulo: "Ayuda", vista: vistaAyuda });`
3. Agregar el enlace en el menú de `index.html` y el archivo nuevo a `ARCHIVOS_APP` en `sw.js`.
4. Si necesita la API, agregar la función en `js/api.js`.

## Usarla desde el celular (sin descargarla)

La PWA se instala solo si se abre por **HTTPS**. Por eso se publica el proyecto completo (backend + esta carpeta)
en un hosting, por ejemplo Railway o Render, que entrega una dirección `https://...`. Desde Chrome en el celular
se entra a esa dirección y se elige **Menú → Instalar aplicación**.
Variables del hosting: `MONGODB_URI` (la misma de tu `.env`). El puerto lo define el hosting con `PORT`.
En MongoDB Atlas hay que permitir el acceso desde el hosting (Network Access).
