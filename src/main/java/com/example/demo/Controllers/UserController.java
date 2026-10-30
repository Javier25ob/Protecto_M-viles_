package com.example.demo.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Dto.LoginRequest;
import com.example.demo.Models.UserModel;
import com.example.demo.Services.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService service;

    @PostMapping("/usuarios")
    public ResponseEntity<UserModel> guardarUsuario(@Valid @RequestBody UserModel usuario) {
        UserModel creado = service.guardarUsuario(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /**
     * Inicio de sesion. Devuelve los datos del usuario (sin contrasena: el campo
     * password es solo de escritura). Credenciales incorrectas -> 401.
     */
    @PostMapping("/usuarios/login")
    public UserModel iniciarSesion(@Valid @RequestBody LoginRequest request) {
        return service.iniciarSesion(request.getEmail(), request.getPassword());
    }
}
