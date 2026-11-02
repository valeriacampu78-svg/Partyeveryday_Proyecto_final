# Asistente creativo y referencias del cliente

El asistente utiliza Gemini para generar una propuesta estructurada con título, ideas de decoración, tendencias e inspiración, una paleta de cinco colores con códigos HEX, una descripción del estilo y tres frases de búsqueda para Pinterest. No se requiere una credencial ni una aprobación de la API de Pinterest: los enlaces se crean como búsquedas de Pinterest con las frases propuestas por Gemini. Las tendencias se presentan como inspiración y no como datos actuales verificados.

1. Crea una clave en [Google AI Studio](https://aistudio.google.com/apikey).
2. Guárdala en `Backend/.env`:

   ```env
   GEMINI_API_KEY=tu-clave-de-gemini
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

3. Reinicia el backend. El endpoint `/api/health` indica si Gemini está configurado mediante `creativeAssistantConfigured`.

El cliente también puede adjuntar hasta cuatro referencias de imagen al agendar una cita por Zoom. Se aceptan JPG, PNG y WebP, con un máximo de 2 MB por imagen y 6 MB en total. Las imágenes se guardan en GridFS en la base de datos de citas y solo los administradores autenticados pueden abrirlas desde el panel. Si falla la creación de la cita, las imágenes temporales se eliminan.

En producción, sirve el frontend y el backend por HTTPS, configura `FRONTEND_ORIGINS` con el origen exacto del frontend y establece `NODE_ENV=production`. La cookie de sesión se configura para permitir solicitudes autenticadas desde un frontend alojado en otro dominio.

La ficha inspiracional del cliente se guarda con la reserva. Gemini también prepara una guía interna diferente para administración, con resumen operativo, materiales sugeridos, pasos de montaje y preguntas para Zoom. La guía se conserva temporalmente en el servidor durante una hora mientras el cliente agenda; la cita guarda una copia y solo las rutas autenticadas de administración la incluyen en sus respuestas. El contenido interno no se envía al navegador del cliente. El backend limita las consultas creativas a ocho por IP cada 15 minutos.

## Catálogo de servicios

El catálogo está en la colección `B2.servicios` (o en la base indicada por `MONGODB_APPOINTMENTS_DB`). Al iniciar, el backend agrega los tres servicios que ya se muestran en la portada únicamente si todavía no existen; no sobrescribe cambios posteriores. Cada documento usa `slug`, `name`, `description`, `keywords`, `imageKey`, `sortOrder` y `active`. Por ahora los textos son iniciales y no incluyen precios ni paquetes.

Los clientes autenticados consultan los servicios activos en `/api/services`. `/api/service-recommendations` envía a Gemini la descripción del evento y el catálogo activo; la respuesta se valida para aceptar solo un `slug` existente. Al elegir un servicio y reservar, la cita guarda el nombre del servicio elegido para que también lo vea administración. Para editar el catálogo, actualiza sus documentos en MongoDB; al recibir la información definitiva de los servicios se podrán reemplazar estos textos iniciales.
