import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import { GridFSBucket, MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import nodemailer from 'nodemailer';

const app = express();
const port = process.env.PORT || 3000;
const databaseName = process.env.MONGODB_DB || 'B1';
const appointmentsDatabaseName = process.env.MONGODB_APPOINTMENTS_DB || 'B2';
const appointmentsCollectionName = process.env.MONGODB_APPOINTMENTS_COLLECTION || 'citas zoom';
const sessionCookieName = 'party_everyday_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const sessionCookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const allowedOrigins = (process.env.FRONTEND_ORIGINS ||
  'http://localhost:5173')
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
app.use((req, res, next) => {
  const isAppointmentUpload = req.method === 'POST' && req.path === '/api/appointments';
  return express.json({ limit: isAppointmentUpload ? '9mb' : '10kb' })(req, res, next);
});
app.use(cookieParser());

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de recuperación. Espera unos minutos e inténtalo de nuevo.' },
});

const creativeAssistantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Has usado varias consultas creativas. Espera unos minutos e inténtalo de nuevo.' },
});

const serviceRecommendationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Has usado varias recomendaciones. Espera unos minutos e inténtalo de nuevo.' },
});

const initialServices = [
  {
    slug: 'decoracion-con-globos',
    name: 'Decoración con globos',
    description: 'Arcos, fondos y rincones llenos de color para celebrar a lo grande.',
    keywords: ['arcos', 'fondos', 'rincones', 'globos'],
    imageKey: 'balloons',
    sortOrder: 1,
    active: true,
  },
  {
    slug: 'mesas-dulces-pasteleria',
    name: 'Mesas de dulces y pastelería',
    description: 'Un rincón delicioso con detalles pensados para sorprender a todos.',
    keywords: ['dulces', 'pastelería', 'mesa de postres'],
    imageKey: 'sweets',
    sortOrder: 2,
    active: true,
  },
  {
    slug: 'diseno-mesas-florales',
    name: 'Diseño de mesas y florales',
    description: 'Mesas especiales, flores y pequeños detalles que crean el ambiente.',
    keywords: ['mesas', 'flores', 'detalles', 'ambiente'],
    imageKey: 'florals',
    sortOrder: 3,
    active: true,
  },
];

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
    sameSite: sessionCookieSameSite,
    maxAge: sessionDurationMs,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: sessionCookieSameSite,
    path: '/',
  });
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function isCreativeAssistantConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function normalizeAdminBrief(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const normalizeItems = (items, maxItems, maxLength) => (
    Array.isArray(items)
      ? items
        .filter((item) => typeof item === 'string' && item.trim())
        .slice(0, maxItems)
        .map((item) => item.trim().slice(0, maxLength))
      : []
  );
  const summary = typeof value.summary === 'string' ? value.summary.trim().slice(0, 1000) : '';
  const materials = normalizeItems(value.materials, 6, 180);
  const setupSteps = normalizeItems(value.setupSteps, 5, 240);
  const zoomQuestions = normalizeItems(value.zoomQuestions, 5, 240);
  if (!summary || materials.length < 2 || setupSteps.length < 2 || zoomQuestions.length < 2) {
    return null;
  }
  return { summary, materials, setupSteps, zoomQuestions };
}

