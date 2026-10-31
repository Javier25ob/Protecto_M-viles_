// Router de la SPA: decide qué pantalla mostrar según la parte de la URL
// después del "#" (ej. index.html#/catalogo  ->  pantalla "catalogo").
//
// Cada pantalla es una función que DEVUELVE un elemento HTML (ver js/views/).
// Si la pantalla necesita datos, los pide ella misma y se va actualizando.
//
// Además el router:
//  - Protege las pantallas: sin sesión solo se puede entrar a las pantallas "publica"
//    (login y registro); cualquier otra redirige al login.
//  - Con sesión, las pantallas "soloVisitantes" (login y registro) redirigen al catálogo.
//  - Las pantallas "soloAdmin" (inventario, formulario de productos, reporte) solo las ve un
//    administrador; un usuario normal vuelve al inicio.
//  - Muestra u oculta el menú inferior según haya sesión.
//  - Maneja el botón "Volver" de la barra superior.

const rutas = new Map();
const CLAVE_PILA = "deposito-dental:pila";

export function registrarRuta(nombre, { titulo, vista, publica = false, soloVisitantes = false, soloAdmin = false }) {
  rutas.set(nombre, { titulo, vista, publica, soloVisitantes, soloAdmin });
}

export function iniciarRouter(contenedor, { porDefecto, rutaLogin, haySesion, esAdmin = () => false }) {
  const encabezado = document.getElementById("titulo");
  const botonVolver = document.getElementById("btn-volver");
  const menu = document.querySelector(".bottom-nav");

  // "pila" = nombres de las pantallas visitadas en orden; "indice" = posición actual.
  // La posición se guarda también en history.state para saber si el usuario
  // avanzó, retrocedió (botón del navegador o del celular) o recargó la página.
  let pila = leerPila();
  let indice = Number.isInteger(history.state?.i) ? history.state.i : -1;

  function mostrar() {
    // "producto/abc123" = pantalla "producto" con el parámetro "abc123"
    const pedida = location.hash.replace(/^#\//, "");
    const [base, ...resto] = pedida.split("/");
    const nombre = rutas.has(base) ? base : porDefecto;
    const ruta = rutas.get(nombre);
    const parametro = rutas.has(base) ? decodificar(resto.join("/")) : "";
    const conSesion = Boolean(haySesion());

    // Guardia de sesión: reemplaza la entrada del historial (no la agrega),
    // así el botón "atrás" no vuelve a una pantalla que ya no se puede ver.
    if (!conSesion && !ruta.publica) return irA(rutaLogin);
    if (conSesion && ruta.soloVisitantes) return irA(porDefecto);
    if (ruta.soloAdmin && !esAdmin()) return irA(porDefecto);

    contenedor.replaceChildren(ruta.vista(parametro));
    encabezado.textContent = ruta.titulo;
    document.title = `${ruta.titulo} · Depósito Dental`;
    window.scrollTo(0, 0);

    // Menú inferior: solo con sesión iniciada.
    menu.hidden = !conSesion;
    document.body.classList.toggle("sin-menu", !conSesion);

    // Resalta en el menú la pantalla actual (una pestaña puede cubrir varias pantallas).
    document.querySelectorAll(".bottom-nav a").forEach((enlace) => {
      if (enlace.dataset.ruta.split(" ").includes(nombre)) {
        enlace.setAttribute("aria-current", "page");
      } else {
        enlace.removeAttribute("aria-current");
      }
    });

    registrarPosicion(nombre);
    const anterior = rutas.get(pila[indice - 1]);
    // Solo se vuelve a una pantalla que se pueda ver: con sesión, a las privadas; sin sesión, a las públicas.
    botonVolver.hidden = !(indice > 0 && anterior && anterior.publica === !conSesion);
  }

  function decodificar(texto) {
    try {
      return decodeURIComponent(texto);
    } catch {
      return texto; // un % suelto en la URL no debe romper la pantalla
    }
  }

  function irA(destino) {
    location.replace(`#/${destino}`);
  }

  function registrarPosicion(nombre) {
    const guardada = history.state?.i;
    if (Number.isInteger(guardada)) {
      indice = guardada; // retroceso, avance o recarga
    } else {
      indice += 1; // navegación nueva (enlace o cambio de #)
      history.replaceState({ i: indice }, "");
      pila.length = indice; // se descarta lo que había "adelante"
    }
    pila[indice] = nombre;
    guardarPila();
  }

  function leerPila() {
    try {
      const datos = JSON.parse(sessionStorage.getItem(CLAVE_PILA) ?? "[]");
      return Array.isArray(datos) ? datos.filter((n) => typeof n === "string") : [];
    } catch {
      return [];
    }
  }

  function guardarPila() {
    try {
      sessionStorage.setItem(CLAVE_PILA, JSON.stringify(pila));
    } catch {
      // sin almacenamiento: el botón Volver igual funciona mientras la página siga abierta
    }
  }

  botonVolver.addEventListener("click", () => history.back());
  window.addEventListener("hashchange", mostrar);
  mostrar();
}
