// Cliente de la API REST. Es el ÚNICO archivo que habla con el backend:
// las vistas llaman a `api.algo()` y no se preocupan por fetch, JSON ni errores.

import { API_BASE } from "./config.js";

/**
 * Error que lanza el cliente cuando algo sale mal.
 *  - message: texto listo para mostrar al usuario.
 *  - status:  código HTTP (0 si ni siquiera hubo conexión).
 *  - detalles: errores por campo cuando el backend valida (ej. { email: "..." }).
 */
export class ApiError extends Error {
  constructor(message, { status = 0, detalles = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
  }
}

async function pedir(ruta, { method = "GET", body } = {}) {
  const opciones = { method, headers: { Accept: "application/json" } };
  if (body !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(body);
  }

  let respuesta;
  try {
    respuesta = await fetch(API_BASE + ruta, opciones);
  } catch {
    throw new ApiError(
      `No se pudo conectar con el servidor (${API_BASE || location.origin}). Verifica que la API esté corriendo.`
    );
  }

  // El backend responde JSON; si viene vacío (ej. 204) o no es JSON, datos queda en null.
  let datos = null;
  const texto = await respuesta.text();
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    // GlobalExceptionHandler del backend devuelve { error: "...", detalles?: {campo: "..."} }
    throw new ApiError(datos?.error ?? `Error ${respuesta.status} del servidor.`, {
      status: respuesta.status,
      detalles: datos?.detalles ?? null,
    });
  }
  return datos;
}

export const api = {
  listarCategorias: () => pedir("/api/categorias"),
  listarProductos: () => pedir("/api/productos"),
  registrarUsuario: (usuario) => pedir("/api/usuarios", { method: "POST", body: usuario }),
  iniciarSesion: (credenciales) => pedir("/api/usuarios/login", { method: "POST", body: credenciales }),
  registrarVenta: (venta) => pedir("/api/ventas", { method: "POST", body: venta }),
};
