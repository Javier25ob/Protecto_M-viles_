// Pantalla "Inicio": saludo, resumen rápido y accesos a las demás pantallas.
// Usa: GET /api/productos y GET /api/ventas/usuario/{id} (solo para los números del resumen;
// si fallan, el resumen muestra "—" y la pantalla sigue funcionando).

import { api } from "../api.js";
import { el, icono } from "../dom.js";
import { cantidadTotal } from "../carrito.js";
import { obtenerUsuarioActual, esAdmin } from "../usuario.js";
import { formatearPrecio } from "../util.js";

const ICONOS = {
  catalogo: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  carrito:
    "M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM1 2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 17h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 13h7.45a2 2 0 0 0 1.75-1.03L21 5H5.21l-.94-2z",
  compras: "M6 2h12a1 1 0 0 1 1 1v19l-3-2-2 2-2-2-2 2-2-2-3 2V3a1 1 0 0 1 1-1zm2 5v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z",
  reporte: "M5 9h3v10H5zm5.5-5h3v15h-3zM16 13h3v6h-3z",
  inventario: "M20 7 12 3 4 7v10l8 4 8-4zM12 5.2 17.6 8 12 10.8 6.4 8zM6 9.6l5 2.5v6.2l-5-2.5zm7 8.7v-6.2l5-2.5v6.2z",
  nuevo: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z",
};

const ACCESOS = [
  { ruta: "catalogo", titulo: "Catálogo", detalle: "Busca y agrega productos" },
  { ruta: "carrito", titulo: "Carrito", detalle: "Revisa y confirma tu compra" },
  { ruta: "compras", titulo: "Mis compras", detalle: "Tu historial de pedidos" },
  { ruta: "reporte", titulo: "Reporte", detalle: "Ventas e ingresos", soloAdmin: true },
  { ruta: "inventario", titulo: "Inventario", detalle: "Administra tus productos", soloAdmin: true },
  { ruta: "nuevo-producto", titulo: "Nuevo producto", detalle: "Agrégalo al catálogo", icono: "nuevo", soloAdmin: true },
];

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function vistaInicio() {
  const usuario = obtenerUsuarioActual() ?? {};
  const primerNombre = String(usuario.name ?? "").trim().split(/\s+/)[0];

  const valorProductos = el("strong", {}, "…");
  const valorCompras = el("strong", {}, "…");
  const valorGastado = el("strong", {}, "…");
  const enCarrito = el("strong", {}, String(cantidadTotal()));

  const raiz = el(
    "section",
    { class: "vista" },
    el(
      "div",
      { class: "hero" },
      el("img", { class: "hero-logo", src: "icons/logo.svg", alt: "", width: "64", height: "64" }),
      el(
        "div",
        {},
        el("p", { class: "hero-saludo" }, primerNombre ? `${saludo()}, ${primerNombre}` : saludo()),
        el("h2", {}, "¿Qué necesitas hoy?"),
        el("p", { class: "hero-detalle" }, "Suministros para laboratorios dentales")
      )
    ),
    el(
      "div",
      { class: "stats", role: "group", "aria-label": "Resumen" },
      estadistica(valorProductos, "Productos disponibles"),
      estadistica(valorCompras, "Tus compras"),
      estadistica(enCarrito, "En tu carrito")
    ),
    el("p", { class: "resumen-historial" }, "Total gastado: ", valorGastado),
    el("h3", { class: "subtitulo" }, "Accesos rápidos"),
    el(
      "div",
      { class: "accesos" },
      ...ACCESOS.filter((a) => !a.soloAdmin || esAdmin()).map((a) =>
        el(
          "a",
          { class: "acceso", href: `#/${a.ruta}` },
          el("span", { class: "acceso-icono" }, icono(ICONOS[a.icono ?? a.ruta])),
          el("strong", {}, a.titulo),
          el("small", {}, a.detalle)
        )
      )
    )
  );

  cargarResumen();
  return raiz;

  // ---------------------------------------------------------------

  async function cargarResumen() {
    const [productos, compras] = await Promise.allSettled([
      api.listarProductos(),
      usuario.id ? api.listarComprasDeUsuario(usuario.id) : Promise.resolve([]),
    ]);

    if (productos.status === "fulfilled") {
      const activos = (productos.value ?? []).filter((p) => (p.estado ?? "ACTIVO") === "ACTIVO" && (p.stock ?? 0) > 0);
      valorProductos.textContent = String(activos.length);
    } else {
      valorProductos.textContent = "—";
    }

    if (compras.status === "fulfilled") {
      const lista = compras.value ?? [];
      valorCompras.textContent = String(lista.length);
      valorGastado.textContent = formatearPrecio(lista.reduce((suma, v) => suma + (Number(v.total) || 0), 0));
    } else {
      valorCompras.textContent = "—";
      valorGastado.textContent = "—";
    }
  }
}

function estadistica(valor, etiqueta) {
  return el("div", { class: "stat" }, valor, el("span", {}, etiqueta));
}
