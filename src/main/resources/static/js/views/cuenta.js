// Pantalla "Cuenta": si hay sesión muestra los datos del usuario y permite cerrarla;
// si no, muestra el formulario de inicio de sesión.
// Usa: POST /api/usuarios/login  con { email, password }
//
// OJO: el backend verifica el correo y la contraseña, pero todavía NO entrega un token.
// La app solo recuerda { id, name, email } en este navegador (localStorage).

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import { guardarUsuarioActual, obtenerUsuarioActual, olvidarUsuarioActual } from "../usuario.js";

export function vistaCuenta() {
  const raiz = el("section", { class: "vista" });
  pintar();
  return raiz;

  // ---------------------------------------------------------------

  function pintar() {
    const usuario = obtenerUsuarioActual();
    raiz.replaceChildren(usuario?.id ? pintarPerfil(usuario) : pintarLogin());
  }

  function pintarPerfil(usuario) {
    return el(
      "div",
      { class: "formulario" },
      el("h2", {}, "Tu cuenta"),
      el("p", { class: "dato" }, el("span", { class: "marca" }, "Nombre"), el("strong", {}, usuario.name ?? "—")),
      el("p", { class: "dato" }, el("span", { class: "marca" }, "Correo"), el("strong", {}, usuario.email ?? "—")),
      el("a", { class: "btn btn-enlace", href: "#/catalogo" }, "Ir al catálogo"),
      el(
        "button",
        {
          type: "button",
          class: "btn-texto",
          onclick: () => {
            olvidarUsuarioActual();
            pintar();
          },
        },
        "Cerrar sesión"
      )
    );
  }

  function pintarLogin() {
    const mensajes = el("div", { role: "alert" });
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
      el("h2", {}, "Iniciar sesión"),
      el("div", { class: "campo" }, el("label", { for: email.id }, "Correo electrónico"), email),
      el("div", { class: "campo" }, el("label", { for: clave.id }, "Contraseña"), clave),
      boton,
      el("p", { class: "marca" }, "¿No tienes cuenta? ", el("a", { href: "#/registro" }, "Crear cuenta"))
    );

    return el("div", { class: "vista" }, formulario, mensajes);

    async function enviar(evento) {
      evento.preventDefault();
      mensajes.replaceChildren();
      boton.disabled = true;
      boton.textContent = "Ingresando…";
      try {
        const usuario = await api.iniciarSesion({ email: email.value.trim(), password: clave.value });
        guardarUsuarioActual({ id: usuario.id, name: usuario.name, email: usuario.email });
        location.hash = "#/catalogo";
      } catch (error) {
        const texto = error instanceof ApiError ? error.message : "Ocurrió un error inesperado.";
        mensajes.replaceChildren(el("p", { class: "aviso error" }, texto));
        clave.value = "";
        boton.disabled = false;
        boton.textContent = "Iniciar sesión";
      }
    }
  }
}
