package com.example.demo.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.Models.ProductoModel;

public interface ProductoRepo extends MongoRepository<ProductoModel, String> {

    List<ProductoModel> findByCategoriaId(String categoriaId);

    boolean existsByCategoriaId(String categoriaId);
}
