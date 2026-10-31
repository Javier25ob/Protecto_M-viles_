// Pantalla "Detalle de producto": #/producto/<id>
// Usa: GET /api/productos/{id} y GET /api/categorias

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import { agregar, cantidadEnCarrito } from "../carrito.js";
import { esAdmin } from "../usuario.js";
import { formatearPrecio } from "../util.js";
import { describirStock, recuadroImagen } from "../componentes.js";

export function vistaProducto(id) {
  const raiz = el("section", { class: "vista" }, el("p", { class: "cargando" }, "Cargando producto…"));
  cargar();
  return raiz;

  // ---------------------------------------------------------------

  async function cargar() {
    raiz.replaceChildren(el("p", { class: "cargando" }, "Cargando producto…"));
    try {
      const [producto, categorias] = await Promise.all([api.obtenerProducto(id), api.listarCategorias()]);
      const categoria = categorias.find((c) => c.id === producto.categoriaId);
      raiz.replaceChildren(pintar(producto, categoria?.nombre ?? "Sin categoría"));
    } catch (error) {
      const noExiste = error instanceof ApiError && error.status === 404;
      raiz.replaceChildren(
        el(
          "div",
          { class: "aviso error", role: "alert" },
          el("p", {}, noExiste ? "Este producto ya no existe." : error.message),
          noExiste
            ? el("a", { class: "btn btn-enlace", href: "#/catalogo" }, "Volver al catálogo")
            : el("button", { type: "button", class: "btn", onclick: cargar }, "Reintentar")
        )
      );
    }
  }

  function pintar(producto, nombreCategoria) {
    const inactivo = (producto.estado ?? "ACTIVO") !== "ACTIVO";
    const stock = describirStock(producto);
    const disponible = Math.max(0, (producto.stock ?? 0) - cantidadEnCarrito(producto.id));
    let cantidad = 1;

    const valor = el("span", { class: "cantidad-valor", "aria-live": "polite" }, "1");
    const menos = el("button", { type: "button", class: "btn-cantidad", "aria-label": "Una unidad menos" }, "−");
    const mas = el("button", { type: "button", class: "btn-cantidad", "aria-label": "Una unidad más" }, "+");
    const comprar = el("button", { type: "button", class: "btn" }, "Agregar al carrito");
    const mensaje = el("div", { role: "status" });

    function refrescar() {
      const restante = Math.max(0, (producto.stock ?? 0) - cantidadEnCarrito(producto.id));
      if (restante > 0) cantidad = Math.min(Math.max(cantidad, 1), restante);
      valor.textContent = String(cantidad);
      menos.disabled = cantidad <= 1;
      mas.disabled = cantidad >= restante;
      comprar.disabled = inactivo || restante <= 0;
      if (inactivo) comprar.textContent = "No disponible";
      else if ((producto.stock ?? 0) <= 0) comprar.textContent = "Agotado";
      else if (restante <= 0) comprar.textContent = "Ya tienes todas las unidades en el carrito";
      else comprar.textContent = "Agregar al carrito";
    }

    menos.addEventListener("click", () => {
      cantidad -= 1;
      refrescar();
    });
    mas.addEventListener("click", () => {
      cantidad += 1;
      refrescar();
    });
    comprar.addEventListener("click", () => {
      const resultado = agregar(producto, cantidad);
      if (resultado.ok) {
        const n = resultado.agregadas;
        cantidad = 1;
        mensaje.replaceChildren(
          el(
            "div",
            { class: "aviso exito" },
            el("p", {}, `Agregaste ${n} ${n === 1 ? "unidad" : "unidades"} al carrito.`),
            el("p", {}, el("a", { href: "#/carrito" }, "Ver carrito"))
          )
        );
      } else {
        mensaje.replaceChildren(el("p", { class: "aviso error" }, "No hay más unidades disponibles."));
      }
      refrescar();
    });
    refrescar();

    return el(
      "article",
      { class: "detalle" },
      recuadroImagen(producto, "detalle-img"),
      el(
        "div",
        { class: "detalle-cuerpo" },
        el(
          "div",
          { class: "detalle-etiquetas" },
          el("span", { class: "etiqueta" }, nombreCategoria),
          inactivo && el("span", { class: "insignia-estado inactivo" }, "Inactivo")
        ),
        el("h2", { class: "detalle-nombre" }, producto.nombre),
        producto.marca && el("p", { class: "marca" }, `Marca: ${producto.marca}`),
        el("p", { class: "detalle-precio" }, formatearPrecio(producto.precio)),
        el("p", { class: `stock ${stock.clase}` }, stock.texto),
        producto.descripcion
          ? el("p", { class: "detalle-descripcion" }, producto.descripcion)
          : el("p", { class: "marca" }, "Este producto no tiene descripción."),
        disponible > 0 && !inactivo
          ? el(
              "div",
              { class: "cantidad cantidad-detalle", role: "group", "aria-label": "Cantidad" },
              menos,
              valor,
              mas
            )
          : null,
        comprar,
        mensaje,
        el(
          "div",
          { class: "detalle-acciones" },
          esAdmin() &&
            el("a", { class: "btn btn-claro btn-enlace", href: `#/editar-producto/${encodeURIComponent(producto.id)}` }, "Editar producto"),
          el("a", { class: "btn-texto", href: "#/catalogo" }, "Volver al catálogo")
        )
      )
    );
  }
}
