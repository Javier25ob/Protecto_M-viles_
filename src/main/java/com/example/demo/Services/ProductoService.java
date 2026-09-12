package com.example.demo.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Exception.ResourceNotFoundException;
import com.example.demo.Models.ProductoModel;
import com.example.demo.Repository.CategoriaRepo;
import com.example.demo.Repository.ProductoRepo;

@Service
public class ProductoService {

    private final ProductoRepo productoRepo;
    private final CategoriaRepo categoriaRepo;

    @Autowired
    public ProductoService(ProductoRepo productoRepo, CategoriaRepo categoriaRepo) {
        this.productoRepo = productoRepo;
        this.categoriaRepo = categoriaRepo;
    }

    public List<ProductoModel> listarTodos() {
        return productoRepo.findAll();
    }

    public List<ProductoModel> listarPorCategoria(String categoriaId) {
        validarCategoriaExiste(categoriaId);
        return productoRepo.findByCategoriaId(categoriaId);
    }

    public ProductoModel buscarPorId(String id) {
        return productoRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un producto con id: " + id));
    }

    public ProductoModel crear(ProductoModel producto) {
        validarCategoriaExiste(producto.getCategoriaId());
        producto.setId(null);
        return productoRepo.save(producto);
    }

    public ProductoModel actualizar(String id, ProductoModel datos) {
        ProductoModel existente = buscarPorId(id);
        validarCategoriaExiste(datos.getCategoriaId());

        existente.setNombre(datos.getNombre());
        existente.setDescripcion(datos.getDescripcion());
        existente.setPrecio(datos.getPrecio());
        existente.setCategoriaId(datos.getCategoriaId());
        existente.setMarca(datos.getMarca());
        existente.setImagenUrl(datos.getImagenUrl());
        existente.setStock(datos.getStock());
        existente.setStockMinimo(datos.getStockMinimo());
        existente.setEstado(datos.getEstado());

        return productoRepo.save(existente);
    }

    public void eliminar(String id) {
        ProductoModel existente = buscarPorId(id);
        productoRepo.delete(existente);
    }

    private void validarCategoriaExiste(String categoriaId) {
        if (categoriaId == null || !categoriaRepo.existsById(categoriaId)) {
            throw new IllegalArgumentException("No existe una categoria con id: " + categoriaId);
        }
    }
}
