// Pantalla "Cuenta": datos del usuario con sesión iniciada y botón para cerrarla.
// (El inicio de sesión está en views/login.js; sin sesión el router ni siquiera llega aquí.)

import { el } from "../dom.js";
import { vaciar } from "../carrito.js";
import { obtenerUsuarioActual, olvidarUsuarioActual, esAdmin } from "../usuario.js";
import { puedeInstalar, yaInstalada, esIOS, instalar, suscribirInstalacion } from "../instalar.js";

export function vistaCuenta() {
  const usuario = obtenerUsuarioActual() ?? {};
  const tarjetaInstalar = el("div", { class: "formulario tarjeta-instalar" });
  pintarInstalacion();
  suscribirInstalacion(() => {
    if (tarjetaInstalar.isConnected) pintarInstalacion();
  });

  return el(
    "section",
    { class: "vista" },
    el(
      "div",
      { class: "formulario" },
      el("h2", {}, "Tu cuenta"),
      el("p", { class: "dato" }, el("span", { class: "marca" }, "Nombre"), el("strong", {}, usuario.name ?? "—")),
      el("p", { class: "dato" }, el("span", { class: "marca" }, "Correo"), el("strong", {}, usuario.email ?? "—")),
      el(
        "p",
        { class: "dato" },
        el("span", { class: "marca" }, "Rol"),
        el("span", { class: `insignia-rol${esAdmin() ? " admin" : ""}` }, esAdmin() ? "Administrador" : "Cliente")
      ),
      el("a", { class: "btn btn-enlace", href: "#/compras" }, "Ver mis compras"),
      // Lo siguiente es solo del administrador
      esAdmin() && el("a", { class: "btn btn-enlace btn-claro", href: "#/reporte" }, "Reporte de ventas"),
      esAdmin() && el("a", { class: "btn btn-enlace btn-claro", href: "#/inventario" }, "Gestionar productos"),
      el(
        "button",
        { type: "button", class: "btn-texto", onclick: cerrarSesion },
        "Cerrar sesión"
      )
    ),
    tarjetaInstalar
  );

  // Instalar la app en el celular: botón si el navegador lo permite; si no, los pasos a mano.
  function pintarInstalacion() {
    const partes = [el("h2", {}, "Instalar en tu celular")];
    if (yaInstalada()) {
      partes.push(el("p", { class: "aviso exito" }, "✓ La app ya está instalada en este dispositivo."));
    } else if (puedeInstalar()) {
      partes.push(
        el("p", { class: "marca" }, "Instálala y ábrela desde tu pantalla de inicio, como cualquier app."),
        el("button", { type: "button", class: "btn", onclick: () => instalar() }, "Instalar app")
      );
    } else if (esIOS()) {
      partes.push(
        el("p", { class: "marca" }, "En iPhone o iPad, desde Safari:"),
        el("ol", { class: "pasos" },
          el("li", {}, "Toca el botón Compartir (el cuadrado con la flecha hacia arriba)."),
          el("li", {}, "Elige «Añadir a pantalla de inicio»."),
          el("li", {}, "Toca «Añadir».")
        )
      );
    } else {
      partes.push(
        el("p", { class: "marca" }, "En Chrome (Android), si no ves el botón de instalar:"),
        el("ol", { class: "pasos" },
          el("li", {}, "Abre el menú ⋮ del navegador."),
          el("li", {}, "Elige «Instalar aplicación» o «Añadir a la pantalla de inicio»."),
          el("li", {}, "Confirma con «Instalar».")
        ),
        el("p", { class: "marca" }, "La instalación solo está disponible con una dirección segura (https://).")
      );
    }
    tarjetaInstalar.replaceChildren(...partes);
  }

  function cerrarSesion() {
    olvidarUsuarioActual();
    vaciar(); // el carrito era de esta sesión
    location.replace("#/login");
  }
}
