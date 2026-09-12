package com.example.demo.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    public List<UserModel> listarUsuarios() {
        return userRepo.findAll();
    }
}
