package com.example.demo.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.Exception.CredencialesInvalidasException;
import com.example.demo.Models.Rol;
import com.example.demo.Models.UserModel;
import com.example.demo.Repository.UserRepo;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserModel guardarUsuario(UserModel user) {
        if (userRepo.existsByEmailIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario registrado con el email: " + user.getEmail());
        }
        user.setId(null);
        user.setRol(Rol.USER); // el registro publico nunca crea administradores
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    /**
     * Inicio de sesion: busca el usuario por email y compara la contrasena
     * con el hash BCrypt guardado. Si algo no coincide lanza siempre el mismo error.
     */
    public UserModel iniciarSesion(String email, String password) {
        UserModel usuario = userRepo.findByEmailIgnoreCase(email.trim())
                .orElseThrow(CredencialesInvalidasException::new);

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new CredencialesInvalidasException();
        }
        return usuario;
    }
}
