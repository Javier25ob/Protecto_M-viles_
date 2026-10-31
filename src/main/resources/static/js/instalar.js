// Instalación de la PWA ("Instalar app").
//
// Chrome/Edge en Android y PC avisan con el evento "beforeinstallprompt" cuando la app
// se puede instalar (requiere HTTPS, manifest, íconos y service worker: ya están).
// Guardamos ese aviso para poder mostrar nuestro propio botón.
// Safari en iPhone NO manda ese aviso: ahí se instala desde el menú Compartir.

let eventoInstalacion = null;
const oyentes = new Set();

function avisar() {
  oyentes.forEach((f) => f());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault(); // evitamos el mini-aviso automático y usamos nuestro botón
    eventoInstalacion = evento;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    eventoInstalacion = null;
    avisar();
  });
}

/** El navegador ofrece instalar ahora mismo (se puede mostrar el botón). */
export function puedeInstalar() {
  return eventoInstalacion !== null;
}

/** La app ya está abierta como app instalada (sin barra del navegador). */
export function yaInstalada() {
  try {
    return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true);
  } catch {
    return false;
  }
}

export function esIOS() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  return /iPhone|iPad|iPod/i.test(ua);
}

/** Muestra el cuadro de instalación del navegador. Devuelve true si el usuario aceptó. */
export async function instalar() {
  if (!eventoInstalacion) return false;
  const evento = eventoInstalacion;
  eventoInstalacion = null;
  avisar();
  evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === "accepted";
}

/** Para enterarse cuando cambia la posibilidad de instalar (ej. mostrar u ocultar el botón). */
export function suscribirInstalacion(aviso) {
  oyentes.add(aviso);
  return () => oyentes.delete(aviso);
}
