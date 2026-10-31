package com.example.demo.Config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.example.demo.Dto.SesionToken;
import com.example.demo.Exception.AccesoDenegadoException;
import com.example.demo.Exception.NoAutenticadoException;
import com.example.demo.Services.TokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Guardia de la API: revisa el token (encabezado "Authorization: Bearer ...") y el rol
 * ANTES de que la peticion llegue al controlador.
 *
 *  Publico (sin token):  registrarse, iniciar sesion y LEER productos y categorias.
 *  Cualquier usuario con sesion:  comprar (POST /api/ventas) y ver sus propias compras.
 *  Solo ADMIN:  crear, editar y borrar productos y categorias; ver todas las ventas y el reporte.
 *
 * Los errores (401/403) los convierte en JSON el GlobalExceptionHandler.
 */
@Component
public class AutenticacionInterceptor implements HandlerInterceptor {

    /** Nombre con el que se guarda la sesion en la peticion, para que la lean los controladores. */
    public static final String ATRIBUTO_SESION = "sesionToken";

    private static final String PREFIJO = "Bearer ";

    private final TokenService tokenService;

    public AutenticacionInterceptor(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String metodo = request.getMethod();
        if ("OPTIONS".equals(metodo)) {
            return true; // pre-vuelo de CORS: el navegador no manda el token
        }
        String ruta = normalizar(request.getRequestURI());
        boolean lectura = "GET".equals(metodo) || "HEAD".equals(metodo);

        if (esPublica(metodo, ruta, lectura)) {
            return true;
        }

        SesionToken sesion = leerSesion(request);
        request.setAttribute(ATRIBUTO_SESION, sesion);

        if (soloAdmin(ruta, lectura) && !sesion.esAdmin()) {
            throw new AccesoDenegadoException("Solo un administrador puede realizar esta accion");
        }

        // Cada usuario solo ve SUS compras (el administrador puede ver las de cualquiera).
        if (ruta.startsWith("/api/ventas/usuario/")) {
            String usuarioId = ruta.substring("/api/ventas/usuario/".length());
            if (!sesion.esAdmin() && !sesion.usuarioId().equals(usuarioId)) {
                throw new AccesoDenegadoException("Solo puedes consultar tus propias compras");
            }
        }
        return true;
    }

    private boolean esPublica(String metodo, String ruta, boolean lectura) {
        if (lectura && ruta.equals("/api/saludo")) {
            return true;
        }
        if ("POST".equals(metodo) && (ruta.equals("/api/usuarios") || ruta.equals("/api/usuarios/login"))) {
            return true;
        }
        return lectura && (ruta.equals("/api/productos") || ruta.startsWith("/api/productos/")
                || ruta.equals("/api/categorias") || ruta.startsWith("/api/categorias/"));
    }

    // Se llega aqui con una ruta que NO es publica.
    private boolean soloAdmin(String ruta, boolean lectura) {
        if (ruta.startsWith("/api/productos") || ruta.startsWith("/api/categorias")) {
            return true; // lo unico no publico aqui es escribir (POST, PUT, DELETE)
        }
        if (ruta.equals("/api/ventas")) {
            return lectura; // GET = ver todas las ventas; POST = comprar (cualquier usuario)
        }
        if (ruta.startsWith("/api/ventas/usuario/")) {
            return false; // se controla aparte: cada uno ve las suyas
        }
        return ruta.startsWith("/api/ventas/"); // reporte y venta por id
    }

    private SesionToken leerSesion(HttpServletRequest request) {
        String cabecera = request.getHeader("Authorization");
        if (cabecera == null || !cabecera.startsWith(PREFIJO)) {
            throw new NoAutenticadoException("Debes iniciar sesion para realizar esta accion");
        }
        return tokenService.validar(cabecera.substring(PREFIJO.length()).trim())
                .orElseThrow(() -> new NoAutenticadoException("Tu sesion no es valida o ya vencio. Inicia sesion de nuevo"));
    }

    private String normalizar(String ruta) {
        return ruta.length() > 1 && ruta.endsWith("/") ? ruta.substring(0, ruta.length() - 1) : ruta;
    }
}
