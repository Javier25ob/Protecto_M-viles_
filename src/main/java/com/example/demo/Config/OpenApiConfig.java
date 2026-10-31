package com.example.demo.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

/**
 * Metadata que aparece arriba de la pagina de Swagger UI (titulo, descripcion, version)
 * y el boton "Authorize" para pegar el token que devuelve POST /api/usuarios/login
 * (asi se pueden probar desde Swagger los endpoints de administrador).
 */
@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA = "bearerAuth";

    @Bean
    public OpenAPI apiInfo() {
        return new OpenAPI()
                .info(new Info()
                        .title("API - Deposito de Suministros Dentales")
                        .description("API REST para gestionar categorias, productos, usuarios y ventas "
                                + "de un deposito/comercializadora de suministros para laboratorios dentales. "
                                + "Roles: ADMIN (gestiona productos y ve reportes) y USER (compra y ve sus compras). "
                                + "Inicia sesion en POST /api/usuarios/login y pega el token en Authorize.")
                        .version("1.0.0"))
                .components(new Components()
                        .addSecuritySchemes(ESQUEMA, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("token")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA));
    }
}
