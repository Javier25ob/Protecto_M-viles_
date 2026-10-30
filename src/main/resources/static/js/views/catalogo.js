// Pantalla "Catálogo": lista los productos de la API con búsqueda y filtro por categoría.
// Usa: GET /api/categorias y GET /api/productos

import { api } from "../api.js";
import { el } from "../dom.js";
import { agregar, cantidadEnCarrito } from "../carrito.js";
import { formatearPrecio, normalizar, urlImagenSegura } from "../util.js";

export function vistaCatalogo() {
  // Lo que la pantalla "recuerda" mientras está abierta.
  const estado = {
    productos: [],
    categorias: [],
    categoriaId: null, // null = todas
    busqueda: "",
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
  const zonaEstado = el("div");
  const lista = el("div", { class: "grid" });

  const raiz = el("section", { class: "vista" }, buscador, filtros, zonaEstado, lista);
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
      return coincideCategoria && coincideTexto;
    });

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
  const urlImagen = urlImagenSegura(producto.imagenUrl);

  const recuadroImagen = el("div", { class: "card-img" });
  if (urlImagen) {
    const imagen = el("img", { src: urlImagen, alt: producto.nombre, loading: "lazy" });
    // Si la imagen no carga (enlace roto), mostramos el recuadro vacío.
    imagen.addEventListener("error", () => recuadroImagen.replaceChildren("Sin imagen"));
    recuadroImagen.append(imagen);
  } else {
    recuadroImagen.append("Sin imagen");
  }

  return el(
    "article",
    { class: "card" },
    recuadroImagen,
    el(
      "div",
      { class: "card-body" },
      el("span", { class: "etiqueta" }, nombresCategoria.get(producto.categoriaId) ?? "Sin categoría"),
      el("h3", {}, producto.nombre),
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

function describirStock(producto) {
  const stock = producto.stock ?? 0;
  const minimo = producto.stockMinimo ?? 0;
  if (stock <= 0) return { texto: "Agotado", clase: "agotado" };
  if (stock <= minimo) return { texto: `Pocas unidades (${stock})`, clase: "pocas" };
  return { texto: `Disponible: ${stock}`, clase: "" };
}
