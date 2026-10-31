package com.example.demo.Services;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.Dto.SesionToken;
import com.example.demo.Models.Rol;
import com.example.demo.Models.UserModel;

/**
 * Crea y verifica tokens de sesion firmados (HMAC-SHA256), sin librerias extra.
 *
 * Formato:  base64url("usuarioId|ROL|vence") + "." + base64url(firma)
 * Si alguien cambia una sola letra (por ejemplo el rol), la firma deja de coincidir
 * y el token se rechaza. Dura 12 horas.
 *
 * La clave sale de la variable TOKEN_SECRET. Si no esta definida se genera una al azar
 * cada vez que arranca el servidor (seguro, pero al reiniciar hay que volver a iniciar sesion).
 */
@Service
public class TokenService {

    private static final long DURACION_SEGUNDOS = 12L * 60 * 60;
    private static final String ALGORITMO = "HmacSHA256";
    private static final Base64.Encoder CODIFICADOR = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODIFICADOR = Base64.getUrlDecoder();

    private final byte[] clave;

    public TokenService(@Value("${app.token.secret:}") String secreto) {
        if (secreto == null || secreto.isBlank()) {
            this.clave = new byte[32];
            new SecureRandom().nextBytes(this.clave);
        } else {
            this.clave = secreto.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String crear(UserModel usuario) {
        long vence = Instant.now().getEpochSecond() + DURACION_SEGUNDOS;
        String contenido = usuario.getId() + "|" + usuario.getRol().name() + "|" + vence;
        String parte = CODIFICADOR.encodeToString(contenido.getBytes(StandardCharsets.UTF_8));
        return parte + "." + CODIFICADOR.encodeToString(firmar(parte));
    }

    /** Devuelve la sesion si el token es autentico y no ha vencido; si no, vacio. */
    public Optional<SesionToken> validar(String token) {
        try {
            if (token == null) {
                return Optional.empty();
            }
            String[] partes = token.split("\\.");
            if (partes.length != 2) {
                return Optional.empty();
            }
            byte[] firmaRecibida = DECODIFICADOR.decode(partes[1]);
            if (!MessageDigest.isEqual(firmaRecibida, firmar(partes[0]))) {
                return Optional.empty();
            }
            String contenido = new String(DECODIFICADOR.decode(partes[0]), StandardCharsets.UTF_8);
            String[] datos = contenido.split("\\|");
            if (datos.length != 3) {
                return Optional.empty();
            }
            if (Instant.now().getEpochSecond() > Long.parseLong(datos[2])) {
                return Optional.empty();
            }
            return Optional.of(new SesionToken(datos[0], Rol.valueOf(datos[1])));
        } catch (RuntimeException e) {
            // base64 o numero mal formado, rol desconocido...: simplemente no es un token valido
            return Optional.empty();
        }
    }

    private byte[] firmar(String texto) {
        try {
            Mac mac = Mac.getInstance(ALGORITMO);
            mac.init(new SecretKeySpec(clave, ALGORITMO));
            return mac.doFinal(texto.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo firmar el token", e);
        }
    }
}
