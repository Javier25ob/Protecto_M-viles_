package com.example.demo.Dto;

import com.example.demo.Models.Rol;
import com.example.demo.Models.UserModel;

/** Respuesta del inicio de sesion: datos del usuario (sin contrasena) mas el token. */
public class SesionResponse {

    private final String id;
    private final String name;
    private final String email;
    private final Rol rol;
    private final String token;

    public SesionResponse(UserModel usuario, String token) {
        this.id = usuario.getId();
        this.name = usuario.getName();
        this.email = usuario.getEmail();
        this.rol = usuario.getRol();
        this.token = token;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Rol getRol() {
        return rol;
    }

    public String getToken() {
        return token;
    }
}
