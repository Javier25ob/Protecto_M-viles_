package com.example.demo.Dto;

/** Una fila del reporte: cuantas unidades se vendieron de un producto. */
public class ProductoVendidoDto {

    private String productoId;
    private String nombreProducto;
    private int cantidadVendida;

    public ProductoVendidoDto(String productoId, String nombreProducto, int cantidadVendida) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidadVendida = cantidadVendida;
    }

    public String getProductoId() {
        return productoId;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public int getCantidadVendida() {
        return cantidadVendida;
    }
}
