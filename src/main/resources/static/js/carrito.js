// Almacén del carrito de compras.
//
// El backend NO tiene carrito: el carrito vive aquí, en el navegador (localStorage),
// y solo se envía al servidor al confirmar la compra (POST /api/ventas).
//
// Cada ítem guarda una "foto" del producto cuando se agregó (nombre, precio, stock).
// Sirve solo para MOSTRAR el carrito; el precio real lo calcula siempre el servidor.

import { formatearPrecio } from "./util.js";

const CLAVE = "deposito-dental:carrito";

let items = cargar();
const oyentes = new Set();

// ---------- Lectura y escritura ----------

function esItemValido(i) {
  return (
    i &&
    typeof i.id === "string" && i.id !== "" &&
    typeof i.nombre === "string" &&
    Number.isFinite(i.precio) && i.precio >= 0 &&
    Number.isInteger(i.stock) && i.stock >= 0 &&
    Number.isInteger(i.cantidad) && i.cantidad >= 1
  );
}

// Lo guardado en el navegador no es de fiar (puede estar dañado o editado a mano):
// se descarta lo que no tenga la forma esperada.
function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    if (!Array.isArray(datos)) return [];
    return datos
      .filter(esItemValido)
      .map((i) => ({
        id: i.id,
        nombre: i.nombre,
        precio: i.precio,
        stock: i.stock,
        cantidad: Math.min(i.cantidad, i.stock),
      }))
      .filter((i) => i.cantidad >= 1);
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Sin almacenamiento (modo privado): el carrito sigue funcionando mientras la página esté abierta.
  }
  oyentes.forEach((aviso) => aviso());
}

// Si el carrito cambia en otra pestaña, nos actualizamos.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    if (evento.key === CLAVE || evento.key === null) {
      items = cargar();
      oyentes.forEach((aviso) => aviso());
    }
  });
}

// ---------- Consultas ----------

// Copia, para que quien la use no pueda modificar el carrito por accidente.
export function obtenerItems() {
  return items.map((i) => ({ ...i }));
}

export function cantidadEnCarrito(productoId) {
  return items.find((i) => i.id === productoId)?.cantidad ?? 0;
}

export function cantidadTotal() {
  return items.reduce((suma, i) => suma + i.cantidad, 0);
}

export function totalCarrito() {
  return items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
}

// Para que otras partes (ej. la insignia del menú) se enteren cuando algo cambia.
export function suscribir(aviso) {
  oyentes.add(aviso);
  return () => oyentes.delete(aviso);
}

// ---------- Cambios ----------

/** Agrega una unidad. Devuelve { ok: true } o { ok: false, motivo: "agotado" | "limite" }. */
export function agregar(producto) {
  const stock = producto.stock ?? 0;
  if (stock <= 0) return { ok: false, motivo: "agotado" };

  const existente = items.find((i) => i.id === producto.id);
  if (existente) {
    if (existente.cantidad >= stock) return { ok: false, motivo: "limite" };
    existente.cantidad += 1;
    // Refrescamos la foto con los datos más recientes del catálogo.
    existente.nombre = producto.nombre;
    existente.precio = producto.precio;
    existente.stock = stock;
  } else {
    items.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock,
      cantidad: 1,
    });
  }
  guardar();
  return { ok: true };
}

/** Fija la cantidad de un producto. 0 o menos lo quita; más del stock se recorta al stock. */
export function cambiarCantidad(productoId, cantidad) {
  const item = items.find((i) => i.id === productoId);
  if (!item) return;
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    items = items.filter((i) => i.id !== productoId);
  } else {
    item.cantidad = Math.min(Math.floor(cantidad), item.stock);
  }
  guardar();
}

export function quitar(productoId) {
  items = items.filter((i) => i.id !== productoId);
  guardar();
}

export function vaciar() {
  items = [];
  guardar();
}

/**
 * Pone el carrito al día con la lista actual de productos del servidor:
 * quita lo que ya no existe, está inactivo o agotado, y ajusta precios y cantidades.
 * Devuelve una lista de frases explicando qué cambió (vacía si nada cambió).
 */
export function sincronizar(productosServidor) {
  const porId = new Map(productosServidor.map((p) => [p.id, p]));
  const cambios = [];

  items = items.flatMap((item) => {
    const producto = porId.get(item.id);
    if (!producto || (producto.estado ?? "ACTIVO") !== "ACTIVO") {
      cambios.push(`«${item.nombre}» ya no está disponible y se quitó del carrito.`);
      return [];
    }
    const stock = producto.stock ?? 0;
    if (stock <= 0) {
      cambios.push(`«${item.nombre}» está agotado y se quitó del carrito.`);
      return [];
    }

    const actualizado = { ...item, nombre: producto.nombre, precio: producto.precio, stock };
    if (item.precio !== producto.precio) {
      cambios.push(`El precio de «${producto.nombre}» ahora es ${formatearPrecio(producto.precio)}.`);
    }
    if (item.cantidad > stock) {
      actualizado.cantidad = stock;
      cambios.push(`De «${producto.nombre}» solo quedan ${stock}; ajustamos la cantidad.`);
    }
    return [actualizado];
  });

  guardar();
  return cambios;
}
