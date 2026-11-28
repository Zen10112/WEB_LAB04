import mongoose from 'mongoose';
import { connectDatabase } from './src/database.js';
import { Appeal, Dossier } from './src/models.js';

const dossiers = [
  {
    playerID: 'himass',
    displayName: 'Himass',
    reference: 'LAB4-HIMASS',
    topic: 'Review workflow',
    deadlineAt: '2027-12-01T12:00:00.000Z',
    summary: 'A classroom exercise in organizing a case summary and preparing a review timeline.',
  },
  {
    playerID: 'tanvuu',
    displayName: 'TanVuu',
    reference: 'LAB4-TANVUU',
    topic: 'Evidence intake',
    deadlineAt: '2027-12-02T12:00:00.000Z',
    summary: 'A classroom exercise in cataloging sample materials and preparing questions for review.',
  },
];

try {
  await connectDatabase();
  await Promise.all([Dossier.init(), Appeal.init()]);

  let inserted = 0;
  for (const { playerID, ...dossier } of dossiers) {
    const result = await Dossier.updateOne({ playerID }, { $setOnInsert: dossier }, { upsert: true, runValidators: true });
    inserted += result.upsertedCount;
  }
  console.log(`HW2 seed complete: ${inserted} inserted, ${dossiers.length - inserted} already present.`);
} catch (error) {
  console.error('HW2 seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
