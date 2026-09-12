package com.example.demo.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Exception.ResourceNotFoundException;
import com.example.demo.Models.CategoriaModel;
import com.example.demo.Repository.CategoriaRepo;
import com.example.demo.Repository.ProductoRepo;

@Service
public class CategoriaService {

    private final CategoriaRepo categoriaRepo;
    private final ProductoRepo productoRepo;

    @Autowired
    public CategoriaService(CategoriaRepo categoriaRepo, ProductoRepo productoRepo) {
        this.categoriaRepo = categoriaRepo;
        this.productoRepo = productoRepo;
    }

    public List<CategoriaModel> listarTodas() {
        return categoriaRepo.findAll();
    }

    public CategoriaModel buscarPorId(String id) {
        return categoriaRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe una categoria con id: " + id));
    }

    public CategoriaModel crear(CategoriaModel categoria) {
        if (categoriaRepo.existsByNombreIgnoreCase(categoria.getNombre())) {
            throw new IllegalArgumentException("Ya existe una categoria con el nombre: " + categoria.getNombre());
        }
        categoria.setId(null); // por si el cliente manda un id, lo ignoramos al crear
        return categoriaRepo.save(categoria);
    }

    public CategoriaModel actualizar(String id, CategoriaModel datos) {
        CategoriaModel existente = buscarPorId(id);
        existente.setNombre(datos.getNombre());
        existente.setDescripcion(datos.getDescripcion());
        return categoriaRepo.save(existente);
    }

    public void eliminar(String id) {
        CategoriaModel existente = buscarPorId(id);
        if (productoRepo.existsByCategoriaId(id)) {
            throw new IllegalArgumentException(
                    "No se puede eliminar la categoria '" + existente.getNombre()
                            + "' porque tiene productos asociados");
        }
        categoriaRepo.delete(existente);
    }
}
