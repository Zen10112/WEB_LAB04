import mongoose from 'mongoose';

export const swipeKinds = ['PASS', 'LIKE', 'SKIP'];

const recordSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  kind: { type: String, enum: swipeKinds, required: true },
  operationId: { type: String, required: true },
  revision: { type: Number, required: true },
  undoOperationId: String,
  undoRevision: Number,
});

// Keep one document per deck so revision checks and all history writes can be atomic on standalone MongoDB.
const swipeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  revision: { type: Number, default: 0 },
  records: [recordSchema],
}, { versionKey: false });

export const Swipe = mongoose.model('Swipe', swipeSchema);
