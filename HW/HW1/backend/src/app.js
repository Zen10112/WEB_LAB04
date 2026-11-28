import express from 'express';
import mongoose from 'mongoose';
import { Profile, profileOrder } from './models/Profile.js';
import { Swipe, swipeKinds } from './models/Swipe.js';

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const defaultFrontendOrigin = 'http://localhost:5173';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isId(value) {
  return typeof value === 'string' && mongoose.isObjectIdOrHexString(value);
}

function readMutation(body, fieldCount) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== fieldCount
      || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0
      || body.expectedRevision === Number.MAX_SAFE_INTEGER
      || typeof body.operationId !== 'string' || !uuid.test(body.operationId)) {
    throw new ApiError(400, 'INVALID_PAYLOAD', 'Supply a nonnegative integer expectedRevision and a UUID operationId.');
  }
  return { expectedRevision: body.expectedRevision, operationId: body.operationId.toLowerCase() };
}

function activeRecords(deck) {
  return deck.records.filter((record) => !record.undoOperationId);
}

function toSnapshot(deck) {
  return {
    revision: deck.revision,
    history: activeRecords(deck).map(({ _id, profileId, kind }) => ({ id: String(_id), profileId: String(profileId), kind })),
  };
}

function isReplay(deck, operationId, matches) {
  const record = deck.records.find((entry) => entry.operationId === operationId || entry.undoOperationId === operationId);
  if (!record) return false;
  if (!matches(record)) throw new ApiError(409, 'OPERATION_ID_REUSED', 'This operationId belongs to a different request.');
  return true;
}

function staleRevision() {
  return new ApiError(409, 'STALE_REVISION', 'The deck changed. Reload its history before retrying.');
}

export function createApp({ frontendOrigin = defaultFrontendOrigin, deckId = 'default' } = {}) {
  const url = new URL(frontendOrigin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== frontendOrigin) {
    throw new Error('FRONTEND_ORIGIN must be a single HTTP origin without a path or trailing slash.');
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

  async function readDeck() {
    return (await Swipe.findById(deckId).lean()) ?? { revision: 0, records: [] };
  }

  async function mutateDeck({ expectedRevision, operationId }, matches, prepareUpdate) {
    const deck = await readDeck();
    if (isReplay(deck, operationId, matches)) return { replayed: true, snapshot: toSnapshot(deck) };
    if (deck.revision !== expectedRevision) throw staleRevision();

    const update = await prepareUpdate(deck);
    if (!deck._id) {
      try {
        await Swipe.updateOne({ _id: deckId }, { $setOnInsert: { revision: 0, records: [] } }, { upsert: true });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }

    const updated = await Swipe.findOneAndUpdate(
      { _id: deckId, revision: expectedRevision },
      { ...update, $inc: { revision: 1 } },
      { new: true, runValidators: true },
    ).lean();
    if (updated) return { replayed: false, snapshot: toSnapshot(updated) };

    const latest = await readDeck();
    if (isReplay(latest, operationId, matches)) return { replayed: true, snapshot: toSnapshot(latest) };
    throw staleRevision();
  }

  app.get('/api/profiles', async (_req, res) => {
    const profiles = await Profile.find().sort(profileOrder).select('name age bio imageUrl').lean();
    res.json(profiles.map(({ _id, name, age, bio, imageUrl }) => ({ id: String(_id), name, age, bio, imageUrl })));
  });

  app.get('/api/swipes', async (_req, res) => {
    res.json(toSnapshot(await readDeck()));
  });

  app.post('/api/swipe', async (req, res) => {
    const mutation = readMutation(req.body, 4);
    const { profileId, kind } = req.body;
    if (!isId(profileId) || !swipeKinds.includes(kind)) {
      throw new ApiError(400, 'INVALID_SWIPE', 'Supply a valid profileId and a kind of PASS, LIKE, or SKIP.');
    }
    const normalizedId = profileId.toLowerCase();
    const nextRevision = mutation.expectedRevision + 1;
    const result = await mutateDeck(mutation,
      (record) => record.operationId === mutation.operationId && String(record.profileId) === normalizedId
        && record.kind === kind && record.revision === nextRevision,
      async (deck) => {
        const reviewedIds = activeRecords(deck).map((record) => record.profileId);
        const next = await Profile.findOne({ _id: { $nin: reviewedIds } }).sort(profileOrder).select('_id').lean();
        if (String(next?._id) !== normalizedId) {
          if (!(await Profile.exists({ _id: normalizedId }))) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
          throw new ApiError(409, 'NOT_NEXT_PROFILE', 'Only the next profile in the deck can be swiped.');
        }
        return { $push: { records: { profileId: normalizedId, kind, operationId: mutation.operationId, revision: nextRevision } } };
      },
    );
    res.status(result.replayed ? 200 : 201).json(result.snapshot);
  });

  app.post('/api/swipe/:id/undo', async (req, res) => {
    const mutation = readMutation(req.body, 2);
    if (!isId(req.params.id)) throw new ApiError(400, 'INVALID_SWIPE_ID', 'Supply a valid swipe ID.');

    const swipeId = req.params.id.toLowerCase();
    const nextRevision = mutation.expectedRevision + 1;
    const result = await mutateDeck(mutation,
      (record) => record.undoOperationId === mutation.operationId && String(record._id) === swipeId
        && record.undoRevision === nextRevision,
      (deck) => {
        const index = deck.records.findIndex((record) => String(record._id) === swipeId);
        if (index === -1) throw new ApiError(404, 'SWIPE_NOT_FOUND', 'Swipe not found.');
        if (String(activeRecords(deck).at(-1)?._id) !== swipeId) {
          throw new ApiError(409, 'NOT_LATEST_SWIPE', 'Only the latest active swipe can be undone.');
        }
        return { $set: { [`records.${index}.undoOperationId`]: mutation.operationId, [`records.${index}.undoRevision`]: nextRevision } };
      },
    );
    res.json(result.snapshot);
  });

  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found.')));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ApiError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON.' } });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'JSON payload exceeds the limit.' } });
    if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
      return res.status(415).json({ error: { code: 'UNSUPPORTED_ENCODING', message: 'Unsupported JSON encoding.' } });
    }

    console.error('HW1 API error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } });
  });

  return app;
}
