// Piezas de pantalla que usan varias vistas (catálogo, detalle, inventario).

import { el } from "./dom.js";
import { urlImagenSegura } from "./util.js";

/** Recuadro con la imagen del producto, o el texto "Sin imagen" si no hay o no carga. */
export function recuadroImagen(producto, clase = "card-img") {
  const recuadro = el("div", { class: clase });
  const url = urlImagenSegura(producto.imagenUrl);
  if (url) {
    const imagen = el("img", { src: url, alt: producto.nombre, loading: "lazy" });
    // Si la imagen no carga (enlace roto), mostramos el recuadro vacío.
    imagen.addEventListener("error", () => recuadro.replaceChildren("Sin imagen"));
    recuadro.append(imagen);
  } else {
    recuadro.append("Sin imagen");
  }
  return recuadro;
}

/** Texto y clase de color según el stock: Agotado / Pocas unidades / Disponible. */
export function describirStock(producto) {
  const stock = producto.stock ?? 0;
  const minimo = producto.stockMinimo ?? 0;
  if (stock <= 0) return { texto: "Agotado", clase: "agotado" };
  if (stock <= minimo) return { texto: `Pocas unidades (${stock})`, clase: "pocas" };
  return { texto: `Disponible: ${stock}`, clase: "" };
}
