import 'dotenv/config';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 3000;
const databaseName = process.env.MONGODB_DB || 'B1';
const appointmentsDatabaseName = process.env.MONGODB_APPOINTMENTS_DB || 'B2';
const appointmentsCollectionName = process.env.MONGODB_APPOINTMENTS_COLLECTION || 'citas zoom';
const sessionCookieName = 'party_everyday_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const allowedOrigins = (process.env.FRONTEND_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const jwtSecret = process.env.JWT_SECRET;
let databaseConnected = false;
let cachedZoomToken = null;
let cachedZoomTokenExpiresAt = 0;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 bytes');
}

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

function requireAllowedOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }
  return next();
}

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: '7d' });
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionDurationMs,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAppointmentDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:0[9]|1[0-7]):(?:00|30)$/.test(time)) {
    return null;
  }

  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return null;
  }
  return new Date(`${date}T${time}:00-05:00`);
}

function isZoomConfigured() {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

async function getZoomAccessToken() {
  if (!isZoomConfigured()) {
    throw new ApiError(
      503,
      'Zoom aún no está configurado. Faltan las credenciales de Zoom en Backend/.env.'
    );
  }
  if (cachedZoomToken && Date.now() < cachedZoomTokenExpiresAt) return cachedZoomToken;

  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');
  const tokenUrl = new URL('https://zoom.us/oauth/token');
  tokenUrl.searchParams.set('grant_type', 'account_credentials');
  tokenUrl.searchParams.set('account_id', process.env.ZOOM_ACCOUNT_ID);

  const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(15000),
    }).catch(() => {
      throw new ApiError(502, 'No se pudo conectar con Zoom para autenticar la aplicación.');
    });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') {
    throw new ApiError(502, 'Zoom rechazó la autenticación. Revisa las credenciales y permisos de la app.');
  }

  cachedZoomToken = payload.access_token;
  cachedZoomTokenExpiresAt = Date.now() + Math.max(0, (payload.expires_in - 60) * 1000);
  return cachedZoomToken;
}

