package com.example.demo.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.Models.CategoriaModel;

public interface CategoriaRepo extends MongoRepository<CategoriaModel, String> {

    boolean existsByNombreIgnoreCase(String nombre);
}
