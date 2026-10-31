# Configurar las reuniones de Zoom

Las cuentas de cliente y sus contraseñas siguen en `B1.usuarios`. Las solicitudes se guardan por separado en `B2.citas zoom`.

## Conectar Zoom

1. Entra a [Zoom App Marketplace](https://marketplace.zoom.us/) con la cuenta de Zoom que será anfitriona de las reuniones.
2. Crea una aplicación **Server-to-Server OAuth**, agrega el permiso para crear y eliminar reuniones (`meeting:write:meeting:admin`) y activa la aplicación.
3. En los datos de la aplicación copia **Account ID**, **Client ID** y **Client Secret**.
4. Abre `Backend/.env` en tu computadora y completa `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` y `ZOOM_CLIENT_SECRET`. No compartas esos valores en el chat ni los agregues a Git.
5. En `ZOOM_USER_ID` deja `me` para usar el usuario anfitrión de la cuenta, o escribe el correo del anfitrión si Zoom no reconoce `me`.
6. Guarda el archivo y reinicia el backend.

El endpoint `/api/health` mostrará `zoomConfigured: true` cuando estén presentes las tres credenciales. Al confirmar una solicitud desde administración, el backend crea una reunión de 30 minutos y guarda su enlace en `B2.citas zoom`. El cliente y administración podrán abrir el enlace desde sus paneles. Este flujo no envía correos de invitación.

Si una solicitud se cancela después de confirmar, también se cancela la reunión de Zoom. Si Zoom rechaza una operación, la cita conserva su estado anterior y el panel muestra el error.
