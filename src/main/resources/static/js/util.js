import { MONEDA, LOCALE } from "./config.js";

// Precio con formato de moneda, sin decimales (ej. $ 1.250.000).
const formatoPrecio = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: MONEDA,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor) {
  return formatoPrecio.format(Number(valor) || 0);
}

// Para buscar sin importar mayúsculas ni tildes ("fresa" encuentra "Frésa").
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Solo aceptamos imágenes http(s). Cualquier otra cosa (javascript:, data:, texto raro)
// se descarta y se muestra el recuadro "Sin imagen".
export function urlImagenSegura(valor) {
  if (!valor) return null;
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// Fecha y hora legibles (ej. "29 oct 2026, 10:15 p. m."). Si el valor no sirve, devuelve "".
// El backend envía la fecha como texto ISO; si algún día llegara como número, serían segundos.
const formatoFecha = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });

export function formatearFecha(valor) {
  const fecha = typeof valor === "number" ? new Date(valor * 1000) : new Date(valor ?? NaN);
  return Number.isNaN(fecha.getTime()) ? "" : formatoFecha.format(fecha);
}
