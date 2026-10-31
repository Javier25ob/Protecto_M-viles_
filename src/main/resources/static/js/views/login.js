// Pantalla "Iniciar sesión": es la primera pantalla de la app.
// Usa: POST /api/usuarios/login  con { email, password }
//
// El backend devuelve { id, name, email, rol, token }; la app lo recuerda en este navegador
// y envía el token en cada petición (ver api.js).

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import { guardarUsuarioActual, tomarAviso } from "../usuario.js";

export function vistaLogin() {
  const aviso = tomarAviso(); // ej. "Tu sesión venció"
  const mensajes = el("div", { role: "alert" }, aviso && el("p", { class: "aviso info" }, aviso));
  const email = el("input", { id: "login-email", name: "email", type: "email", autocomplete: "email", required: true });
  const clave = el("input", {
    id: "login-password",
    name: "password",
    type: "password",
    autocomplete: "current-password",
    required: true,
  });
  const boton = el("button", { type: "submit", class: "btn" }, "Iniciar sesión");

  const formulario = el(
    "form",
    { class: "formulario", onsubmit: enviar },
    el(
      "div",
      { class: "marca-login" },
      el("img", { src: "icons/logo.svg", alt: "", width: "88", height: "88" }),
      el("h2", {}, "Depósito Dental")
    ),
    el("p", { class: "marca" }, "Suministros para laboratorios dentales. Inicia sesión para ver el catálogo y comprar."),
    el("div", { class: "campo" }, el("label", { for: email.id }, "Correo electrónico"), email),
    el("div", { class: "campo" }, el("label", { for: clave.id }, "Contraseña"), clave),
    boton,
    el("p", { class: "marca" }, "¿No tienes cuenta? ", el("a", { href: "#/registro" }, "Crear cuenta"))
  );

  return el("section", { class: "vista" }, formulario, mensajes);

  async function enviar(evento) {
    evento.preventDefault();
    mensajes.replaceChildren();
    boton.disabled = true;
    boton.textContent = "Ingresando…";
    try {
      const usuario = await api.iniciarSesion({ email: email.value.trim(), password: clave.value });
      guardarUsuarioActual({
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        rol: usuario.rol === "ADMIN" ? "ADMIN" : "USER",
        token: usuario.token,
      });
      // replace: la pantalla de login no queda en el historial (el botón "atrás" no vuelve a ella)
      location.replace("#/inicio");
    } catch (error) {
      const texto = error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
      mensajes.replaceChildren(el("p", { class: "aviso error" }, texto));
      clave.value = "";
      boton.disabled = false;
      boton.textContent = "Iniciar sesión";
    }
  }
}
