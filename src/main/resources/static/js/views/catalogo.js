// Pantalla "Catálogo": lista los productos de la API con búsqueda y filtro por categoría.
// Usa: GET /api/categorias y GET /api/productos

import { api } from "../api.js";
import { el } from "../dom.js";
import { agregar, cantidadEnCarrito } from "../carrito.js";
import { esAdmin } from "../usuario.js";
import { formatearPrecio, normalizar } from "../util.js";
import { describirStock, recuadroImagen } from "../componentes.js";

export function vistaCatalogo() {
  // Lo que la pantalla "recuerda" mientras está abierta.
  const estado = {
    productos: [],
    categorias: [],
    categoriaId: null, // null = todas
    busqueda: "",
    orden: "relevancia",
    soloDisponibles: false,
  };

  const buscador = el("input", {
    type: "search",
    class: "buscador",
    placeholder: "Buscar producto o marca…",
    "aria-label": "Buscar productos",
    oninput: (evento) => {
      estado.busqueda = evento.target.value;
      pintarLista();
    },
  });
  const filtros = el("div", { class: "chips", role: "group", "aria-label": "Categorías" });
  const orden = el(
    "select",
    {
      class: "selector-orden",
      "aria-label": "Ordenar productos",
      onchange: (e) => {
        estado.orden = e.target.value;
        pintarLista();
      },
    },
    el("option", { value: "relevancia" }, "Ordenar: Relevancia"),
    el("option", { value: "precio-asc" }, "Menor precio"),
    el("option", { value: "precio-desc" }, "Mayor precio"),
    el("option", { value: "nombre" }, "Nombre A–Z")
  );
  const soloDisponibles = el("input", {
    type: "checkbox",
    id: "solo-disponibles",
    onchange: (e) => {
      estado.soloDisponibles = e.target.checked;
      pintarLista();
    },
  });
  const contador = el("p", { class: "contador", "aria-live": "polite" });
  const zonaEstado = el("div");
  const lista = el("div", { class: "grid" });

  const raiz = el(
    "section",
    { class: "vista" },
    el(
      "div",
      { class: "barra-catalogo" },
      buscador,
      // Crear productos es solo del administrador
      esAdmin() && el("a", { class: "btn btn-enlace btn-nuevo", href: "#/nuevo-producto" }, "+ Nuevo")
    ),
    filtros,
    el(
      "div",
      { class: "controles-catalogo" },
      orden,
      el("label", { class: "check", for: "solo-disponibles" }, soloDisponibles, "Solo disponibles")
    ),
    contador,
    zonaEstado,
    lista
  );
  cargar();
  return raiz;

  // ---------------------------------------------------------------

  async function cargar() {
    zonaEstado.replaceChildren(el("p", { class: "cargando" }, "Cargando catálogo…"));
    filtros.replaceChildren();
    lista.replaceChildren();

    try {
      const [categorias, productos] = await Promise.all([
        api.listarCategorias(),
        api.listarProductos(),
      ]);
      estado.categorias = categorias;
      // El backend devuelve también los productos desactivados; al cliente solo los ACTIVOS.
      estado.productos = productos.filter((p) => (p.estado ?? "ACTIVO") === "ACTIVO");

      zonaEstado.replaceChildren();
      pintarFiltros();
      pintarLista();
    } catch (error) {
      zonaEstado.replaceChildren(
        el(
          "div",
          { class: "aviso error" },
          el("p", {}, error.message),
          el("button", { type: "button", class: "btn", onclick: cargar }, "Reintentar")
        )
      );
    }
  }

  function pintarFiltros() {
    const opciones = [{ id: null, nombre: "Todas" }, ...estado.categorias];
    filtros.replaceChildren(
      ...opciones.map((categoria) =>
        el(
          "button",
          {
            type: "button",
            class: "chip",
            "aria-pressed": String(estado.categoriaId === categoria.id),
            onclick: () => {
              estado.categoriaId = categoria.id;
              pintarFiltros();
              pintarLista();
            },
          },
          categoria.nombre
        )
      )
    );
  }

  function pintarLista() {
    const texto = normalizar(estado.busqueda);
    const nombresCategoria = new Map(estado.categorias.map((c) => [c.id, c.nombre]));

    const visibles = estado.productos.filter((p) => {
      const coincideCategoria = estado.categoriaId === null || p.categoriaId === estado.categoriaId;
      const coincideTexto =
        texto === "" || normalizar(`${p.nombre} ${p.marca ?? ""} ${p.descripcion ?? ""}`).includes(texto);
      const coincideStock = !estado.soloDisponibles || (p.stock ?? 0) > 0;
      return coincideCategoria && coincideTexto && coincideStock;
    });

    if (estado.orden === "precio-asc") visibles.sort((a, b) => a.precio - b.precio);
    else if (estado.orden === "precio-desc") visibles.sort((a, b) => b.precio - a.precio);
    else if (estado.orden === "nombre") visibles.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    contador.textContent =
      estado.productos.length === 0
        ? ""
        : `${visibles.length} ${visibles.length === 1 ? "producto" : "productos"}`;

    if (visibles.length === 0) {
      const mensaje =
        estado.productos.length === 0
          ? "Aún no hay productos disponibles."
          : "No encontramos productos con ese filtro.";
      lista.replaceChildren(el("p", { class: "vacio" }, mensaje));
      return;
    }
    lista.replaceChildren(...visibles.map((p) => tarjetaProducto(p, nombresCategoria)));
  }
}

function tarjetaProducto(producto, nombresCategoria) {
  const stock = describirStock(producto);
  const enlaceDetalle = `#/producto/${encodeURIComponent(producto.id)}`;

  return el(
    "article",
    { class: "card" },
    el("a", { class: "card-enlace", href: enlaceDetalle, "aria-label": `Ver ${producto.nombre}` }, recuadroImagen(producto)),
    el(
      "div",
      { class: "card-body" },
      el("span", { class: "etiqueta" }, nombresCategoria.get(producto.categoriaId) ?? "Sin categoría"),
      el("h3", {}, el("a", { class: "card-enlace", href: enlaceDetalle }, producto.nombre)),
      producto.marca && el("p", { class: "marca" }, producto.marca),
      el("p", { class: "precio" }, formatearPrecio(producto.precio)),
      el("p", { class: `stock ${stock.clase}` }, stock.texto),
      botonAgregar(producto)
    )
  );
}

// Botón "Agregar al carrito". Se vuelve a pintar solo, según lo que ya hay en el carrito
// (no deja agregar más unidades de las que hay en stock).
function botonAgregar(producto) {
  const boton = el("button", { type: "button", class: "btn btn-agregar" });
  boton.addEventListener("click", () => {
    agregar(producto);
    actualizar();
  });
  actualizar();
  return boton;

  function actualizar() {
    const stock = producto.stock ?? 0;
    const enCarrito = cantidadEnCarrito(producto.id);

    if (stock <= 0) {
      boton.disabled = true;
      boton.textContent = "Agotado";
    } else if (enCarrito >= stock) {
      boton.disabled = true;
      boton.textContent = `En el carrito: ${enCarrito} (máximo)`;
    } else {
      boton.disabled = false;
      boton.textContent = enCarrito > 0 ? `Agregar otro (en carrito: ${enCarrito})` : "Agregar";
    }
  }
}
