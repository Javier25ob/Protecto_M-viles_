package com.example.demo.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.Models.VentaModel;

public interface VentaRepo extends MongoRepository<VentaModel, String> {

    List<VentaModel> findByUsuarioId(String usuarioId);
}
