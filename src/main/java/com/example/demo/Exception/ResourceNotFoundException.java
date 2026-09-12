package com.example.demo.Exception;

/**
 * Se lanza cuando se busca un recurso (por id, por ejemplo) y no existe.
 * El GlobalExceptionHandler la traduce a un 404 con un mensaje claro.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }
}
