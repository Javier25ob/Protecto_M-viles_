package com.example.demo.Exception;

/** Falta el token, es invalido o ya vencio. El GlobalExceptionHandler la traduce a un 401. */
public class NoAutenticadoException extends RuntimeException {

    public NoAutenticadoException(String mensaje) {
        super(mensaje);
    }
}