function normalizeCreativeProposal(value, { includeAdminBrief = false } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const query = typeof value.query === 'string' ? value.query.trim() : '';
  const answer = typeof value.answer === 'string' ? value.answer.trim() : '';
  if (!query || query.length > 500 || !answer || answer.length > 8000) return null;
  const title = typeof value.title === 'string' ? value.title.trim().slice(0, 120) : '';
  const style = typeof value.style === 'string' ? value.style.trim().slice(0, 1000) : '';
  const ideas = Array.isArray(value.ideas)
    ? value.ideas
      .filter((idea) => typeof idea === 'string' && idea.trim())
      .slice(0, 4)
      .map((idea) => idea.trim().slice(0, 300))
    : [];
  const trends = Array.isArray(value.trends)
    ? value.trends
      .filter((trend) => typeof trend === 'string' && trend.trim())
      .slice(0, 4)
      .map((trend) => trend.trim().slice(0, 300))
    : [];
  const palette = Array.isArray(value.palette)
    ? value.palette
      .filter((color) => (
        color && typeof color === 'object' &&
        typeof color.name === 'string' &&
        color.name.trim() &&
        typeof color.hex === 'string' &&
        /^#[a-f\d]{6}$/i.test(color.hex)
      ))
      .slice(0, 5)
      .map((color) => ({
        name: color.name.trim().slice(0, 40),
        hex: color.hex.toUpperCase(),
      }))
    : [];

  const links = Array.isArray(value.links)
    ? value.links.slice(0, 3).flatMap((link) => {
      if (!link || typeof link !== 'object' || typeof link.query !== 'string') return [];
      const searchQuery = link.query.trim();
      if (!searchQuery || searchQuery.length > 200) return [];
      return [{
        title: typeof link.title === 'string' ? link.title.trim().slice(0, 120) : searchQuery,
        query: searchQuery,
        url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(searchQuery)}`,
      }];
    })
    : [];

  const proposal = {
    query,
    answer,
    title,
    ideas,
    trends,
    palette,
    style,
    links,
  };
  if (includeAdminBrief) {
    const adminBrief = normalizeAdminBrief(value.adminBrief);
    if (adminBrief) proposal.adminBrief = adminBrief;
  }
  return proposal;
}

function normalizeIdeaImages(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 4) return null;

  let totalSize = 0;
  const images = [];
  for (const image of value) {
    if (!image || typeof image !== 'object' ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType) ||
        typeof image.fileName !== 'string' ||
        typeof image.data !== 'string' ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(image.data)) {
      return null;
    }

    const buffer = Buffer.from(image.data, 'base64');
    if (!buffer.length || buffer.length > 2 * 1024 * 1024 ||
        buffer.toString('base64') !== image.data) {
      return null;
    }
    const matchesMimeType = image.mimeType === 'image/jpeg'
      ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : image.mimeType === 'image/png'
        ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!matchesMimeType) return null;

    totalSize += buffer.length;
    if (totalSize > 6 * 1024 * 1024) return null;

    const fileName = image.fileName
      .replace(/[^\w.-]/g, '_')
      .slice(0, 100) || 'referencia-evento';
    images.push({
      fileName,
      mimeType: image.mimeType,
      buffer,
    });
  }
  return images;
}

function saveAppointmentIdeaImage(bucket, image, appointmentId) {
  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(image.fileName, {
      metadata: {
        appointmentId: appointmentId.toString(),
        contentType: image.mimeType,
      },
    });
    upload.once('error', reject);
    upload.once('finish', () => resolve({
      id: upload.id,
      fileName: image.fileName,
      mimeType: image.mimeType,
      size: image.buffer.length,
    }));
    upload.end(image.buffer);
  });
}

function createEmailTransport() {
  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      'El correo aún no está configurado. Completa GMAIL_USER y GMAIL_APP_PASSWORD en Backend/.env.'
    );
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ''),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

function createEmailToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).digest('hex'),
  };
}

async function sendAccountEmail({ to, subject, text, html }) {
  const transport = createEmailTransport();
  try {
    await transport.sendMail({
      from: `"Party Everyday" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch {
    throw new ApiError(
      502,
      'No se pudo enviar el correo. Revisa la cuenta Gmail y su contraseña de aplicación.'
    );
  } finally {
    transport.close();
  }
}

async function sendVerificationEmail(user, token) {
  const link = `${frontendUrl}/?verifyEmail=${encodeURIComponent(token)}`;
  await sendAccountEmail({
    to: user.email,
    subject: 'Verifica tu correo - Party Everyday',
    text: `Hola ${user.name}, confirma tu correo abriendo este enlace: ${link}\n\nEl enlace vence en 24 horas.`,
    html: `<p>Hola ${escapeHtml(user.name)},</p><p>Confirma tu correo para activar tu cuenta:</p><p><a href="${link}">Verificar mi correo</a></p><p>El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</p>`,
  });
}

async function sendPasswordResetEmail(user, code) {
  await sendAccountEmail({
    to: user.email,
    subject: 'Recupera tu contraseña - Party Everyday',
    text: `PARTY EVERYDAY\n\nHola ${user.name},\n\nRecibimos una solicitud para cambiar la contraseña de tu cuenta. Escribe este código en la página para continuar:\n\n${code}\n\nEl código vence en una hora y solo puede usarse una vez. Si no solicitaste el cambio, ignora este mensaje.`,
    html: `
      <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
        Tu código para recuperar la contraseña está listo. Vence en una hora.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:32px 12px;background-color:#fff7f8;font-family:Arial,Helvetica,sans-serif">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #f4dce3;border-radius:20px;overflow:hidden">
              <tr>
                <td align="center" style="padding:30px 24px;background-color:#fce8ed">
                  <p style="margin:0;color:#a84968;font-size:12px;font-weight:bold;letter-spacing:3px">PARTY EVERYDAY</p>
                  <p style="margin:12px 0 0;color:#623b4b;font-size:25px;line-height:1.3;font-weight:bold">Un nuevo comienzo ✨</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 32px 36px">
                  <p style="margin:0 0 12px;color:#342b30;font-size:17px">Hola ${escapeHtml(user.name)},</p>
                  <p style="margin:0 0 24px;color:#62575d;font-size:15px;line-height:1.7">Recibimos una solicitud para cambiar la contraseña de tu cuenta. Usa este código para continuar:</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding:20px 12px;background-color:#fff4f6;border:1px solid #f2d5de;border-radius:14px">
                        <p style="margin:0 0 8px;color:#98727f;font-size:11px;font-weight:bold;letter-spacing:2px">TU CÓDIGO DE RECUPERACIÓN</p>
                        <p style="margin:0;color:#a84968;font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:8px">${code}</p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:24px 0 0;color:#62575d;font-size:14px;line-height:1.7">El código vence en <strong>una hora</strong> y solo puede usarse una vez.</p>
                  <p style="margin:16px 0 0;color:#887d82;font-size:13px;line-height:1.7">Si no solicitaste cambiar tu contraseña, puedes ignorar este mensaje; tu cuenta seguirá protegida.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 24px;background-color:#fcf8f9;border-top:1px solid #f4e8ec">
                  <p style="margin:0;color:#9b8d93;font-size:12px">Con cariño, el equipo de Party Everyday</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`,
  });
}

async function sendZoomMeetingEmail(appointment) {
  const startsAt = getAppointmentDateTime(appointment.date, appointment.time);
  const meetingDate = new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'long',
    timeZone: 'America/Guayaquil',
  }).format(startsAt);
  const joinUrl = appointment.zoomJoinUrl;
  await sendAccountEmail({
    to: appointment.clientEmail,
    subject: 'Tu cita está confirmada - Party Everyday',
    text: `Hola ${appointment.clientName},\n\nTu reunión de Party Everyday está confirmada.\n\nFecha: ${meetingDate}\nHora: ${appointment.time} (Ecuador)\nTema: ${appointment.topic}\n\nEntra a tu reunión de Zoom con este enlace:\n${joinUrl}\n\nTe esperamos.\nParty Everyday`,
    html: `
      <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
        Tu reunión de Party Everyday está confirmada. Aquí tienes la fecha y el enlace de Zoom.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:32px 12px;background-color:#fff7f8;font-family:Arial,Helvetica,sans-serif">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #f4dce3;border-radius:20px;overflow:hidden">
              <tr>
                <td align="center" style="padding:30px 24px;background-color:#fce8ed">
                  <p style="margin:0;color:#a84968;font-size:12px;font-weight:bold;letter-spacing:3px">PARTY EVERYDAY</p>
                  <p style="margin:12px 0 0;color:#623b4b;font-size:25px;line-height:1.3;font-weight:bold">¡Tu cita está confirmada! ✨</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px">
                  <p style="margin:0 0 12px;color:#342b30;font-size:17px">Hola ${escapeHtml(appointment.clientName)},</p>
                  <p style="margin:0 0 24px;color:#62575d;font-size:15px;line-height:1.7">Ya está todo listo para conversar sobre tu celebración. Guarda los detalles de tu reunión:</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8f9;border:1px solid #f2dfe5;border-radius:14px">
                    <tr><td style="padding:18px 20px;color:#62575d;font-size:14px;line-height:1.8">
                      <strong style="color:#a84968">Fecha:</strong> ${escapeHtml(meetingDate)}<br>
                      <strong style="color:#a84968">Hora:</strong> ${escapeHtml(appointment.time)} (Ecuador)<br>
                      <strong style="color:#a84968">Tema:</strong> ${escapeHtml(appointment.topic)}
                    </td></tr>
                  </table>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto">
                    <tr><td align="center" bgcolor="#b95878" style="border-radius:999px">
                      <a href="${escapeHtml(joinUrl)}" style="display:inline-block;padding:15px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:999px">Entrar a la reunión de Zoom</a>
                    </td></tr>
                  </table>
                  <p style="margin:0;color:#887d82;font-size:12px;line-height:1.7;overflow-wrap:anywhere">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${escapeHtml(joinUrl)}" style="color:#a84968">${escapeHtml(joinUrl)}</a></p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 24px;background-color:#fcf8f9;border-top:1px solid #f4e8ec">
                  <p style="margin:0;color:#9b8d93;font-size:12px">Con cariño, el equipo de Party Everyday</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`,
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
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

function serializeAppointment(appointment, { includeAdminBrief = false } = {}) {
  const serialized = {
    id: appointment._id.toString(),
    date: appointment.date,
    time: appointment.time,
    topic: appointment.topic,
    serviceName: appointment.serviceName || null,
    creativeProposal: normalizeCreativeProposal(appointment.creativeProposal),
    ideaImages: Array.isArray(appointment.ideaImages)
      ? appointment.ideaImages.map((image) => ({
        id: image.id.toString(),
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
      }))
      : [],
    status: appointment.status,
    clientName: appointment.clientName,
    clientEmail: appointment.clientEmail,
    zoomJoinUrl: appointment.zoomJoinUrl || null,
    zoomEmailSent: Boolean(appointment.zoomEmailSentAt),
    zoomEmailFailed: Boolean(appointment.zoomEmailFailed),
    createdAt: appointment.createdAt,
  };
  if (includeAdminBrief) {
    serialized.adminBrief = normalizeAdminBrief(appointment.adminBrief);
  }
  return serialized;
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: databaseConnected ? 'connected' : 'disconnected',
    zoomConfigured: isZoomConfigured(),
    emailConfigured: isEmailConfigured(),
    creativeAssistantConfigured: isCreativeAssistantConfigured(),
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
  const creativeProposalBriefs = mongoClient
    .db(appointmentsDatabaseName)
    .collection('creativeProposalBriefs');
  const services = mongoClient
    .db(appointmentsDatabaseName)
    .collection('servicios');
  const appointmentIdeaImages = new GridFSBucket(
    mongoClient.db(appointmentsDatabaseName),
    { bucketName: 'appointmentIdeaImages' }
  );
  await appointments.createIndex({ userId: 1, createdAt: -1 });
  await appointments.createIndex({ date: 1, time: 1, status: 1 });
  await appointments.createIndex({ activeSlot: 1 }, { unique: true, sparse: true });
  await creativeProposalBriefs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await services.createIndex({ slug: 1 }, { unique: true });
  await services.createIndex({ active: 1, sortOrder: 1 });
  await Promise.all(initialServices.map((service) => services.updateOne(
    { slug: service.slug },
    { $setOnInsert: { ...service, createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true }
  )));

  async function deliverZoomEmail(appointment) {
    if (appointment.zoomEmailSentAt) return true;
    const claimed = await appointments.updateOne(
      {
        _id: appointment._id,
        status: 'confirmed',
        zoomJoinUrl: { $exists: true },
        zoomEmailSentAt: { $exists: false },
        $or: [
          { zoomEmailSendingAt: { $exists: false } },
          { zoomEmailSendingAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
        ],
      },
      {
        $set: { zoomEmailSendingAt: new Date() },
        $unset: { zoomEmailFailed: '' },
      }
    );
    if (!claimed.modifiedCount) {
      const current = await appointments.findOne({ _id: appointment._id });
      return Boolean(current?.zoomEmailSentAt);
    }

    try {
      await sendZoomMeetingEmail(appointment);
      await appointments.updateOne(
        { _id: appointment._id, status: 'confirmed' },
        {
          $set: { zoomEmailSentAt: new Date() },
          $unset: { zoomEmailSendingAt: '', zoomEmailFailed: '' },
        }
      );
      return true;
    } catch (error) {
      await appointments.updateOne(
        { _id: appointment._id, status: 'confirmed' },
        {
          $set: { zoomEmailFailed: true },
          $unset: { zoomEmailSendingAt: '' },
        }
      );
      console.error('Zoom meeting email delivery failed:', error.message);
      return false;
    }
  }

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

  app.get('/api/services', requireSession, async (_req, res) => {
    const catalog = await services.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .project({ _id: 0, slug: 1, name: 1, description: 1, imageKey: 1 })
      .toArray();
    return res.json({ services: catalog });
  });

  app.post(
    '/api/service-recommendations',
    serviceRecommendationRateLimit,
    requireAllowedOrigin,
    requireSession,
    async (req, res) => {
      const eventDetails = typeof req.body?.eventDetails === 'string'
        ? req.body.eventDetails.trim()
        : '';
      if (!eventDetails || eventDetails.length > 600) {
        return res.status(400).json({
          error: 'Cuéntanos un poco sobre tu evento (máximo 600 caracteres).',
        });
      }
      if (!isCreativeAssistantConfigured()) {
        throw new ApiError(503, 'El asistente de recomendaciones aún no está configurado.');
      }

      const catalog = await services.find({ active: true })
        .sort({ sortOrder: 1, name: 1 })
        .project({ _id: 0, slug: 1, name: 1, description: 1, keywords: 1 })
        .toArray();
      if (catalog.length === 0) {
        throw new ApiError(409, 'El catálogo todavía no tiene servicios disponibles.');
      }

      const input = [
        'Eres la asesora de Party Everyday. Responde en español y recomienda el servicio que mejor encaje con el evento descrito.',
        'Elige exactamente un servicio usando su slug, únicamente de la lista proporcionada. No inventes servicios, precios, paquetes, disponibilidad ni características no descritas.',
        'Explica brevemente por qué podría encajar, sin presentar suposiciones como hechos. Si faltan datos, indícalo en la explicación.',
        'Devuelve exclusivamente JSON válido con la forma {"serviceSlug":"slug exacto del catálogo","reason":"explicación breve"}.',
        `Catálogo disponible: ${JSON.stringify(catalog)}`,
        `Descripción del evento: ${JSON.stringify(eventDetails)}`,
      ].join('\n');

      let response;
      try {
        response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
            input,
            generation_config: { thinking_level: 'low', max_output_tokens: 500 },
          }),
          signal: AbortSignal.timeout(30000),
        });
      } catch {
        throw new ApiError(503, 'No se pudo conectar con el asistente. Inténtalo nuevamente.');
      }

      if (!response.ok) {
        console.error(`Gemini service recommendation request failed with HTTP ${response.status}.`);
        if (response.status === 429 || response.status === 503) {
          throw new ApiError(503, 'El asistente está temporalmente ocupado. Inténtalo en un momento.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new ApiError(503, 'La clave del asistente no tiene acceso al servicio de Gemini.');
        }
        throw new ApiError(502, 'El asistente no pudo recomendar un servicio en este momento.');
      }

      const payload = await response.json().catch(() => null);
      const outputSteps = Array.isArray(payload?.steps)
        ? payload.steps.filter((step) => step.type === 'model_output')
        : [];
      const generatedText = outputSteps
        .flatMap((step) => Array.isArray(step.content) ? step.content : [])
        .filter((item) => item.type === 'text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n')
        .trim();
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      let generated;
      try {
        if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error('Missing JSON response');
        generated = JSON.parse(generatedText.slice(jsonStart, jsonEnd + 1));
      } catch {
        throw new ApiError(502, 'El asistente devolvió una recomendación inválida. Inténtalo nuevamente.');
      }

      const matchedService = catalog.find((service) => service.slug === generated?.serviceSlug);
      const reason = typeof generated?.reason === 'string' ? generated.reason.trim().slice(0, 1200) : '';
      if (!matchedService || !reason) {
        throw new ApiError(502, 'El asistente no recomendó un servicio válido del catálogo. Inténtalo nuevamente.');
      }
      return res.json({
        recommendation: {
          serviceSlug: matchedService.slug,
          reason,
        },
      });
    }
  );

  app.post(
    '/api/creative-assistant',
    creativeAssistantRateLimit,
    requireAllowedOrigin,
    requireSession,
    async (req, res) => {
      const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
      if (!query || query.length > 500) {
        return res.status(400).json({
          error: 'Cuéntame qué tipo de celebración imaginas (máximo 500 caracteres).',
        });
      }
      if (!isCreativeAssistantConfigured()) {
        throw new ApiError(503, 'El asistente creativo aún no está configurado.');
      }

      const baseInput = [
        'Eres la asesora creativa de Party Everyday, una empresa de decoraci\u00f3n y planificaci\u00f3n de eventos.',
        'Responde siempre en espa\u00f1ol, con calidez y de forma pr\u00e1ctica. Dise\u00f1a una propuesta original, coherente y ajustada a lo que pide el cliente.',
        'Para el cliente, prepara un t\u00edtulo breve, una introducci\u00f3n de 1 o 2 frases, 3 ideas concretas de decoraci\u00f3n, 2 o 3 tendencias o recursos de inspiraci\u00f3n relevantes (sin afirmar que son tendencias actuales verificadas), una paleta de exactamente 5 colores que armonicen (cada uno con nombre y c\u00f3digo HEX v\u00e1lido) y una descripci\u00f3n breve del estilo visual.',
        'Aparte, crea adminBrief para uso exclusivo del equipo: un resumen operativo distinto del texto inspiracional del cliente, una lista de 3 a 5 materiales sugeridos (sin inventar cantidades ni precios), 3 pasos de montaje pr\u00e1cticos y 3 preguntas concretas que administraci\u00f3n debe confirmar con el cliente en Zoom. No repitas literalmente la propuesta p\u00fablica.',
        'Ten en cuenta presupuesto, espacio, edad, invitados y preferencias si se mencionan. No inventes estad\u00edsticas ni afirmes datos actuales que no puedas verificar.',
        'Sugiere exactamente 3 b\u00fasquedas concretas y variadas para encontrar referencias en Pinterest. No inventes nombres de pines ni enlaces; devuelve frases de b\u00fasqueda.',
        'Devuelve exclusivamente JSON v\u00e1lido, sin bloques Markdown, con esta estructura: {\"title\":\"nombre del concepto\",\"answer\":\"introducci\u00f3n breve\",\"ideas\":[\"idea 1\",\"idea 2\",\"idea 3\"],\"trends\":[\"inspiraci\u00f3n 1\",\"inspiraci\u00f3n 2\"],\"palette\":[{\"name\":\"Rosa empolvado\",\"hex\":\"#E8A1B3\"},{\"name\":\"Marfil\",\"hex\":\"#FFF4E6\"},{\"name\":\"Verde salvia\",\"hex\":\"#A8B5A0\"},{\"name\":\"Dorado suave\",\"hex\":\"#D6B56D\"},{\"name\":\"Malva\",\"hex\":\"#B69AB8\"}],\"style\":\"descripci\u00f3n del estilo visual\",\"adminBrief\":{\"summary\":\"resumen operativo para administraci\u00f3n\",\"materials\":[\"material 1\",\"material 2\",\"material 3\"],\"setupSteps\":[\"paso 1\",\"paso 2\",\"paso 3\"],\"zoomQuestions\":[\"pregunta 1\",\"pregunta 2\",\"pregunta 3\"]},\"pinterestLinks\":[{\"title\":\"etiqueta breve\",\"query\":\"frase de b\u00fasqueda\"},{\"title\":\"etiqueta breve\",\"query\":\"frase de b\u00fasqueda\"},{\"title\":\"etiqueta breve\",\"query\":\"frase de b\u00fasqueda\"}]}',
        `Solicitud del cliente: ${JSON.stringify(query)}`,
      ].join('\n');
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

      let response;
      try {
        response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            model,
            input: baseInput,
            generation_config: { thinking_level: 'low', max_output_tokens: 2000 },
          }),
          signal: AbortSignal.timeout(45000),
        });
      } catch {
        throw new ApiError(503, 'No se pudo conectar con el asistente. Inténtalo nuevamente.');
      }

      if (!response.ok) {
        console.error(`Gemini creative assistant request failed with HTTP ${response.status}.`);
        if (response.status === 429 || response.status === 503) {
          throw new ApiError(503, 'El asistente está temporalmente ocupado. Inténtalo en un momento.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new ApiError(503, 'La clave del asistente no tiene acceso al servicio de Gemini.');
        }
        throw new ApiError(502, 'El asistente no pudo generar ideas en este momento.');
      }

      const payload = await response.json().catch(() => null);
      const outputSteps = Array.isArray(payload?.steps)
        ? payload.steps.filter((step) => step.type === 'model_output')
        : [];
      const content = outputSteps.flatMap((step) => Array.isArray(step.content) ? step.content : []);
      const generatedText = content
        .filter((item) => item.type === 'text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n')
        .trim();
      if (!generatedText) {
        throw new ApiError(502, 'El asistente no devolvió una propuesta. Inténtalo nuevamente.');
      }

      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      let generated;
      try {
        generated = JSON.parse(generatedText.slice(jsonStart, jsonEnd + 1));
      } catch {
        throw new ApiError(502, 'El asistente no pudo preparar los enlaces de inspiración. Inténtalo nuevamente.');
      }
      if (jsonStart < 0 || jsonEnd <= jsonStart ||
          !generated || typeof generated !== 'object' || Array.isArray(generated) ||
          typeof generated.answer !== 'string' ||
          !Array.isArray(generated.pinterestLinks)) {
        throw new ApiError(502, 'El asistente devolvió una propuesta incompleta. Inténtalo nuevamente.');
      }

      const proposal = normalizeCreativeProposal({
        query,
        answer: generated.answer,
        title: generated.title,
        ideas: generated.ideas,
        trends: generated.trends,
        palette: generated.palette,
        style: generated.style,
        adminBrief: generated.adminBrief,
        links: generated.pinterestLinks,
      }, { includeAdminBrief: true });
      if (!proposal?.title || proposal.ideas.length < 2 || proposal.trends.length < 1 ||
          proposal.palette.length !== 5 || !proposal.style || proposal.links.length === 0 ||
          !proposal.adminBrief) {
        throw new ApiError(502, 'El asistente devolvió una propuesta incompleta. Inténtalo nuevamente.');
      }

      const proposalBrief = await creativeProposalBriefs.insertOne({
        userId: req.user._id,
        adminBrief: proposal.adminBrief,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      return res.json({
        creativeProposalRef: proposalBrief.insertedId.toString(),
        answer: proposal.answer,
        title: proposal.title,
        ideas: proposal.ideas,
        trends: proposal.trends,
        palette: proposal.palette,
        style: proposal.style,
        links: proposal.links,
      });
    }
  );

  app.get('/api/appointments', requireSession, async (req, res) => {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const results = await appointments.find(query).sort({ date: 1, time: 1 }).toArray();
    return res.json({
      appointments: results.map((appointment) => serializeAppointment(appointment, {
        includeAdminBrief: req.user.role === 'admin',
      })),
    });
  });

  app.get(
    '/api/appointments/:id/idea-images/:imageId',
    requireSession,
    requireAdmin,
    async (req, res, next) => {
      if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.params.imageId)) {
        return res.status(400).json({ error: 'La imagen indicada no es válida.' });
      }

      const appointmentId = new ObjectId(req.params.id);
      const imageId = new ObjectId(req.params.imageId);
      const appointment = await appointments.findOne({
        _id: appointmentId,
        'ideaImages.id': imageId,
      });
      if (!appointment) return res.status(404).json({ error: 'No se encontró la imagen.' });

      const image = await appointmentIdeaImages.find({
        _id: imageId,
        'metadata.appointmentId': appointmentId.toString(),
      }).limit(1).next();
      if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(image.metadata?.contentType)) {
        return res.status(404).json({ error: 'No se encontró la imagen.' });
      }

      res.set({
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `inline; filename="${image.filename.replace(/["\\\r\n]/g, '_')}"`,
        'Content-Type': image.metadata.contentType,
        'X-Content-Type-Options': 'nosniff',
      });
      const download = appointmentIdeaImages.openDownloadStream(imageId);
      download.once('error', (error) => {
        if (res.headersSent) res.destroy(error);
        else next(error);
      });
      return download.pipe(res);
    }
  );

  app.post(
    '/api/appointments',
    requireAllowedOrigin,
    requireSession,
    async (req, res) => {
      const { date, time } = req.body || {};
      const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
      const serviceSlug = req.body?.serviceSlug;
      const hasCreativeProposal = Object.hasOwn(req.body || {}, 'creativeProposal');
      const creativeProposal = hasCreativeProposal
        ? normalizeCreativeProposal(req.body.creativeProposal)
        : null;
      const creativeProposalRef = req.body?.creativeProposalRef;
      const ideaImages = normalizeIdeaImages(req.body?.ideaImages);
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
      let selectedService = null;
      if (serviceSlug !== undefined) {
        if (typeof serviceSlug !== 'string' || !serviceSlug.trim()) {
          return res.status(400).json({ error: 'El servicio seleccionado no es válido.' });
        }
        selectedService = await services.findOne({ slug: serviceSlug.trim(), active: true });
        if (!selectedService) {
          return res.status(400).json({ error: 'El servicio seleccionado ya no está disponible.' });
        }
      }
      if (hasCreativeProposal && !creativeProposal) {
        return res.status(400).json({ error: 'La propuesta seleccionada no es válida. Genera otra idea e inténtalo nuevamente.' });
      }
      let adminBrief = null;
      if (creativeProposal) {
        if (typeof creativeProposalRef !== 'string' || !ObjectId.isValid(creativeProposalRef)) {
          return res.status(400).json({
            error: 'No encontramos la guía interna de esta propuesta. Genera la idea nuevamente antes de agendar.',
          });
        }
        const proposalBrief = await creativeProposalBriefs.findOne({
          _id: new ObjectId(creativeProposalRef),
          userId: req.user._id,
          expiresAt: { $gt: new Date() },
        });
        adminBrief = normalizeAdminBrief(proposalBrief?.adminBrief);
        if (!adminBrief) {
          return res.status(400).json({
            error: 'La guía interna de esta propuesta venció. Genera la idea nuevamente antes de agendar.',
          });
        }
      }
      if (!ideaImages) {
        return res.status(400).json({
          error: 'Adjunta hasta 4 imágenes JPG, PNG o WebP, máximo 2 MB cada una y 6 MB en total.',
        });
      }

      if (!isZoomConfigured()) {
        throw new ApiError(503, 'Zoom aún no está configurado. No se pudo crear la reunión.');
      }

      const appointment = {
        userId: req.user._id,
        clientName: req.user.name,
        clientEmail: req.user.email,
        date,
        time,
        activeSlot: `${date}T${time}`,
        topic,
        ...(selectedService ? { serviceSlug: selectedService.slug, serviceName: selectedService.name } : {}),
        ...(creativeProposal ? { creativeProposal } : {}),
        ...(adminBrief ? { adminBrief } : {}),
        status: 'creating',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      let appointmentId;
      let meeting;
      const savedIdeaImages = [];
      try {
        const result = await appointments.insertOne(appointment);
        appointmentId = result.insertedId;
        for (const image of ideaImages) {
          savedIdeaImages.push(
            await saveAppointmentIdeaImage(appointmentIdeaImages, image, appointmentId)
          );
        }
        if (savedIdeaImages.length > 0) {
          await appointments.updateOne(
            { _id: appointmentId, status: 'creating' },
            { $set: { ideaImages: savedIdeaImages } }
          );
        }
        const zoomUserId = encodeURIComponent(process.env.ZOOM_USER_ID || 'me');
        meeting = await requestZoom(`/users/${zoomUserId}/meetings`, {
          method: 'POST',
          body: JSON.stringify({
            topic: `Party Everyday: ${topic.slice(0, 180)}`,
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
          { _id: appointmentId, status: 'creating' },
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
        if (meeting?.id) {
          try {
            await requestZoom(`/meetings/${encodeURIComponent(String(meeting.id))}`, {
              method: 'DELETE',
            });
          } catch (cleanupError) {
            console.error('Could not clean up an unbooked Zoom meeting:', cleanupError.message);
          }
        }
        for (const image of savedIdeaImages) {
          try {
            await appointmentIdeaImages.delete(image.id);
          } catch (cleanupError) {
            console.error('Could not clean up an unbooked idea image:', cleanupError.message);
          }
        }
        if (appointmentId) {
          await appointments.deleteOne({ _id: appointmentId, status: 'creating' });
        }
        if (error.code === 11000) {
          return res.status(409).json({ error: 'Ese horario ya está reservado. Elige otra hora.' });
        }
        throw error;
      }

      const confirmedAppointment = await appointments.findOne({ _id: appointmentId });
      await deliverZoomEmail(confirmedAppointment);
      const savedAppointment = await appointments.findOne({ _id: appointmentId });
      return res.status(201).json({
        appointment: serializeAppointment(savedAppointment),
        notificationSent: Boolean(savedAppointment.zoomEmailSentAt),
      });
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
          {
            _id: appointmentId,
            status: current.status,
            $or: [
              { zoomEmailSendingAt: { $exists: false } },
              { zoomEmailSendingAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
            ],
          },
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
              $unset: {
                zoomMeetingId: '',
                zoomJoinUrl: '',
                zoomEmailSentAt: '',
                zoomEmailSendingAt: '',
                zoomEmailFailed: '',
                activeSlot: '',
              },
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
              $unset: {
                zoomEmailSentAt: '',
                zoomEmailSendingAt: '',
                zoomEmailFailed: '',
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

      if (status === 'confirmed' && current.status === 'pending') {
        const confirmedAppointment = await appointments.findOne({ _id: appointmentId });
        await deliverZoomEmail(confirmedAppointment);
      }

      const updatedAppointment = await appointments.findOne({ _id: appointmentId });
      return res.json({
        appointment: serializeAppointment(updatedAppointment, { includeAdminBrief: true }),
      });
    }
  );

  app.post(
    '/api/appointments/:id/notification',
    requireAllowedOrigin,
    requireSession,
    requireAdmin,
    async (req, res) => {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'La cita indicada no es válida.' });
      }

      const appointmentId = new ObjectId(req.params.id);
      const appointment = await appointments.findOne({ _id: appointmentId });
      if (!appointment) return res.status(404).json({ error: 'No se encontró la cita.' });
      if (appointment.status !== 'confirmed' || !appointment.zoomJoinUrl) {
        return res.status(409).json({ error: 'La cita no tiene una reunión de Zoom confirmada.' });
      }

      const sent = await deliverZoomEmail(appointment);
      const updatedAppointment = await appointments.findOne({ _id: appointmentId });
      if (!sent) {
        return res.status(502).json({
          error: 'No se pudo enviar el correo al cliente. Revisa Gmail y vuelve a intentarlo.',
          appointment: serializeAppointment(updatedAppointment, { includeAdminBrief: true }),
        });
      }
      return res.json({
        appointment: serializeAppointment(updatedAppointment, { includeAdminBrief: true }),
      });
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
    const verification = createEmailToken();
    const user = {
      name,
      email,
      passwordHash,
      role: 'client',
      emailVerified: false,
      emailVerificationTokenHash: verification.hash,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    try {
      const result = await users.insertOne(user);
      user._id = result.insertedId;
      sendVerificationEmail(user, verification.token).catch((error) => {
        console.error('Optional verification email delivery failed:', error.message);
      });
      return res.status(201).json({
        message: 'Tu cuenta ya está creada y puedes iniciar sesión. La verificación por correo es opcional.',
      });
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

  app.post('/api/auth/verify-email', authRateLimit, requireAllowedOrigin, async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    if (!/^[a-f\d]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'El enlace de verificación no es válido.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await users.updateOne(
      {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: new Date() },
        emailVerified: false,
      },
      {
        $set: { emailVerified: true, emailVerifiedAt: new Date() },
        $unset: { emailVerificationTokenHash: '', emailVerificationExpiresAt: '' },
      }
    );
    if (!result.modifiedCount) {
      return res.status(400).json({
        error: 'El enlace venció o ya fue utilizado. Solicita un nuevo correo de verificación.',
      });
    }
    return res.json({ message: 'Correo verificado. Ya puedes iniciar sesión.' });
  });

  app.post('/api/auth/resend-verification', authRateLimit, requireAllowedOrigin, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Escribe un correo electrónico válido.' });
    }
    if (!isEmailConfigured()) {
      throw new ApiError(503, 'El envío de correo aún no está configurado en Backend/.env.');
    }

    const user = await users.findOne({ email, emailVerified: { $ne: true } });
    if (user) {
      const verification = createEmailToken();
      await users.updateOne(
        { _id: user._id, emailVerified: { $ne: true } },
        {
          $set: {
            emailVerificationTokenHash: verification.hash,
            emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        }
      );
      await sendVerificationEmail(user, verification.token);
    }
    return res.json({
      message: 'Si la cuenta necesita verificación, enviaremos un nuevo enlace a ese correo.',
    });
  });

  app.post(
    '/api/auth/forgot-password',
    authRateLimit,
    passwordResetRateLimit,
    requireAllowedOrigin,
    async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Escribe un correo electrónico válido.' });
    }
    if (!isEmailConfigured()) {
      throw new ApiError(503, 'La recuperación por correo aún no está configurada en Backend/.env.');
    }

    const user = await users.findOne({ email });
    if (user) {
      const code = crypto.randomInt(10000000, 100000000).toString();
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetTokenHash: crypto.createHash('sha256').update(code).digest('hex'),
            passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        }
      );
      await sendPasswordResetEmail(user, code);
    }
    return res.json({
      message: 'Si existe una cuenta con ese correo, te enviaremos un código de recuperación válido por una hora.',
    });
    }
  );

  app.post(
    '/api/auth/reset-password',
    authRateLimit,
    passwordResetRateLimit,
    requireAllowedOrigin,
    async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const hasValidToken = /^[a-f\d]{64}$/i.test(token);
    const hasValidCode = isValidEmail(email) && /^\d{8}$/.test(code);
    if (!hasValidToken && !hasValidCode) {
      return res.status(400).json({ error: 'El código de recuperación no es válido.' });
    }
    if (typeof password !== 'string' || password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(hasValidToken ? token : code).digest('hex');
    const user = await users.findOne({
      ...(hasValidToken ? {} : { email }),
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({
        error: 'El código venció o ya fue utilizado. Solicita uno nuevo.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await users.updateOne(
      {
        _id: user._id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        $set: { passwordHash, passwordChangedAt: new Date() },
        $unset: { passwordResetTokenHash: '', passwordResetExpiresAt: '' },
      }
    );
    if (!result.modifiedCount) {
      return res.status(400).json({ error: 'El enlace venció o ya fue utilizado.' });
    }
    return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    }
  );

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
    if (error.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Las imágenes adjuntas superan el límite permitido. Reduce su tamaño e inténtalo nuevamente.',
      });
    }
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