async function requestZoom(path, options = {}) {
  const token = await getZoomAccessToken();
  const response = await fetch(`https://api.zoom.us/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15000),
  }).catch(() => {
    throw new ApiError(502, 'No se pudo conectar con Zoom para gestionar la reunión.');
  });
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      502,
      'Zoom no pudo completar la operación. Revisa los permisos de la aplicación y la cuenta anfitriona.'
    );
  }
  return payload;
}

function serializeAppointment(appointment) {
  return {
    id: appointment._id.toString(),
    date: appointment.date,
    time: appointment.time,
    topic: appointment.topic,
    status: appointment.status,
    clientName: appointment.clientName,
    clientEmail: appointment.clientEmail,
    zoomJoinUrl: appointment.zoomJoinUrl || null,
    createdAt: appointment.createdAt,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: databaseConnected ? 'connected' : 'disconnected',
    zoomConfigured: isZoomConfigured(),
    message: 'Party Everyday API is running.',
  });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required in Backend/.env');
  }

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  await mongoClient.db(databaseName).command({ ping: 1 });
  databaseConnected = true;

  const users = mongoClient.db(databaseName).collection('usuarios');
  await users.createIndex({ email: 1 }, { unique: true });
  const appointments = mongoClient
    .db(appointmentsDatabaseName)
    .collection(appointmentsCollectionName);
  await appointments.createIndex({ userId: 1, createdAt: -1 });
  await appointments.createIndex({ date: 1, time: 1, status: 1 });
  await appointments.createIndex({ activeSlot: 1 }, { unique: true, sparse: true });

  async function requireSession(req, res, next) {
    const token = req.cookies[sessionCookieName];
    if (!token) {
      return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La sesión expiró. Inicia sesión nuevamente.' });
    }

    if (typeof payload !== 'object' || typeof payload.sub !== 'string' ||
        !/^[a-f\d]{24}$/i.test(payload.sub)) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La sesión no es válida.' });
    }

    const user = await users.findOne({ _id: new ObjectId(payload.sub) });
    if (!user || !['client', 'admin'].includes(user.role)) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La cuenta no está disponible.' });
    }
    req.user = user;
    return next();
  }

  function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Esta acción requiere permisos de administración.' });
    }
    return next();
  }

  app.get('/api/appointments', requireSession, async (req, res) => {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const results = await appointments.find(query).sort({ date: 1, time: 1 }).toArray();
    return res.json({ appointments: results.map(serializeAppointment) });
  });

  app.post(
    '/api/appointments',
    requireAllowedOrigin,
    requireSession,
    async (req, res) => {
      const { date, time } = req.body || {};
      const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
      const startsAt = typeof date === 'string' && typeof time === 'string'
        ? getAppointmentDateTime(date, time)
        : null;

      if (!startsAt || startsAt <= new Date()) {
        return res.status(400).json({
          error: 'Elige una fecha futura y una hora disponible entre 09:00 y 17:00.',
        });
      }
      if (!topic || topic.length > 500) {
        return res.status(400).json({ error: 'Escribe el tema de la cita (máximo 500 caracteres).' });
      }

      const appointment = {
        userId: req.user._id,
        clientName: req.user.name,
        clientEmail: req.user.email,
        date,
        time,
        activeSlot: `${date}T${time}`,
        topic,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        const result = await appointments.insertOne(appointment);
        return res.status(201).json({
          appointment: serializeAppointment({ ...appointment, _id: result.insertedId }),
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(409).json({ error: 'Ese horario ya está reservado. Elige otra hora.' });
        }
        throw error;
      }
    }
  );

  app.patch(
    '/api/appointments/:id/status',
    requireAllowedOrigin,
    requireSession,
    requireAdmin,
    async (req, res) => {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'La cita indicada no es válida.' });
      }
      const { status } = req.body || {};
      if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'El estado solicitado no es válido.' });
      }

      const appointmentId = new ObjectId(req.params.id);
      const current = await appointments.findOne({ _id: appointmentId });
      if (!current) return res.status(404).json({ error: 'No se encontró la cita.' });

      const allowedTransition = (current.status === 'pending' &&
        ['confirmed', 'cancelled'].includes(status)) ||
        (current.status === 'cancelled' && status === 'pending') ||
        (current.status === 'confirmed' && status === 'cancelled');
      if (!allowedTransition) {
        return res.status(409).json({ error: 'La cita ya cambió de estado. Actualiza la página.' });
      }

      if (status === 'confirmed') {
        const startsAt = getAppointmentDateTime(current.date, current.time);
        if (!startsAt || startsAt <= new Date()) {
          return res.status(400).json({ error: 'No se puede confirmar una cita cuya hora ya pasó.' });
        }

        const claimed = await appointments.updateOne(
          { _id: appointmentId, status: 'pending' },
          { $set: { status: 'confirming', updatedAt: new Date() } }
        );
        if (!claimed.modifiedCount) {
          return res.status(409).json({ error: 'La cita ya está siendo procesada. Actualiza la página.' });
        }

        try {
          const zoomUserId = encodeURIComponent(process.env.ZOOM_USER_ID || 'me');
          const meeting = await requestZoom(`/users/${zoomUserId}/meetings`, {
            method: 'POST',
            body: JSON.stringify({
              topic: `Party Everyday: ${current.topic.slice(0, 180)}`,
              type: 2,
              start_time: startsAt.toISOString(),
              duration: 30,
              timezone: 'America/Guayaquil',
              settings: {
                join_before_host: false,
                waiting_room: true,
                host_video: false,
                participant_video: false,
              },
            }),
          });
          if (typeof meeting.join_url !== 'string' || !meeting.id) {
            throw new ApiError(502, 'Zoom no devolvió el enlace de la reunión. Inténtalo nuevamente.');
          }

          await appointments.updateOne(
            { _id: appointmentId, status: 'confirming' },
            {
              $set: {
                status: 'confirmed',
                zoomMeetingId: String(meeting.id),
                zoomJoinUrl: meeting.join_url,
                updatedAt: new Date(),
              },
            }
          );
        } catch (error) {
          await appointments.updateOne(
            { _id: appointmentId, status: 'confirming' },
            { $set: { status: 'pending', updatedAt: new Date() } }
          );
          throw error;
        }
      } else if (status === 'cancelled') {
        const claimed = await appointments.updateOne(
          { _id: appointmentId, status: current.status },
          { $set: { status: 'cancelling', updatedAt: new Date() } }
        );
        if (!claimed.modifiedCount) {
          return res.status(409).json({ error: 'La cita ya está siendo procesada. Actualiza la página.' });
        }

        try {
          if (current.zoomMeetingId) {
            await requestZoom(`/meetings/${encodeURIComponent(current.zoomMeetingId)}`, {
              method: 'DELETE',
            });
          }
          await appointments.updateOne(
            { _id: appointmentId, status: 'cancelling' },
            {
              $set: { status: 'cancelled', updatedAt: new Date() },
              $unset: { zoomMeetingId: '', zoomJoinUrl: '', activeSlot: '' },
            }
          );
        } catch (error) {
          await appointments.updateOne(
            { _id: appointmentId, status: 'cancelling' },
            { $set: { status: current.status, updatedAt: new Date() } }
          );
          throw error;
        }
      } else {
        try {
          const reopened = await appointments.updateOne(
            { _id: appointmentId, status: 'cancelled' },
            {
              $set: {
                status: 'pending',
                activeSlot: `${current.date}T${current.time}`,
                updatedAt: new Date(),
              },
            }
          );
          if (!reopened.modifiedCount) {
            return res.status(409).json({ error: 'La cita ya cambió de estado. Actualiza la página.' });
          }
        } catch (error) {
          if (error.code === 11000) {
            return res.status(409).json({ error: 'Ese horario ya está reservado por otra cita.' });
          }
          throw error;
        }
      }

      const updatedAppointment = await appointments.findOne({ _id: appointmentId });
      return res.json({ appointment: serializeAppointment(updatedAppointment) });
    }
  );

  app.post('/api/auth/register', authRateLimit, requireAllowedOrigin, async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!name || name.length > 80) {
      return res.status(400).json({ error: 'Escribe tu nombre (máximo 80 caracteres).' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Escribe un correo electrónico válido.' });
    }
    if (typeof password !== 'string' || password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const result = await users.insertOne({
        name,
        email,
        passwordHash,
        role: 'client',
        createdAt: new Date(),
      });
      const user = { _id: result.insertedId, name, email, role: 'client' };
      setSessionCookie(res, user);
      return res.status(201).json({ user: safeUser(user) });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
      }
      throw error;
    }
  });

  app.post('/api/auth/login', authRateLimit, requireAllowedOrigin, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!isValidEmail(email) || typeof password !== 'string' ||
        Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const user = await users.findOne({ email });
    const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    if (!['client', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'La cuenta no tiene un rol válido.' });
    }
    if (req.body?.admin === true && user.role !== 'admin') {
      return res.status(403).json({ error: 'Esta cuenta no tiene permisos de administración.' });
    }

    setSessionCookie(res, user);
    return res.json({ user: safeUser(user) });
  });

  app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies[sessionCookieName];
    if (!token) {
      return res.status(401).json({ error: 'No hay una sesión activa.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La sesión expiró. Inicia sesión nuevamente.' });
    }

    if (typeof payload !== 'object' || typeof payload.sub !== 'string' ||
        !/^[a-f\d]{24}$/i.test(payload.sub)) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La sesión no es válida.' });
    }

    const user = await users.findOne({ _id: new ObjectId(payload.sub) });
    if (!user || !['client', 'admin'].includes(user.role)) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'La cuenta no está disponible.' });
    }
    return res.json({ user: safeUser(user) });
  });

  app.post('/api/auth/logout', requireAllowedOrigin, (_req, res) => {
    clearSessionCookie(res);
    return res.json({ message: 'Sesión cerrada.' });
  });

  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: 'El contenido enviado no es JSON válido.' });
    }
    if (error instanceof ApiError) {
      if (error.status >= 500) console.error(error.message);
      return res.status(error.status).json({ error: error.message });
    }
    console.error('API request failed:', error.message);
    return res.status(500).json({ error: 'Ocurrió un error interno. Inténtalo más tarde.' });
  });

  app.listen(port, () => {
    console.log(`Party Everyday API listening on port ${port}`);
    console.log(`MongoDB connection verified for database ${databaseName}.`);
  });
}

startServer().catch((error) => {
  const errorType = error instanceof Error ? error.name : 'Unknown error';
  console.error(`Unable to start the API (${errorType}). Verify the backend configuration and MongoDB access.`);
  process.exitCode = 1;
});
