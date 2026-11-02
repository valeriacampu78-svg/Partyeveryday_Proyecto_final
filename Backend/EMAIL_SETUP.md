# Configurar verificación y recuperación por Gmail

El backend envía un enlace opcional de verificación después de crear la cuenta. Puedes iniciar sesión y usar la cuenta sin verificar el correo. Para recuperar la contraseña, envía un código de un solo uso de ocho dígitos; vence en una hora. Los tokens y códigos se guardan en MongoDB como hashes.

## Preparar Gmail

1. Elige la cuenta Gmail que enviará los mensajes de Party Everyday.
2. Activa la verificación en dos pasos de Google para esa cuenta.
3. En la configuración de seguridad de la cuenta Google, crea una **contraseña de aplicación**. Google puede ocultar esta opción en cuentas de trabajo, educativas o con ciertas políticas.
4. En VS Code abre `Backend/.env` (no el archivo `.env.example`).
5. Completa estas líneas con los datos de tu cuenta. Para la contraseña de aplicación, pega los 16 caracteres; puedes omitir los espacios que Google muestra:

   ```env
   GMAIL_USER=tu-correo@gmail.com
   GMAIL_APP_PASSWORD=los-16-caracteres-de-la-app
   FRONTEND_URL=http://localhost:5173
   ```

6. Guarda `.env` y reinicia el backend.

No uses la contraseña normal de Gmail. No compartas la contraseña de aplicación ni la subas a Git.
El backend se inicia con el certificado de confianza del sistema para que Gmail funcione en equipos Windows que inspeccionan conexiones seguras.

## Comportamiento

- Al registrarse, Party Everyday crea la cuenta aunque no se pueda enviar el correo. La verificación es opcional y no bloquea el inicio de sesión ni las citas.
- Si un usuario existente aún no verificó su correo, puede solicitar que se reenvíe el enlace.
- En el inicio de sesión, **¿Olvidaste tu contraseña?** envía un código de ocho dígitos para guardar una contraseña nueva.
- Al agendar una cita, se envía al cliente un correo con la fecha, el tema y el enlace de Zoom. Si falla el envío, administración puede reintentarlo desde el panel.
- En desarrollo local, los enlaces vuelven a `localhost:5173`. Si la web se publica, cambia `FRONTEND_URL` por el dominio público y reinicia el backend.
