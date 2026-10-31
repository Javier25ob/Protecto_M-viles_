// Pantalla "Mis compras": historial de compras del usuario con sesión iniciada.
// Usa: GET /api/ventas/usuario/{usuarioId}

import { api } from "../api.js";
import { el } from "../dom.js";
import { obtenerUsuarioActual } from "../usuario.js";
import { formatearPrecio, formatearFecha } from "../util.js";

export function vistaCompras() {
  const raiz = el("section", { class: "vista" });
  const usuario = obtenerUsuarioActual();

  if (!usuario?.id) {
    raiz.append(
      el(
        "div",
        { class: "vacio-bloque" },
        el("p", { class: "vacio" }, "Inicia sesión para ver tus compras."),
        el("a", { class: "btn btn-enlace", href: "#/login" }, "Iniciar sesión")
      )
    );
    return raiz;
  }

  cargar();
  return raiz;

  // ---------------------------------------------------------------

  async function cargar() {
    raiz.replaceChildren(el("p", { class: "cargando" }, "Cargando tus compras…"));
    try {
      const ventas = (await api.listarComprasDeUsuario(usuario.id)) ?? [];
      // Las más recientes primero (la fecha ISO se puede comparar como texto).
      ventas.sort((a, b) => String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")));

      if (ventas.length === 0) {
        raiz.replaceChildren(
          el(
            "div",
            { class: "vacio-bloque" },
            el("p", { class: "vacio" }, "Aún no has hecho compras."),
            el("a", { class: "btn btn-enlace", href: "#/catalogo" }, "Ir al catálogo")
          )
        );
        return;
      }

      const gastado = ventas.reduce((suma, v) => suma + (Number(v.total) || 0), 0);
      raiz.replaceChildren(
        el(
          "p",
          { class: "resumen-historial" },
          `${ventas.length} ${ventas.length === 1 ? "compra" : "compras"} · Total gastado `,
          el("strong", {}, formatearPrecio(gastado))
        ),
        ...ventas.map(tarjetaCompra)
      );
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
}

function tarjetaCompra(venta) {
  const fecha = formatearFecha(venta.fecha) || "Fecha no disponible";
  const referencia = venta.id ? `#${String(venta.id).slice(-6)}` : "";
  const items = venta.items ?? [];
  const unidades = items.reduce((suma, i) => suma + (Number(i.cantidad) || 0), 0);

  return el(
    "details",
    { class: "compra" },
    el(
      "summary",
      {},
      el(
        "span",
        { class: "compra-datos" },
        el("strong", {}, fecha),
        el("small", {}, `${referencia} · ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`)
      ),
      el("span", { class: "compra-total" }, formatearPrecio(venta.total))
    ),
    el(
      "ul",
      { class: "lista-recibo" },
      ...items.map((i) =>
        el(
          "li",
          {},
          el("span", {}, `${i.cantidad} × ${i.nombreProducto} (${formatearPrecio(i.precioUnitario)} c/u)`),
          el("span", {}, formatearPrecio(i.subtotal))
        )
      )
    )
  );
}
