package com.example.demo.Dto;

import java.util.List;

public class ReporteVentasResponse {

    private long totalVentas;
    private double totalIngresos;
    private List<ProductoVendidoDto> productosMasVendidos;

    public ReporteVentasResponse(long totalVentas, double totalIngresos,
                                  List<ProductoVendidoDto> productosMasVendidos) {
        this.totalVentas = totalVentas;
        this.totalIngresos = totalIngresos;
        this.productosMasVendidos = productosMasVendidos;
    }

    public long getTotalVentas() {
        return totalVentas;
    }

    public double getTotalIngresos() {
        return totalIngresos;
    }

    public List<ProductoVendidoDto> getProductosMasVendidos() {
        return productosMasVendidos;
    }
}
