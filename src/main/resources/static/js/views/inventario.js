// Pantalla "Inventario": administrar los productos (buscar, filtrar, editar, activar/desactivar, eliminar).
// Usa: GET /api/productos, GET /api/categorias, PUT /api/productos/{id}, DELETE /api/productos/{id}

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import { formatearPrecio, normalizar } from "../util.js";
import { describirStock } from "../componentes.js";

const FILTROS = [
  { id: "todos", texto: "Todos" },
  { id: "activos", texto: "Activos" },
  { id: "inactivos", texto: "Inactivos" },
  { id: "bajo", texto: "Stock bajo" },
];

const esActivo = (p) => (p.estado ?? "ACTIVO") === "ACTIVO";
const esBajo = (p) => (p.stock ?? 0) <= (p.stockMinimo ?? 0);

export function vistaInventario() {
  const estado = {
    productos: [],
    categorias: [],
    filtro: "todos",
    busqueda: "",
    confirmando: null, // id del producto que se está por eliminar
    ocupado: null, // id del producto con una operación en curso
    mensaje: null, // { tipo: "exito" | "error", texto }
  };

  const buscador = el("input", {
    type: "search",
    class: "buscador",
    placeholder: "Buscar por nombre o marca…",
    "aria-label": "Buscar en el inventario",
    oninput: (e) => {
      estado.busqueda = e.target.value;
      pintarLista();
    },
  });
  const chips = el("div", { class: "chips", role: "group", "aria-label": "Filtros" });
  const resumen = el("p", { class: "resumen-inventario" });
  const zonaMensaje = el("div", { role: "status" });
  const zonaEstado = el("div");
  const lista = el("div", { class: "lista-inventario" });

  const raiz = el(
    "section",
    { class: "vista" },
    el("a", { class: "btn btn-enlace", href: "#/nuevo-producto" }, "+ Nuevo producto"),
    buscador,
    chips,
    resumen,
    zonaMensaje,
    zonaEstado,
    lista
  );
  cargar();
  return raiz;

  // ---------------------------------------------------------------

  async function cargar() {
    zonaEstado.replaceChildren(el("p", { class: "cargando" }, "Cargando inventario…"));
    try {
      const [categorias, productos] = await Promise.all([api.listarCategorias(), api.listarProductos()]);
      estado.categorias = categorias;
      estado.productos = productos;
      zonaEstado.replaceChildren();
      pintarChips();
      pintarLista();
    } catch (error) {
      zonaEstado.replaceChildren(
        el(
          "div",
          { class: "aviso error", role: "alert" },
          el("p", {}, error.message),
          el("button", { type: "button", class: "btn", onclick: cargar }, "Reintentar")
        )
      );
    }
  }

  function contar(filtro) {
    return estado.productos.filter((p) => cumple(p, filtro)).length;
  }

  function cumple(p, filtro) {
    if (filtro === "activos") return esActivo(p);
    if (filtro === "inactivos") return !esActivo(p);
    if (filtro === "bajo") return esBajo(p);
    return true;
  }

  function pintarChips() {
    chips.replaceChildren(
      ...FILTROS.map((f) =>
        el(
          "button",
          {
            type: "button",
            class: "chip",
            "aria-pressed": String(estado.filtro === f.id),
            onclick: () => {
              estado.filtro = f.id;
              pintarChips();
              pintarLista();
            },
          },
          `${f.texto} (${contar(f.id)})`
        )
      )
    );
  }

  function pintarMensaje() {
    if (estado.mensaje) {
      zonaMensaje.replaceChildren(el("p", { class: `aviso ${estado.mensaje.tipo}` }, estado.mensaje.texto));
    } else {
      zonaMensaje.replaceChildren();
    }
  }

  function pintarLista() {
    pintarMensaje();
    const texto = normalizar(estado.busqueda);
    const nombres = new Map(estado.categorias.map((c) => [c.id, c.nombre]));
    const visibles = estado.productos.filter(
      (p) => cumple(p, estado.filtro) && (texto === "" || normalizar(`${p.nombre} ${p.marca ?? ""}`).includes(texto))
    );

    resumen.textContent =
      estado.productos.length === 0
        ? ""
        : `${visibles.length} de ${estado.productos.length} productos · ${contar("bajo")} con stock bajo`;

    if (visibles.length === 0) {
      lista.replaceChildren(
        el("p", { class: "vacio" }, estado.productos.length === 0 ? "Aún no hay productos. ¡Crea el primero!" : "No hay productos con ese filtro.")
      );
      return;
    }
    lista.replaceChildren(...visibles.map((p) => fila(p, nombres)));
  }

  function fila(producto, nombres) {
    const activo = esActivo(producto);
    const stock = describirStock(producto);
    const ocupado = estado.ocupado === producto.id;

    const acciones = [];
    if (estado.confirmando === producto.id) {
      acciones.push(
        el("p", { class: "confirmar-texto" }, "¿Eliminar para siempre? Esta acción no se puede deshacer."),
        boton("Sí, eliminar", "btn btn-peligro", () => eliminar(producto), ocupado),
        boton("Cancelar", "btn btn-claro", () => {
          estado.confirmando = null;
          pintarLista();
        }, ocupado)
      );
    } else {
      acciones.push(
        el("a", { class: "btn btn-claro btn-enlace", href: `#/editar-producto/${encodeURIComponent(producto.id)}` }, "Editar"),
        boton(activo ? "Desactivar" : "Activar", "btn btn-claro", () => alternarEstado(producto), ocupado),
        boton("Eliminar", "btn-texto peligro", () => {
          estado.confirmando = producto.id;
          pintarLista();
        }, ocupado)
      );
    }

    return el(
      "article",
      { class: `fila-inventario${activo ? "" : " inactivo"}` },
      el(
        "div",
        { class: "fila-inventario-info" },
        el("h3", {}, el("a", { class: "card-enlace", href: `#/producto/${encodeURIComponent(producto.id)}` }, producto.nombre)),
        el(
          "p",
          { class: "marca" },
          [nombres.get(producto.categoriaId) ?? "Sin categoría", producto.marca].filter(Boolean).join(" · ")
        ),
        el(
          "p",
          { class: "fila-inventario-datos" },
          el("strong", {}, formatearPrecio(producto.precio)),
          el("span", { class: `stock ${stock.clase}` }, stock.texto),
          !activo && el("span", { class: "insignia-estado inactivo" }, "Inactivo")
        )
      ),
      el("div", { class: "fila-inventario-acciones" }, ...acciones)
    );
  }

  function boton(texto, clase, alHacerClic, deshabilitado) {
    const b = el("button", { type: "button", class: clase, onclick: alHacerClic }, texto);
    b.disabled = Boolean(deshabilitado);
    return b;
  }

  function textoError(error) {
    return error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
  }

  async function alternarEstado(producto) {
    if (estado.ocupado) return;
    const nuevo = esActivo(producto) ? "INACTIVO" : "ACTIVO";
    estado.ocupado = producto.id;
    estado.mensaje = null;
    pintarLista();
    try {
      // El backend reemplaza todos los campos en el PUT: enviamos el producto completo.
      const { id, ...datos } = producto;
      const guardado = await api.actualizarProducto(id, { ...datos, estado: nuevo });
      estado.productos = estado.productos.map((p) => (p.id === id ? guardado : p));
      estado.mensaje = {
        tipo: "exito",
        texto: `«${guardado.nombre}» ahora está ${nuevo === "ACTIVO" ? "activo y visible" : "inactivo y oculto del catálogo"}.`,
      };
    } catch (error) {
      estado.mensaje = { tipo: "error", texto: textoError(error) };
    }
    estado.ocupado = null;
    pintarChips();
    pintarLista();
  }

  async function eliminar(producto) {
    if (estado.ocupado) return;
    estado.ocupado = producto.id;
    estado.mensaje = null;
    pintarLista();
    try {
      await api.eliminarProducto(producto.id);
      estado.productos = estado.productos.filter((p) => p.id !== producto.id);
      estado.mensaje = { tipo: "exito", texto: `«${producto.nombre}» se eliminó.` };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // Ya no existía (alguien más lo borró): lo quitamos de la lista igualmente.
        estado.productos = estado.productos.filter((p) => p.id !== producto.id);
        estado.mensaje = { tipo: "error", texto: "Ese producto ya no existía." };
      } else {
        estado.mensaje = { tipo: "error", texto: textoError(error) };
      }
    }
    estado.confirmando = null;
    estado.ocupado = null;
    pintarChips();
    pintarLista();
  }
}
