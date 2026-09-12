package com.example.demo.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Lo que el cliente manda por cada producto de la venta.
 * A proposito NO incluye precio: el precio siempre se toma
 * del producto en el servidor, nunca de lo que mande el cliente.
 */
public class ItemVentaRequest {

    @NotBlank(message = "El id del producto es obligatorio")
    private String productoId;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;

    public ItemVentaRequest() {
    }

    public String getProductoId() {
        return productoId;
    }

    public void setProductoId(String productoId) {
        this.productoId = productoId;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
