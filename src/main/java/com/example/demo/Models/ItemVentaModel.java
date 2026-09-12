package com.example.demo.Models;

/**
 * Un renglon dentro de una venta (producto + cantidad + precio en ese momento).
 * Se guarda EMBEBIDO dentro de VentaModel, no en una coleccion aparte:
 * en Mongo no hace falta una tabla de detalle si el detalle siempre se
 * lee/escribe junto con su venta.
 */
public class ItemVentaModel {

    private String productoId;
    private String nombreProducto;
    private Integer cantidad;
    private Double precioUnitario;
    private Double subtotal;

    public ItemVentaModel() {
    }

    public ItemVentaModel(String productoId, String nombreProducto, Integer cantidad,
                           Double precioUnitario, Double subtotal) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
    }

    public String getProductoId() {
        return productoId;
    }

    public void setProductoId(String productoId) {
        this.productoId = productoId;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(Double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }
}
