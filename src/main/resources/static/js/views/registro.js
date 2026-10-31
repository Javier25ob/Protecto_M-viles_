// Pantalla "Registro": crea un usuario nuevo.
// Usa: POST /api/usuarios  con { name, email, password, telf }

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import { guardarUsuarioActual } from "../usuario.js";

// Los nombres de los campos son los MISMOS que espera el backend (UserModel),
// así podemos mostrar cada error de validación debajo de su campo.
const CAMPOS = [
  { nombre: "name", etiqueta: "Nombre completo", tipo: "text", autocomplete: "name", requerido: true },
  { nombre: "email", etiqueta: "Correo electrónico", tipo: "email", autocomplete: "email", requerido: true },
  {
    nombre: "password",
    etiqueta: "Contraseña",
    tipo: "password",
    autocomplete: "new-password",
    requerido: true,
    minimo: 6,
    ayuda: "Mínimo 6 caracteres.",
  },
  { nombre: "telf", etiqueta: "Teléfono (opcional)", tipo: "tel", autocomplete: "tel", requerido: false },
];

export function vistaRegistro() {
  const mensajes = el("div", { role: "status" });
  const erroresPorCampo = {};

  const filas = CAMPOS.map((campo) => {
    const input = el("input", {
      id: `campo-${campo.nombre}`,
      name: campo.nombre,
      type: campo.tipo,
      autocomplete: campo.autocomplete,
      required: campo.requerido,
      minlength: campo.minimo,
    });
    const error = el("p", { class: "error-campo", id: `error-${campo.nombre}` });
    erroresPorCampo[campo.nombre] = error;

    return el(
      "div",
      { class: "campo" },
      el("label", { for: input.id }, campo.etiqueta),
      input,
      campo.ayuda && el("small", {}, campo.ayuda),
      error
    );
  });

  const boton = el("button", { type: "submit", class: "btn" }, "Registrarme");
  const formulario = el(
    "form",
    { class: "formulario", onsubmit: enviar },
    el("h2", {}, "Crea tu cuenta"),
    ...filas,
    boton
  );

  return el(
    "section",
    { class: "vista" },
    formulario,
    mensajes,
    el("p", { class: "marca" }, "¿Ya tienes cuenta? ", el("a", { href: "#/login" }, "Iniciar sesión"))
  );

  // ---------------------------------------------------------------

  async function enviar(evento) {
    evento.preventDefault();
    limpiarMensajes();

    const datos = new FormData(formulario);
    const usuario = {
      name: datos.get("name").trim(),
      email: datos.get("email").trim(),
      password: datos.get("password"),
      telf: datos.get("telf").trim() || undefined, // si está vacío, no se envía
    };

    boton.disabled = true;
    boton.textContent = "Registrando…";
    try {
      const creado = await api.registrarUsuario(usuario);
      // El registro no entrega token: iniciamos sesión con los mismos datos para obtenerlo.
      const sesion = await api.iniciarSesion({ email: usuario.email, password: usuario.password });
      guardarUsuarioActual({
        id: sesion.id,
        name: sesion.name,
        email: sesion.email,
        rol: sesion.rol === "ADMIN" ? "ADMIN" : "USER",
        token: sesion.token,
      });
      formulario.reset();
      mensajes.replaceChildren(
        el(
          "div",
          { class: "aviso exito" },
          el("p", {}, `¡Registro exitoso! Bienvenido, ${creado.name}.`),
          el("p", {}, el("a", { href: "#/inicio" }, "Ir al inicio"))
        )
      );
    } catch (error) {
      mostrarError(error);
    } finally {
      boton.disabled = false;
      boton.textContent = "Registrarme";
    }
  }

  function mostrarError(error) {
    // Errores de validación del backend: { detalles: { email: "no tiene un formato valido", ... } }
    if (error instanceof ApiError && error.detalles) {
      for (const [campo, texto] of Object.entries(error.detalles)) {
        if (erroresPorCampo[campo]) erroresPorCampo[campo].textContent = texto;
      }
    }
    const texto = error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
    mensajes.replaceChildren(el("p", { class: "aviso error" }, texto));
  }

  function limpiarMensajes() {
    mensajes.replaceChildren();
    Object.values(erroresPorCampo).forEach((p) => (p.textContent = ""));
  }
}
