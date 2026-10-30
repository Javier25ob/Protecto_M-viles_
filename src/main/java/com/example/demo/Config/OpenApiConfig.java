package com.example.demo.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

/**
 * Metadata que aparece arriba de la pagina de Swagger UI
 * (titulo, descripcion, version). No afecta el funcionamiento
 * de los endpoints, solo la presentacion de la documentacion.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiInfo() {
        return new OpenAPI()
                .info(new Info()
                        .title("API - Deposito de Suministros Dentales")
                        .description("API REST para gestionar categorias, productos, usuarios y ventas "
                                + "de un deposito/comercializadora de suministros para laboratorios dentales.")
                        .version("1.0.0"));
    }
}
