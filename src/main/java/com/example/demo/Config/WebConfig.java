package com.example.demo.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Pone el guardia de autenticacion delante de toda la API (/api/**). */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AutenticacionInterceptor autenticacion;

    public WebConfig(AutenticacionInterceptor autenticacion) {
        this.autenticacion = autenticacion;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(autenticacion).addPathPatterns("/api/**");
    }
}
