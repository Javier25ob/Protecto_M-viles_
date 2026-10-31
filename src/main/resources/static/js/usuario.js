// Sesión del navegador (localStorage): { id, name, email, rol, token }.
//
// El token lo entrega el backend al iniciar sesión (POST /api/usuarios/login) y se envía en
// cada petición (ver api.js). El ROL ("ADMIN" o "USER") sirve aquí solo para mostrar u ocultar
// opciones; quien realmente decide qué se puede hacer es el servidor, que revisa el token.

const CLAVE = "deposito-dental:usuario";
const CLAVE_AVISO = "deposito-dental:aviso";

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

// Hay sesión solo si tenemos usuario Y token (las sesiones anteriores a los roles no tienen token).
export function haySesion() {
  const usuario = obtenerUsuarioActual();
  return Boolean(usuario?.id && usuario?.token);
}

export function esAdmin() {
  return haySesion() && obtenerUsuarioActual().rol === "ADMIN";
}

export function obtenerToken() {
  return obtenerUsuarioActual()?.token ?? null;
}

// Se usa al cerrar sesión, o cuando el servidor dice que el token venció o el usuario ya no existe.
export function olvidarUsuarioActual() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento: no hay nada que olvidar
  }
}

// Mensaje para mostrar en el login después de que la sesión se cerró sola (ej. "tu sesión venció").
export function dejarAviso(texto) {
  try {
    sessionStorage.setItem(CLAVE_AVISO, texto);
  } catch {
    // sin almacenamiento: simplemente no se muestra el aviso
  }
}

export function tomarAviso() {
  try {
    const texto = sessionStorage.getItem(CLAVE_AVISO);
    sessionStorage.removeItem(CLAVE_AVISO);
    return texto;
  } catch {
    return null;
  }
}
