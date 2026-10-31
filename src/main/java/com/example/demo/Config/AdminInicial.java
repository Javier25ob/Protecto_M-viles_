package com.example.demo.Config;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.Models.Rol;
import com.example.demo.Models.UserModel;
import com.example.demo.Repository.UserRepo;

/**
 * Al arrancar, asegura que exista un administrador (el registro publico SIEMPRE crea usuarios USER).
 *
 * Variables de entorno (archivo .env):
 *   ADMIN_EMAIL     correo del administrador.
 *   ADMIN_PASSWORD  solo hace falta si ese correo todavia NO esta registrado (minimo 6 caracteres).
 *
 *  - Si el correo ya existe como usuario, simplemente se le da el rol ADMIN.
 *  - Si no existe y hay ADMIN_PASSWORD, se crea con esa contrasena (guardada con BCrypt).
 *  - Sin ADMIN_EMAIL no se hace nada.
 */
@Component
public class AdminInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminInicial(UserRepo userRepo, PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String email,
            @Value("${app.admin.password:}") String password) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim();
        this.password = password == null ? "" : password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isEmpty()) {
            log.info("ADMIN_EMAIL no esta definido: no se crea ni se promueve ningun administrador.");
            return;
        }
        try {
            Optional<UserModel> existente = userRepo.findByEmailIgnoreCase(email);
            if (existente.isPresent()) {
                UserModel usuario = existente.get();
                if (usuario.getRol() != Rol.ADMIN) {
                    usuario.setRol(Rol.ADMIN);
                    userRepo.save(usuario);
                    log.info("El usuario {} ahora es ADMIN.", email);
                } else {
                    log.info("El usuario {} ya es ADMIN.", email);
                }
                return;
            }
            if (password.length() < 6) {
                log.warn("{} no esta registrado y ADMIN_PASSWORD falta o tiene menos de 6 caracteres: no se crea el administrador.", email);
                return;
            }
            UserModel admin = new UserModel("Administrador", email, passwordEncoder.encode(password), null);
            admin.setRol(Rol.ADMIN);
            userRepo.save(admin);
            log.info("Administrador creado: {}", email);
        } catch (RuntimeException e) {
            // Si la base de datos no responde, la app arranca igual (como antes).
            log.warn("No se pudo preparar el administrador inicial: {}", e.getMessage());
        }
    }
}
