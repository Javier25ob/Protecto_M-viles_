// Pantalla "Nuevo / editar producto": #/nuevo-producto y #/editar-producto/<id>
// Usa: GET /api/categorias, POST /api/categorias, GET/POST/PUT /api/productos
//
// Los nombres de los campos son los MISMOS que valida el backend (ProductoModel),
// así cada error de validación se muestra debajo de su campo.

import { api, ApiError } from "../api.js";
import { el } from "../dom.js";
import { urlImagenSegura } from "../util.js";

const MAX_NOMBRE = 100;
const MAX_DESCRIPCION = 500;

export function vistaNuevoProducto() {
  return construir(null);
}

export function vistaEditarProducto(id) {
  return construir(id);
}

function construir(id) {
  const editando = id !== null;
  const raiz = el("section", { class: "vista" }, el("p", { class: "cargando" }, "Cargando…"));
  iniciar();
  return raiz;

  // ---------------------------------------------------------------

  async function iniciar() {
    raiz.replaceChildren(el("p", { class: "cargando" }, "Cargando…"));
    try {
      const [categorias, producto] = await Promise.all([
        api.listarCategorias(),
        editando ? api.obtenerProducto(id) : Promise.resolve(null),
      ]);
      raiz.replaceChildren(pintar(categorias, producto));
    } catch (error) {
      const noExiste = error instanceof ApiError && error.status === 404;
      raiz.replaceChildren(
        el(
          "div",
          { class: "aviso error", role: "alert" },
          el("p", {}, noExiste ? "Este producto ya no existe." : error.message),
          noExiste
            ? el("a", { class: "btn btn-enlace", href: "#/inventario" }, "Ir al inventario")
            : el("button", { type: "button", class: "btn", onclick: iniciar }, "Reintentar")
        )
      );
    }
  }

  function pintar(categorias, producto) {
    const errores = {};
    const mensajes = el("div", { role: "status" });
    let listaCategorias = [...categorias];

    function campo(nombre, etiqueta, control, ayuda) {
      const error = el("p", { class: "error-campo", id: `error-${nombre}`, role: "alert" });
      errores[nombre] = error;
      return el(
        "div",
        { class: "campo" },
        el("label", { for: control.id }, etiqueta),
        control,
        ayuda && el("small", {}, ayuda),
        error
      );
    }

    const nombre = el("input", {
      id: "campo-nombre", name: "nombre", type: "text", maxlength: MAX_NOMBRE, required: true,
      value: producto?.nombre ?? "",
    });
    const descripcion = el("textarea", {
      id: "campo-descripcion", name: "descripcion", rows: "3", maxlength: MAX_DESCRIPCION,
    });
    descripcion.value = producto?.descripcion ?? "";
    const precio = el("input", {
      id: "campo-precio", name: "precio", type: "number", inputmode: "decimal", min: "0", step: "any", required: true,
      value: producto?.precio ?? "",
    });
    const categoria = el("select", { id: "campo-categoriaId", name: "categoriaId", required: true });
    const marca = el("input", { id: "campo-marca", name: "marca", type: "text", value: producto?.marca ?? "" });
    const imagenUrl = el("input", {
      id: "campo-imagenUrl", name: "imagenUrl", type: "url", inputmode: "url",
      placeholder: "https://…", value: producto?.imagenUrl ?? "",
    });
    const stock = el("input", {
      id: "campo-stock", name: "stock", type: "number", inputmode: "numeric", min: "0", step: "1", required: true,
      value: producto?.stock ?? "",
    });
    const stockMinimo = el("input", {
      id: "campo-stockMinimo", name: "stockMinimo", type: "number", inputmode: "numeric", min: "0", step: "1",
      value: producto?.stockMinimo ?? 0,
    });
    const estado = el(
      "select",
      { id: "campo-estado", name: "estado" },
      el("option", { value: "ACTIVO" }, "Activo (visible en el catálogo)"),
      el("option", { value: "INACTIVO" }, "Inactivo (oculto del catálogo)")
    );
    estado.value = (producto?.estado ?? "ACTIVO") === "ACTIVO" ? "ACTIVO" : "INACTIVO";

    // --- Vista previa de la imagen ---
    const previa = el("div", { class: "previa-imagen" }, "Vista previa");
    function actualizarPrevia() {
      const url = urlImagenSegura(imagenUrl.value.trim());
      if (!url) {
        previa.replaceChildren(imagenUrl.value.trim() ? "Enlace no válido (debe empezar por http o https)" : "Vista previa");
        return;
      }
      const img = el("img", { src: url, alt: "Vista previa de la imagen" });
      img.addEventListener("error", () => previa.replaceChildren("No se pudo cargar la imagen"));
      previa.replaceChildren(img);
    }
    imagenUrl.addEventListener("input", actualizarPrevia);
    actualizarPrevia();

    // --- Categorías (con creación rápida) ---
    function pintarOpciones(seleccionada) {
      categoria.replaceChildren(
        el("option", { value: "" }, "Selecciona una categoría"),
        ...listaCategorias.map((c) => el("option", { value: c.id }, c.nombre))
      );
      categoria.value = seleccionada ?? "";
    }
    pintarOpciones(producto?.categoriaId);

    const nuevaCategoria = el("input", {
      id: "campo-nueva-categoria", type: "text", maxlength: "60", placeholder: "Nombre de la categoría",
      "aria-label": "Nombre de la nueva categoría",
    });
    const errorNuevaCategoria = el("p", { class: "error-campo", role: "alert" });
    const botonCrearCategoria = el(
      "button",
      { type: "button", class: "btn btn-claro", onclick: crearCategoria },
      "Crear categoría"
    );
    const cajaCategoria = el(
      "div",
      { class: "nueva-categoria", hidden: true },
      nuevaCategoria,
      botonCrearCategoria,
      errorNuevaCategoria
    );
    const alternarCategoria = el(
      "button",
      {
        type: "button",
        class: "btn-texto",
        onclick: () => {
          cajaCategoria.hidden = !cajaCategoria.hidden;
          if (!cajaCategoria.hidden) nuevaCategoria.focus();
        },
      },
      "+ Nueva categoría"
    );

    async function crearCategoria() {
      const texto = nuevaCategoria.value.trim();
      errorNuevaCategoria.textContent = "";
      if (!texto) {
        errorNuevaCategoria.textContent = "Escribe el nombre de la categoría.";
        return;
      }
      botonCrearCategoria.disabled = true;
      try {
        const creada = await api.crearCategoria({ nombre: texto });
        listaCategorias.push(creada);
        pintarOpciones(creada.id);
        nuevaCategoria.value = "";
        cajaCategoria.hidden = true;
        errores.categoriaId.textContent = "";
      } catch (error) {
        const detalle = error instanceof ApiError && error.detalles ? Object.values(error.detalles)[0] : null;
        errorNuevaCategoria.textContent = detalle ?? (error instanceof ApiError ? error.message : "No se pudo crear la categoría.");
      } finally {
        botonCrearCategoria.disabled = false;
      }
    }

    const boton = el("button", { type: "submit", class: "btn" }, editando ? "Guardar cambios" : "Crear producto");
    const formulario = el(
      "form",
      { class: "formulario", novalidate: true, onsubmit: enviar },
      el("h2", {}, editando ? "Editar producto" : "Nuevo producto"),
      campo("nombre", "Nombre *", nombre),
      campo("descripcion", "Descripción", descripcion, `Máximo ${MAX_DESCRIPCION} caracteres.`),
      campo("precio", "Precio (COP) *", precio),
      el(
        "div",
        { class: "campo" },
        campo("categoriaId", "Categoría *", categoria),
        alternarCategoria,
        cajaCategoria
      ),
      campo("marca", "Marca", marca),
      campo("imagenUrl", "Enlace de la imagen", imagenUrl, "Pega la dirección (URL) de una foto del producto."),
      previa,
      el(
        "div",
        { class: "fila-campos" },
        campo("stock", "Stock *", stock),
        campo("stockMinimo", "Stock mínimo", stockMinimo, "Avisa de «pocas unidades».")
      ),
      campo("estado", "Estado", estado),
      mensajes,
      boton,
      el("a", { class: "btn-texto", href: editando ? `#/producto/${encodeURIComponent(id)}` : "#/inventario" }, "Cancelar")
    );
    return formulario;

    // ---------------------------------------------------------------

    function limpiar() {
      mensajes.replaceChildren();
      Object.values(errores).forEach((p) => (p.textContent = ""));
    }

    // Validación en el cliente (el servidor vuelve a validar todo).
    function validar() {
      const e = {};
      const n = nombre.value.trim();
      if (!n) e.nombre = "El nombre del producto es obligatorio";
      else if (n.length > MAX_NOMBRE) e.nombre = `El nombre no puede superar los ${MAX_NOMBRE} caracteres`;
      if (descripcion.value.length > MAX_DESCRIPCION) e.descripcion = `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres`;
      const p = Number(precio.value);
      if (precio.value.trim() === "" || !Number.isFinite(p)) e.precio = "El precio es obligatorio";
      else if (p <= 0) e.precio = "El precio debe ser mayor a 0";
      if (!categoria.value) e.categoriaId = "La categoría es obligatoria";
      const url = imagenUrl.value.trim();
      if (url && !urlImagenSegura(url)) e.imagenUrl = "El enlace debe empezar por http:// o https://";
      const s = Number(stock.value);
      if (stock.value.trim() === "" || !Number.isFinite(s)) e.stock = "El stock es obligatorio";
      else if (!Number.isInteger(s) || s < 0) e.stock = "El stock debe ser un entero de 0 o más";
      const m = stockMinimo.value.trim() === "" ? 0 : Number(stockMinimo.value);
      if (!Number.isInteger(m) || m < 0) e.stockMinimo = "El stock mínimo debe ser un entero de 0 o más";
      return e;
    }

    function mostrarErrores(e) {
      for (const [clave, texto] of Object.entries(e)) {
        if (errores[clave]) errores[clave].textContent = texto;
      }
    }

    async function enviar(evento) {
      evento.preventDefault();
      if (boton.disabled) return;
      limpiar();

      const problemas = validar();
      if (Object.keys(problemas).length > 0) {
        mostrarErrores(problemas);
        mensajes.replaceChildren(el("p", { class: "aviso error" }, "Revisa los campos marcados."));
        return;
      }

      const cuerpo = {
        nombre: nombre.value.trim(),
        descripcion: descripcion.value.trim(),
        precio: Number(precio.value),
        categoriaId: categoria.value,
        marca: marca.value.trim(),
        imagenUrl: imagenUrl.value.trim(),
        stock: Number(stock.value),
        stockMinimo: stockMinimo.value.trim() === "" ? 0 : Number(stockMinimo.value),
        estado: estado.value,
      };

      boton.disabled = true;
      boton.textContent = "Guardando…";
      try {
        const guardado = editando ? await api.actualizarProducto(id, cuerpo) : await api.crearProducto(cuerpo);
        // replace: así "atrás" no vuelve al formulario ya enviado
        location.replace(`#/producto/${encodeURIComponent(guardado.id)}`);
      } catch (error) {
        if (error instanceof ApiError && error.detalles) mostrarErrores(error.detalles);
        mensajes.replaceChildren(
          el("p", { class: "aviso error", role: "alert" }, error instanceof ApiError ? error.message : "Ocurrió un error inesperado.")
        );
        boton.disabled = false;
        boton.textContent = editando ? "Guardar cambios" : "Crear producto";
      }
    }
  }
}
