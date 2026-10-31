// Punto de entrada de la SPA: registra las pantallas, arranca el router,
// activa el service worker (lo que la vuelve PWA) y el botón "Instalar app".

import { registrarRuta, iniciarRouter } from "./router.js";
import { vistaCatalogo } from "./views/catalogo.js";
import { vistaRegistro } from "./views/registro.js";
import { vistaCuenta } from "./views/cuenta.js";
import { vistaLogin } from "./views/login.js";
import { vistaInicio } from "./views/inicio.js";
import { vistaReporte } from "./views/reporte.js";
import { haySesion, esAdmin } from "./usuario.js";
import { vistaCompras } from "./views/compras.js";
import { vistaCarrito } from "./views/carrito.js";
import { cantidadTotal, suscribir } from "./carrito.js";
import { puedeInstalar, yaInstalada, instalar, suscribirInstalacion } from "./instalar.js";
import { vistaProducto } from "./views/producto.js";
import { vistaNuevoProducto, vistaEditarProducto } from "./views/formulario-producto.js";
import { vistaInventario } from "./views/inventario.js";

// Cada ruta = una "pantalla". Los siguientes módulos (historial de compras, reporte)
// se agregan aquí con una línea más.
// publica = se puede ver sin sesión; soloVisitantes = con sesión iniciada redirige al inicio;
// soloAdmin = solo la ve un administrador (el servidor igual revisa el rol en cada petición).
registrarRuta("login", { titulo: "Iniciar sesión", vista: vistaLogin, publica: true, soloVisitantes: true });
registrarRuta("inicio", { titulo: "Inicio", vista: vistaInicio });
registrarRuta("catalogo", { titulo: "Catálogo", vista: vistaCatalogo });
registrarRuta("producto", { titulo: "Producto", vista: vistaProducto });
registrarRuta("nuevo-producto", { titulo: "Nuevo producto", vista: vistaNuevoProducto, soloAdmin: true });
registrarRuta("editar-producto", { titulo: "Editar producto", vista: vistaEditarProducto, soloAdmin: true });
registrarRuta("inventario", { titulo: "Inventario", vista: vistaInventario, soloAdmin: true });
registrarRuta("carrito", { titulo: "Carrito", vista: vistaCarrito });
registrarRuta("reporte", { titulo: "Reporte de ventas", vista: vistaReporte, soloAdmin: true });
registrarRuta("compras", { titulo: "Mis compras", vista: vistaCompras });
registrarRuta("cuenta", { titulo: "Mi cuenta", vista: vistaCuenta });
registrarRuta("registro", { titulo: "Crear cuenta", vista: vistaRegistro, publica: true, soloVisitantes: true });

iniciarRouter(document.getElementById("app"), {
  porDefecto: "inicio",
  rutaLogin: "login",
  haySesion,
  esAdmin,
});

// ---------- Insignia del carrito en el menú ----------
// Muestra cuántas unidades hay en el carrito y se actualiza sola cuando cambia.
const insignia = document.getElementById("insignia-carrito");

function pintarInsignia() {
  const cantidad = cantidadTotal();
  insignia.textContent = cantidad > 99 ? "99+" : String(cantidad);
  insignia.hidden = cantidad === 0;
}
suscribir(pintarInsignia);
pintarInsignia();

// ---------- PWA: service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js", { updateViaCache: "none" })
      .catch((error) => console.warn("No se pudo registrar el service worker:", error));
  });
}

// ---------- PWA: botón "Instalar app" (barra superior) ----------
// Aparece solo cuando el navegador permite instalar y la app aún no está instalada.
const botonInstalar = document.getElementById("btn-instalar");

function pintarBotonInstalar() {
  botonInstalar.hidden = !puedeInstalar() || yaInstalada();
}
suscribirInstalacion(pintarBotonInstalar);
botonInstalar.addEventListener("click", () => instalar());
pintarBotonInstalar();
