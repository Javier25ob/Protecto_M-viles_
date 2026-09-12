package com.example.demo.Dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public class VentaRequest {

    @NotBlank(message = "El id del usuario es obligatorio")
    private String usuarioId;

    @NotEmpty(message = "La venta debe tener al menos un producto")
    @Valid
    private List<ItemVentaRequest> items;

    public VentaRequest() {
    }

    public String getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(String usuarioId) {
        this.usuarioId = usuarioId;
    }

    public List<ItemVentaRequest> getItems() {
        return items;
    }

    public void setItems(List<ItemVentaRequest> items) {
        this.items = items;
    }
}
