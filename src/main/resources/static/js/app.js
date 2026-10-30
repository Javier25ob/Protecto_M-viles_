// Punto de entrada de la SPA: registra las pantallas, arranca el router,
// activa el service worker (lo que la vuelve PWA) y el botón "Instalar app".

import { registrarRuta, iniciarRouter } from "./router.js";
import { vistaCatalogo } from "./views/catalogo.js";
import { vistaRegistro } from "./views/registro.js";
import { vistaCuenta } from "./views/cuenta.js";
import { vistaCarrito } from "./views/carrito.js";
import { cantidadTotal, suscribir } from "./carrito.js";

// Cada ruta = una "pantalla". Los siguientes módulos (historial de compras, reporte)
// se agregan aquí con una línea más.
registrarRuta("catalogo", { titulo: "Catálogo", vista: vistaCatalogo });
registrarRuta("carrito", { titulo: "Carrito", vista: vistaCarrito });
registrarRuta("cuenta", { titulo: "Mi cuenta", vista: vistaCuenta });
registrarRuta("registro", { titulo: "Crear cuenta", vista: vistaRegistro });

iniciarRouter(document.getElementById("app"), { porDefecto: "catalogo" });

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
      .register("sw.js")
      .catch((error) => console.warn("No se pudo registrar el service worker:", error));
  });
}

// ---------- PWA: botón "Instalar app" ----------
// El navegador avisa (beforeinstallprompt) cuando la app se puede instalar;
// guardamos ese aviso y mostramos el botón.
const botonInstalar = document.getElementById("btn-instalar");
let eventoInstalacion = null;

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  eventoInstalacion = evento;
  botonInstalar.hidden = false;
});

botonInstalar.addEventListener("click", async () => {
  if (!eventoInstalacion) return;
  eventoInstalacion.prompt();
  await eventoInstalacion.userChoice;
  eventoInstalacion = null;
  botonInstalar.hidden = true;
});

window.addEventListener("appinstalled", () => {
  botonInstalar.hidden = true;
});
