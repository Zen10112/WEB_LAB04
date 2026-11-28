import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  seedKey: String,
  order: { type: Number, required: true, min: 0 },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 18, validate: Number.isInteger },
  bio: { type: String, required: true },
  imageUrl: { type: String, required: true },
}, { versionKey: false });

profileSchema.index({ seedKey: 1 }, { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } });

export const profileOrder = { order: 1, _id: 1 };
export const Profile = mongoose.model('Profile', profileSchema);
