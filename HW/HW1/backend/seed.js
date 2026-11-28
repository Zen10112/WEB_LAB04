import mongoose from 'mongoose';
import { connectDatabase } from './src/database.js';
import { Profile } from './src/models/Profile.js';
import { Swipe } from './src/models/Swipe.js';

const profiles = [
  { seedKey: 'minh-anh', order: 10, name: 'Minh Anh', age: 24, bio: 'Thích cà phê sáng, ảnh phim và những cuộc trò chuyện quên giờ.' },
  { seedKey: 'bao-tran', order: 20, name: 'Bảo Trân', age: 25, bio: 'Hay ghé hiệu sách cũ và luôn mang theo một cuốn sổ nhỏ.' },
  { seedKey: 'thao-vy', order: 30, name: 'Thảo Vy', age: 23, bio: 'Cuối tuần thích đi dạo, ăn kem và tìm những quán mới.' },
];

try {
  await connectDatabase();
  await Promise.all([Profile.init(), Swipe.init()]);

  let inserted = 0;
  for (const profile of profiles) {
    const result = await Profile.updateOne({ seedKey: profile.seedKey }, {
      $setOnInsert: { ...profile, imageUrl: `/profiles/${profile.seedKey}.webp` },
    }, { upsert: true, runValidators: true });
    inserted += result.upsertedCount;
  }
  console.log(`HW1 seed complete: ${inserted} inserted, ${profiles.length - inserted} already present.`);
} catch (error) {
  console.error('HW1 seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
