// Configuración de la app. Si algo cambia (puerto, moneda...), se cambia aquí.

// URL base de la API.
// La app ahora la sirve el MISMO Spring Boot (carpeta src/main/resources/static), así que
// normalmente la API está en el mismo origen y la base es "" (rutas como /api/productos).
// Excepción: si estás editando con Live Server (puerto 5500/5501) o abriste el archivo
// directo, la API sigue en http://localhost:8080.
export function calcularApiBase(ubicacion) {
  const enLiveServer = ["5500", "5501"].includes(ubicacion.port);
  const enArchivo = ubicacion.protocol === "file:";
  return enLiveServer || enArchivo ? "http://localhost:8080" : "";
}

export const API_BASE = calcularApiBase(globalThis.location);

// Cómo se muestran los precios.
export const MONEDA = "COP";
export const LOCALE = "es-CO";
