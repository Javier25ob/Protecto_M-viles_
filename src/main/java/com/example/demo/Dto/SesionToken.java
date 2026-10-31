package com.example.demo.Dto;

import com.example.demo.Models.Rol;

/** Lo que dice un token valido: de que usuario es y con que rol. */
public record SesionToken(String usuarioId, Rol rol) {

    public boolean esAdmin() {
        return rol == Rol.ADMIN;
    }
}
