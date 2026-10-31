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
const sessionCookieName = 'party_everyday_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const allowedOrigins = (process.env.FRONTEND_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const jwtSecret = process.env.JWT_SECRET;
let databaseConnected = false;

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

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: databaseConnected ? 'connected' : 'disconnected',
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
