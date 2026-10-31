// Pantalla "Carrito": revisar lo que se va a comprar, cambiar cantidades y confirmar.
// Usa: GET /api/productos (para verificar stock y precios) y POST /api/ventas.
//
// Reglas del backend que esta pantalla respeta:
//  - El POST solo lleva { usuarioId, items: [{ productoId, cantidad }] }: el precio lo calcula el servidor.
//  - Si no hay stock suficiente responde 400; si el usuario o el producto no existen, 404.

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import {
  obtenerItems,
  cambiarCantidad,
  quitar,
  vaciar,
  totalCarrito,
  sincronizar,
} from "../carrito.js";
import { obtenerUsuarioActual, olvidarUsuarioActual } from "../usuario.js";
import { formatearPrecio, formatearFecha } from "../util.js";

export function vistaCarrito() {
  const estado = {
    avisos: [], // frases sobre cambios que hicimos al carrito (precio, stock...)
    error: null, // { texto, enlaceRegistro }
    enviando: false,
    recibo: null, // respuesta del servidor tras una compra exitosa
    verificando: false,
  };

  const raiz = el("section", { class: "vista" });
  iniciar();
  return raiz;

  // ---------------------------------------------------------------

  // Al abrir el carrito comparamos con el servidor: puede haber cambiado el stock o el precio.
  async function iniciar() {
    if (obtenerItems().length === 0) {
      pintar();
      return;
    }
    estado.verificando = true;
    pintar();
    await verificarConServidor();
    estado.verificando = false;
    pintar();
  }

  async function verificarConServidor() {
    try {
      const productos = await api.listarProductos();
      estado.avisos = sincronizar(productos);
    } catch {
      // Sin conexión: se muestra el carrito como está; el servidor validará al confirmar.
      estado.avisos = [];
    }
  }

  function pintar() {
    if (estado.recibo) {
      raiz.replaceChildren(pintarRecibo(estado.recibo));
      return;
    }

    const items = obtenerItems();
    const partes = [];

    if (estado.error) partes.push(pintarError(estado.error));
    estado.avisos.forEach((texto) => partes.push(el("p", { class: "aviso info" }, texto)));

    if (estado.verificando) {
      partes.push(el("p", { class: "cargando" }, "Verificando disponibilidad…"));
    } else if (items.length === 0) {
      partes.push(
        el(
          "div",
          { class: "vacio-bloque" },
          el("p", { class: "vacio" }, "Tu carrito está vacío."),
          el("a", { class: "btn btn-enlace", href: "#/catalogo" }, "Ir al catálogo")
        )
      );
    } else {
      partes.push(
        el("div", { class: "lista-carrito" }, ...items.map(filaItem)),
        pintarResumen(items)
      );
    }
    raiz.replaceChildren(...partes);
  }

  function filaItem(item) {
    return el(
      "article",
      { class: "item-carrito" },
      el(
        "div",
        { class: "item-info" },
        el("h3", {}, el("a", { class: "card-enlace", href: `#/producto/${encodeURIComponent(item.id)}` }, item.nombre)),
        el("p", { class: "marca" }, `${formatearPrecio(item.precio)} c/u`)
      ),
      el(
        "div",
        { class: "cantidad", role: "group", "aria-label": `Cantidad de ${item.nombre}` },
        botonCantidad("−", `Quitar una unidad de ${item.nombre}`, false, () =>
          cambiarYPintar(item.id, item.cantidad - 1)
        ),
        el("span", { class: "cantidad-valor", "aria-live": "polite" }, String(item.cantidad)),
        botonCantidad("+", `Agregar una unidad de ${item.nombre}`, item.cantidad >= item.stock, () =>
          cambiarYPintar(item.id, item.cantidad + 1)
        )
      ),
      el("p", { class: "item-subtotal" }, formatearPrecio(item.precio * item.cantidad)),
      el(
        "button",
        {
          type: "button",
          class: "btn-texto",
          onclick: () => {
            quitar(item.id);
            limpiarMensajes();
            pintar();
          },
        },
        "Quitar"
      )
    );
  }

  function botonCantidad(texto, etiqueta, deshabilitado, alHacerClic) {
    const boton = el(
      "button",
      { type: "button", class: "btn-cantidad", "aria-label": etiqueta, onclick: alHacerClic },
      texto
    );
    boton.disabled = deshabilitado || estado.enviando;
    return boton;
  }

  function cambiarYPintar(id, cantidad) {
    cambiarCantidad(id, cantidad);
    limpiarMensajes();
    pintar();
  }

  function limpiarMensajes() {
    estado.avisos = [];
    estado.error = null;
  }

  function pintarResumen() {
    const usuario = obtenerUsuarioActual();

    const quien = usuario?.id
      ? el("p", { class: "marca" }, `Compra a nombre de ${usuario.name ?? "tu cuenta"}`)
      : el(
          "p",
          { class: "aviso info" },
          "Para comprar primero inicia sesión o crea una cuenta. ",
          el("a", { href: "#/login" }, "Iniciar sesión"),
          " · ",
          el("a", { href: "#/registro" }, "Crear cuenta")
        );

    const confirmar = el(
      "button",
      { type: "button", class: "btn", onclick: confirmarCompra },
      estado.enviando ? "Enviando…" : "Confirmar compra"
    );
    confirmar.disabled = estado.enviando || !usuario?.id;

    const vaciarBtn = el(
      "button",
      {
        type: "button",
        class: "btn-texto",
        onclick: () => {
          vaciar();
          limpiarMensajes();
          pintar();
        },
      },
      "Vaciar carrito"
    );
    vaciarBtn.disabled = estado.enviando;

    return el(
      "div",
      { class: "resumen-carrito" },
      el(
        "p",
        { class: "total" },
        el("span", {}, "Total"),
        el("strong", {}, formatearPrecio(totalCarrito()))
      ),
      el("p", { class: "marca" }, "El total final lo confirma el servidor con los precios vigentes."),
      quien,
      confirmar,
      vaciarBtn
    );
  }

  function pintarError({ texto, enlaceRegistro }) {
    return el(
      "div",
      { class: "aviso error", role: "alert" },
      el("p", {}, texto),
      enlaceRegistro && el("p", {}, el("a", { href: "#/registro" }, "Ir a crear cuenta"))
    );
  }

  async function confirmarCompra() {
    if (estado.enviando) return; // evita doble clic = doble compra
    const usuario = obtenerUsuarioActual();
    const items = obtenerItems();
    if (!usuario?.id || items.length === 0) return;

    estado.enviando = true;
    estado.error = null;
    estado.avisos = [];
    pintar();

    let debeVerificar = false;
    try {
      const venta = await api.registrarVenta({
        usuarioId: usuario.id,
        items: items.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
      });
      vaciar();
      estado.recibo = venta;
    } catch (error) {
      if (!(error instanceof ApiError)) {
        estado.error = { texto: "Ocurrió un error inesperado. Intenta de nuevo." };
      } else if (error.status === 404 && /usuario/i.test(error.message)) {
        // El servidor ya no conoce a este usuario (ej. base de datos reiniciada).
        olvidarUsuarioActual();
        estado.error = {
          texto: "Tu cuenta ya no existe en el servidor. Crea una cuenta nueva para comprar.",
          enlaceRegistro: true,
        };
      } else if (error.status === 404 || error.status === 400) {
        // Producto inexistente o stock insuficiente: mostramos el mensaje y actualizamos el carrito.
        estado.error = { texto: error.message };
        debeVerificar = true;
      } else {
        estado.error = { texto: error.message };
      }
    }

    if (debeVerificar) await verificarConServidor();
    estado.enviando = false;
    pintar();
  }

  function pintarRecibo(venta) {
    const fecha = formatearFecha(venta.fecha);
    const lineas = (venta.items ?? []).map((i) =>
      el(
        "li",
        {},
        el("span", {}, `${i.cantidad} × ${i.nombreProducto}`),
        el("span", {}, formatearPrecio(i.subtotal))
      )
    );

    return el(
      "div",
      { class: "recibo" },
      el("p", { class: "aviso exito", role: "status" }, "¡Compra registrada con éxito!"),
      el(
        "div",
        { class: "formulario" },
        el("h2", {}, "Resumen de tu compra"),
        venta.id && el("p", { class: "marca" }, `Referencia: ${venta.id}`),
        fecha && el("p", { class: "marca" }, fecha),
        el("ul", { class: "lista-recibo" }, ...lineas),
        el(
          "p",
          { class: "total" },
          el("span", {}, "Total pagado"),
          el("strong", {}, formatearPrecio(venta.total))
        ),
        el("a", { class: "btn btn-enlace", href: "#/catalogo" }, "Seguir comprando"),
        el("p", { class: "marca" }, el("a", { href: "#/compras" }, "Ver mis compras"))
      )
    );
  }
}
