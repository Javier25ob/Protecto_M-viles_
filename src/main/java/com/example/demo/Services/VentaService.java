package com.example.demo.Services;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Dto.ItemVentaRequest;
import com.example.demo.Dto.ProductoVendidoDto;
import com.example.demo.Dto.ReporteVentasResponse;
import com.example.demo.Dto.VentaRequest;
import com.example.demo.Exception.ResourceNotFoundException;
import com.example.demo.Models.ItemVentaModel;
import com.example.demo.Models.ProductoModel;
import com.example.demo.Models.VentaModel;
import com.example.demo.Repository.ProductoRepo;
import com.example.demo.Repository.UserRepo;
import com.example.demo.Repository.VentaRepo;

@Service
public class VentaService {

    private final VentaRepo ventaRepo;
    private final ProductoRepo productoRepo;
    private final UserRepo userRepo;

    @Autowired
    public VentaService(VentaRepo ventaRepo, ProductoRepo productoRepo, UserRepo userRepo) {
        this.ventaRepo = ventaRepo;
        this.productoRepo = productoRepo;
        this.userRepo = userRepo;
    }

    public List<VentaModel> listarTodas() {
        return ventaRepo.findAll();
    }

    public VentaModel buscarPorId(String id) {
        return ventaRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe una venta con id: " + id));
    }

    public List<VentaModel> listarPorUsuario(String usuarioId) {
        return ventaRepo.findByUsuarioId(usuarioId);
    }

    /**
     * Registra una venta con varios productos.
     * Por cada item: valida que el producto exista, valida que haya stock
     * suficiente, calcula el subtotal con el precio ACTUAL del producto
     * (nunca con lo que mande el cliente) y descuenta el stock.
     *
     * Nota: Mongo Atlas si soporta transacciones multi-documento, pero para
     * mantener el codigo simple no las usamos aqui. Limitacion a tener en
     * cuenta: si algo falla a mitad de una venta con varios productos, el
     * stock de los productos ya procesados quedaria descontado igual.
     */
    public VentaModel registrarVenta(VentaRequest request) {
        if (!userRepo.existsById(request.getUsuarioId())) {
            throw new ResourceNotFoundException("No existe un usuario con id: " + request.getUsuarioId());
        }

        List<ItemVentaModel> items = new ArrayList<>();
        double total = 0.0;

        for (ItemVentaRequest itemReq : request.getItems()) {
            ProductoModel producto = productoRepo.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No existe un producto con id: " + itemReq.getProductoId()));

            if (producto.getStock() < itemReq.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para '" + producto.getNombre()
                                + "'. Disponible: " + producto.getStock());
            }

            double subtotal = producto.getPrecio() * itemReq.getCantidad();

            items.add(new ItemVentaModel(
                    producto.getId(),
                    producto.getNombre(),
                    itemReq.getCantidad(),
                    producto.getPrecio(),
                    subtotal));

            producto.setStock(producto.getStock() - itemReq.getCantidad());
            productoRepo.save(producto);

            total += subtotal;
        }

        VentaModel venta = new VentaModel();
        venta.setUsuarioId(request.getUsuarioId());
        venta.setFecha(Instant.now());
        venta.setItems(items);
        venta.setTotal(total);

        return ventaRepo.save(venta);
    }

    /**
     * Reporte sencillo: total de ventas realizadas, ingresos totales
     * y el top 5 de productos mas vendidos (por cantidad).
     */
    public ReporteVentasResponse generarReporte() {
        List<VentaModel> ventas = ventaRepo.findAll();

        long totalVentas = ventas.size();
        double totalIngresos = ventas.stream().mapToDouble(VentaModel::getTotal).sum();

        Map<String, Integer> cantidadPorProducto = new HashMap<>();
        Map<String, String> nombrePorProducto = new HashMap<>();

        for (VentaModel venta : ventas) {
            for (ItemVentaModel item : venta.getItems()) {
                cantidadPorProducto.merge(item.getProductoId(), item.getCantidad(), Integer::sum);
                nombrePorProducto.put(item.getProductoId(), item.getNombreProducto());
            }
        }

        List<ProductoVendidoDto> productosMasVendidos = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : cantidadPorProducto.entrySet()) {
            productosMasVendidos.add(new ProductoVendidoDto(
                    entry.getKey(),
                    nombrePorProducto.get(entry.getKey()),
                    entry.getValue()));
        }

        productosMasVendidos.sort(Comparator.comparingInt(ProductoVendidoDto::getCantidadVendida).reversed());

        if (productosMasVendidos.size() > 5) {
            productosMasVendidos = productosMasVendidos.subList(0, 5);
        }

        return new ReporteVentasResponse(totalVentas, totalIngresos, productosMasVendidos);
    }
}
