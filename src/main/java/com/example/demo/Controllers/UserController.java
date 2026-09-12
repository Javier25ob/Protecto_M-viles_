package com.example.demo.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Models.UserModel;
import com.example.demo.Services.UserService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


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

    @GetMapping("/usuarios")
    public ResponseEntity<List<UserModel>> listarUsuarios() {
    List<UserModel> usuarios = service.listarUsuarios();

    if (usuarios.isEmpty()) {
        return ResponseEntity.noContent().build();
    }
    return ResponseEntity.ok(usuarios); // 200
}
    
}
