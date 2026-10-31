package com.example.demo.Exception;

/** El usuario inicio sesion pero su rol no le permite esta accion. Se traduce a un 403. */
public class AccesoDenegadoException extends RuntimeException {

    public AccesoDenegadoException(String mensaje) {
        super(mensaje);
    }
}
