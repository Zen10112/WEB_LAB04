import mongoose from 'mongoose';
import { appealGrounds } from './appealValidation.js';

export const playerIDs = ['himass', 'tanvuu'];

const dossierSchema = new mongoose.Schema({
  playerID: { type: String, enum: playerIDs, required: true, unique: true },
  displayName: { type: String, required: true },
  reference: { type: String, required: true },
  topic: { type: String, required: true },
  summary: { type: String, required: true },
  deadlineAt: { type: Date, required: true },
}, { versionKey: false });

const appealSchema = new mongoose.Schema({
  playerID: { type: String, enum: playerIDs, required: true },
  operationId: { type: String, required: true },
  ground: { type: String, enum: appealGrounds, required: true },
  statement: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
  evidenceUrl: String,
  submittedAt: { type: Date, required: true },
}, { versionKey: false });

appealSchema.index({ playerID: 1, operationId: 1 }, { unique: true });

export const Dossier = mongoose.model('Dossier', dossierSchema);
export const Appeal = mongoose.model('Appeal', appealSchema);
