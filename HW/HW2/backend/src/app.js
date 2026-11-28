import express from 'express';
import { Appeal, Dossier, playerIDs } from './models.js';
import { validateAppealPayload } from './appealValidation.js';

class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function findDossier(playerID) {
  const dossier = playerIDs.includes(playerID) ? await Dossier.findOne({ playerID }).lean() : null;
  if (!dossier) throw new ApiError(404, 'DOSSIER_NOT_FOUND', 'Dossier not found.');
  return dossier;
}

function toReceipt(appeal) {
  return { id: String(appeal._id), playerID: appeal.playerID, submittedAt: appeal.submittedAt.toISOString() };
}

function sendReplay(res, stored, payload) {
  if (stored.ground !== payload.ground || stored.statement !== payload.statement || stored.evidenceUrl !== payload.evidenceUrl) {
    throw new ApiError(409, 'OPERATION_ID_REUSED', 'This operationId belongs to a different appeal payload.');
  }
  return res.status(200).json(toReceipt(stored));
}

export function createApp({ frontendOrigin = 'http://localhost:5174', appealModel = Appeal, now = Date.now } = {}) {
  const originUrl = new URL(frontendOrigin);
  if (!['http:', 'https:'].includes(originUrl.protocol) || originUrl.origin !== frontendOrigin) {
    throw new Error('FRONTEND_ORIGIN must be one HTTP or HTTPS origin without a path or trailing slash.');
  }

  const app = express();
  app.use((req, res, next) => {
    res.vary('Origin');
    const origin = req.get('Origin');
    if (!origin) return next();
    if (origin !== frontendOrigin) return next(new ApiError(403, 'ORIGIN_FORBIDDEN', 'This origin is not allowed.'));

    res.set('Access-Control-Allow-Origin', frontendOrigin);
    if (req.method !== 'OPTIONS') return next();
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.sendStatus(204);
  });
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/dossiers', async (_req, res) => {
    const dossiers = await Dossier.find().sort({ playerID: 1 }).select('playerID displayName -_id').lean();
    res.json({ dossiers });
  });

  app.get('/api/dossiers/:playerID', async (req, res) => {
    const { playerID, displayName, reference, topic, summary, deadlineAt } = await findDossier(req.params.playerID);
    res.set('Cache-Control', 'no-store').json({
      dossier: { playerID, displayName, reference, topic, summary, deadlineAt: deadlineAt.toISOString() },
      serverNow: new Date(now()).toISOString(),
    });
  });

  app.post('/api/dossiers/:playerID/appeals', async (req, res) => {
    const { playerID, deadlineAt } = await findDossier(req.params.playerID);
    const { payload, message, fields } = validateAppealPayload(req.body);
    if (!payload) throw new ApiError(400, 'INVALID_PAYLOAD', message, fields);

    const key = { playerID, operationId: payload.operationId };
    const existing = await appealModel.findOne(key).lean();
    if (existing) return sendReplay(res, existing, payload);

    const submittedAt = new Date(now());
    if (!(submittedAt < deadlineAt)) throw new ApiError(409, 'APPEAL_DEADLINE_EXPIRED', 'The appeal window has closed.');

    try {
      const appeal = await appealModel.create({ ...payload, playerID, submittedAt });
      return res.status(201).json(toReceipt(appeal));
    } catch (error) {
      if (error.code !== 11000) throw error;
      const concurrent = await appealModel.findOne(key).lean();
      if (!concurrent) throw error;
      return sendReplay(res, concurrent, payload);
    }
  });

  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found.')));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ApiError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message, fields: error.fields } });
    }
    if (error instanceof URIError && error.status === 400) {
      return res.status(400).json({ error: { code: 'INVALID_PATH', message: 'The request path is malformed.' } });
    }
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON.' } });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'JSON payload exceeds the limit.' } });
    if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
      return res.status(415).json({ error: { code: 'UNSUPPORTED_ENCODING', message: 'Unsupported JSON encoding.' } });
    }

    console.error('HW2 API error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } });
  });

  return app;
}
