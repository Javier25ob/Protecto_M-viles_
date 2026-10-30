package com.example.demo.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.Models.UserModel;

public interface UserRepo extends MongoRepository<UserModel, String> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<UserModel> findByEmailIgnoreCase(String email);

}
