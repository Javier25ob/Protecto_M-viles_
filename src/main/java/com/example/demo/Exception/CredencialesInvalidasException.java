package com.example.demo.Exception;

/**
 * Se lanza cuando el correo o la contrasena del inicio de sesion no coinciden.
 * El GlobalExceptionHandler la traduce a un 401.
 *
 * Siempre lleva el MISMO mensaje, exista o no el correo, para no revelar
 * que correos estan registrados.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException() {
        super("Correo o contrasena incorrectos");
    }
}
