package com.example.demo.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Config.AutenticacionInterceptor;
import com.example.demo.Dto.ReporteVentasResponse;
import com.example.demo.Dto.SesionToken;
import com.example.demo.Dto.VentaRequest;
import com.example.demo.Exception.AccesoDenegadoException;
import com.example.demo.Models.VentaModel;
import com.example.demo.Services.VentaService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*")
public class VentaController {

    private final VentaService ventaService;

    @Autowired
    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    // Solo ADMIN (lo controla AutenticacionInterceptor).
    @GetMapping
    public List<VentaModel> listar() {
        return ventaService.listarTodas();
    }

    // Va antes que /{id} para que "reporte" no se interprete como un id de venta. Solo ADMIN.
    @GetMapping("/reporte")
    public ReporteVentasResponse reporte() {
        return ventaService.generarReporte();
    }

    // ADMIN, o el propio usuario (lo controla AutenticacionInterceptor).
    @GetMapping("/usuario/{usuarioId}")
    public List<VentaModel> listarPorUsuario(@PathVariable String usuarioId) {
        return ventaService.listarPorUsuario(usuarioId);
    }

    // Solo ADMIN.
    @GetMapping("/{id}")
    public VentaModel obtenerPorId(@PathVariable String id) {
        return ventaService.buscarPorId(id);
    }

    // Cualquier usuario con sesion, pero la compra solo puede ir a SU nombre.
    @PostMapping
    public ResponseEntity<VentaModel> registrar(@Valid @RequestBody VentaRequest request, HttpServletRequest http) {
        SesionToken sesion = (SesionToken) http.getAttribute(AutenticacionInterceptor.ATRIBUTO_SESION);
        if (sesion == null || !sesion.usuarioId().equals(request.getUsuarioId())) {
            throw new AccesoDenegadoException("Solo puedes registrar compras a tu propio nombre");
        }
        VentaModel creada = ventaService.registrarVenta(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }
}
