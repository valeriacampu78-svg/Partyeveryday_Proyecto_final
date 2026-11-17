# Publicar Party Everyday (Render + Netlify)

- **Backend (API)** → Render, carpeta `Backend/`
- **Frontend (React)** → Netlify, carpeta `Frontend/` (configurado en `netlify.toml`)
- Netlify reenvía `/api/*` al backend de Render, así el navegador ve un solo dominio
  y las cookies de sesión funcionan en todos los navegadores (incluido Safari/iPhone).

## 0. Antes de empezar

1. Sube todos los cambios a GitHub.
   El archivo `Backend/.env` **no** se sube (está en `.gitignore`); sus valores se ponen en Render.
2. **MongoDB Atlas** → *Network Access*. Render gratis no tiene IP fija, por lo que `0.0.0.0/0` es una opción de conectividad, pero permite conexiones desde cualquier IP. Si la usas, crea un usuario de base de datos dedicado con permisos mínimos y una contraseña aleatoria fuerte.
3. **Correo (Brevo)**: Render gratis bloquea SMTP, así que Gmail SMTP no envía desde allí.
   - Crea una cuenta gratis en Brevo.
   - *Senders, Domains & Dedicated IPs* → *Senders* → agrega y verifica el correo remitente.
   - *SMTP & API* → *API Keys* → *Generate a new API key*. Guárdala.

## 1. Backend en Render

1. En Render, elige **New +** → **Web Service** y conecta el repositorio.
2. Configuración:
   | Campo | Valor |
   |---|---|
   | Name | `partyeveryday-api` |
   | Region | Virginia (US East) |
   | Root Directory | `Backend` |
   | Runtime | Node |
   | Build Command | `npm ci` |
   | Start Command | `npm start` |
   | Instance Type | Free |
3. Configura las variables de entorno (no incluyas `PORT`):
   ```env
   NODE_ENV=production
   MONGODB_URI=...
   MONGODB_DB=B1
   MONGODB_APPOINTMENTS_DB=B2
   MONGODB_APPOINTMENTS_COLLECTION=citas zoom
   JWT_SECRET=...
   ZOOM_ACCOUNT_ID=...
   ZOOM_CLIENT_ID=...
   ZOOM_CLIENT_SECRET=...
   ZOOM_USER_ID=me
   GMAIL_USER=...
   GEMINI_API_KEY=...
   GEMINI_MODEL=...
   BREVO_API_KEY=...
   BREVO_SENDER_EMAIL=correo-verificado-en-brevo@gmail.com
   FRONTEND_URL=https://TU-SITIO.netlify.app
   FRONTEND_ORIGINS=https://TU-SITIO.netlify.app
   ```
4. En *Advanced* → **Health Check Path**, usa `/api/health`.
5. Despliega y verifica que la URL de Render seguida de `/api/health` responda correctamente.

## 2. Frontend en Netlify

1. Si la URL de Render no es `https://partyeveryday-api.onrender.com`, actualiza el destino `/api/*` en `netlify.toml`.
2. En Netlify, importa el repositorio. La configuración de `netlify.toml` establece la base `Frontend`, el build `npm run build` y la carpeta publicada `dist`.
3. No agregues `VITE_API_URL` en producción.
4. En Render, ajusta `FRONTEND_URL` y `FRONTEND_ORIGINS` con la URL exacta de Netlify, sin `/` al final, y vuelve a desplegar.

## 3. Probar

- Registra una cuenta, inicia sesión y recarga la página para confirmar que la sesión persiste.
- Agenda una cita y prueba el asistente creativo.
- Si algo falla, revisa los logs del servicio en Render.

## Notas

- Render gratis se duerme tras un periodo sin uso; la primera petición puede tardar.
- Si cambias de dominio, actualiza `FRONTEND_URL`, `FRONTEND_ORIGINS` y el destino del proxy en `netlify.toml`.
