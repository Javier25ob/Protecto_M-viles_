package com.example.demo;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class HolaControlador {

    @GetMapping("/api/saludo")
    public String saludo() {
        return "Hola, MyOrbit API en funcionamiento";
    }

    // OJO: aqui antes habia un @GetMapping("/") con un texto de prueba. Se quito a proposito:
    // ahora la ruta "/" la responde la app web (src/main/resources/static/index.html).
}
