package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class HolaControlador {

    @GetMapping("/api/saludo")
    public String saludo() {
        return "Hola, MyOrbit API en funcionamiento";
    }

    @GetMapping("/")
    public String paginaPrincipal(){
        return "Hola, esta es la pagina principal";
    }

}