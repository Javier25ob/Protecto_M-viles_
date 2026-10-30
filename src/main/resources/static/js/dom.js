// Ayudante para crear elementos HTML desde JavaScript.
//
//   el("p", { class: "aviso" }, "Hola ", el("b", {}, "mundo"))
//
// Importante: el texto se agrega como TEXTO (no como HTML). Así, si un producto
// se llama "<img onerror=...>" se muestra tal cual y no se ejecuta nada.

export function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);

  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;

    if (clave === "class") {
      nodo.className = valor;
    } else if (clave.startsWith("on") && typeof valor === "function") {
      nodo.addEventListener(clave.slice(2), valor); // onclick -> "click"
    } else {
      nodo.setAttribute(clave, valor === true ? "" : String(valor));
    }
  }

  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}
