// Pantalla "Reporte de ventas": totales y productos más vendidos.
// Usa: GET /api/ventas/reporte  ->  { totalVentas, totalIngresos, productosMasVendidos: [{ nombreProducto, cantidadVendida }] }

import { api } from "../api.js";
import { el } from "../dom.js";
import { formatearPrecio } from "../util.js";

export function vistaReporte() {
  const raiz = el("section", { class: "vista" });
  cargar();
  return raiz;

  // ---------------------------------------------------------------

  async function cargar() {
    raiz.replaceChildren(el("p", { class: "cargando" }, "Calculando el reporte…"));
    try {
      const reporte = await api.obtenerReporte();
      pintar(reporte ?? {});
    } catch (error) {
      raiz.replaceChildren(
        el(
          "div",
          { class: "aviso error" },
          el("p", {}, error.message),
          el("button", { type: "button", class: "btn", onclick: cargar }, "Reintentar")
        )
      );
    }
  }

  function pintar(reporte) {
    const totalVentas = Number(reporte.totalVentas) || 0;
    const ingresos = Number(reporte.totalIngresos) || 0;
    const top = reporte.productosMasVendidos ?? [];
    const maximo = Math.max(1, ...top.map((p) => Number(p.cantidadVendida) || 0));

    raiz.replaceChildren(
      el(
        "div",
        { class: "stats dos" },
        el("div", { class: "stat" }, el("strong", {}, String(totalVentas)), el("span", {}, "Ventas realizadas")),
        el("div", { class: "stat" }, el("strong", {}, formatearPrecio(ingresos)), el("span", {}, "Ingresos totales"))
      ),
      el("h3", { class: "subtitulo" }, "Productos más vendidos"),
      top.length === 0
        ? el("p", { class: "vacio" }, "Aún no hay ventas registradas.")
        : el(
            "ol",
            { class: "ranking" },
            ...top.map((producto, i) => {
              const cantidad = Number(producto.cantidadVendida) || 0;
              const ancho = Math.max(4, Math.round((cantidad / maximo) * 100));
              return el(
                "li",
                {},
                el(
                  "div",
                  { class: "ranking-fila" },
                  el("span", { class: "ranking-nombre" }, `${i + 1}. ${producto.nombreProducto ?? "Producto"}`),
                  el("strong", {}, `${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}`)
                ),
                el("div", { class: "barra", role: "presentation" }, el("div", { class: "barra-relleno", style: `width:${ancho}%` }))
              );
            })
          ),
      el("button", { type: "button", class: "btn btn-claro", onclick: cargar }, "Actualizar")
    );
  }
}
