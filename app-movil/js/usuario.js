// Guarda en el navegador (localStorage) el usuario que se acaba de registrar.
//
// OJO: esto NO es un inicio de sesión (el backend todavía no tiene login).
// Solo recordamos el id para poder asociar las compras a ese usuario en el
// siguiente módulo (POST /api/ventas necesita un usuarioId).

const CLAVE = "deposito-dental:usuario";

export function guardarUsuarioActual(usuario) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(usuario));
  } catch {
    // Modo privado o almacenamiento bloqueado: la app sigue funcionando sin recordar al usuario.
  }
}

export function obtenerUsuarioActual() {
  try {
    const texto = localStorage.getItem(CLAVE);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

// Se usa cuando el servidor dice que ese usuario ya no existe (ej. se reinició la base de datos).
export function olvidarUsuarioActual() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento: no hay nada que olvidar
  }
}
