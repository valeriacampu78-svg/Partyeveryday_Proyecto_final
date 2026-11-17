# Party Everyday

Aplicación web para gestión de eventos, cotizaciones, seguimiento de citas, propuestas creativas y dashboard de clientes para Party Everyday.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: MongoDB
- Autenticación: JWT + cookies httpOnly
- Integraciones: Zoom, Gmail, Gemini

## Estructura

- `Frontend/`: aplicación cliente
- `Backend/`: API y lógica de negocio

## Requisitos previos

- Node.js 22.15+
- npm
- MongoDB Atlas o instancia local MongoDB
- Cuenta de Zoom con app OAuth
- Gmail con app password para envío de correos
- API key de Gemini opcional para asistente creativo

## Variables de entorno

1. Copia el archivo de ejemplo del backend:
   - `Backend/.env.example` → `Backend/.env`
2. Ajusta los valores reales según tu entorno.
3. En frontend, crea `Frontend/.env` si necesitas apuntar a otra API:
   - `VITE_API_URL=http://localhost:3000`

Ejemplo mínimo del backend:

```env
PORT=3000
JWT_SECRET=tu_secreto_aleatorio_de_mas_de_32_bytes
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/B1?retryWrites=true&w=majority
MONGODB_DB=B1
MONGODB_APPOINTMENTS_DB=B2
MONGODB_APPOINTMENTS_COLLECTION=citas zoom
FRONTEND_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_USER_ID=me
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
```

## Arranque local

Backend:

```bash
cd Backend
npm install
npm run dev
```

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

La app frontend por defecto apunta a `http://localhost:3000` si no se define `VITE_API_URL`.

## Build de producción

```bash
cd Frontend
npm run build
```

## Publicación

Antes de publicar:

- configurar variables reales en producción
- habilitar HTTPS
- apuntar `FRONTEND_URL` y `FRONTEND_ORIGINS` a tu dominio real
- usar un secreto JWT fuerte
- asignar credenciales reales de Zoom y configurar Gmail o Brevo para el correo
- validar que la base de datos esté accesible desde el servidor desplegado

### Despliegue (Render + Netlify)

Sigue la guía paso a paso en [`DEPLOY.md`](DEPLOY.md): backend en Render (`Backend/`), frontend en Netlify (`Frontend/`, configurado en `netlify.toml`), con `/api/*` reenviado desde Netlify a Render.

## Estado actual

El proyecto compila y queda configurado para desplegar el backend en Render y el frontend en Netlify (ver `DEPLOY.md`).
