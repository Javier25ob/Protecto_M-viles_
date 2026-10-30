// Router de la SPA: decide qué pantalla mostrar según la parte de la URL
// después del "#" (ej. index.html#/catalogo  ->  pantalla "catalogo").
//
// Cada pantalla es una función que DEVUELVE un elemento HTML (ver js/views/).
// Si la pantalla necesita datos, los pide ella misma y se va actualizando.

const rutas = new Map();

export function registrarRuta(nombre, { titulo, vista }) {
  rutas.set(nombre, { titulo, vista });
}

export function iniciarRouter(contenedor, { porDefecto }) {
  const encabezado = document.getElementById("titulo");

  function mostrar() {
    const nombre = location.hash.replace(/^#\//, "");
    const ruta = rutas.get(nombre) ?? rutas.get(porDefecto);
    const nombreActivo = rutas.has(nombre) ? nombre : porDefecto;

    contenedor.replaceChildren(ruta.vista());
    encabezado.textContent = ruta.titulo;
    document.title = `${ruta.titulo} · Depósito Dental`;
    window.scrollTo(0, 0);

    // Resalta en el menú inferior la pantalla actual.
    document.querySelectorAll(".bottom-nav a").forEach((enlace) => {
      if (enlace.dataset.ruta.split(" ").includes(nombreActivo)) {
        enlace.setAttribute("aria-current", "page");
      } else {
        enlace.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("hashchange", mostrar);
  mostrar();
}
