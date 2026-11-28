import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SwipeDeck from './SwipeDeck.jsx';
import './swipe-deck.css';

const profiles = [
  {
    id: 'minh-anh',
    name: 'Minh Anh',
    age: 24,
    bio: 'Thích cà phê sáng, ảnh phim và những cuộc trò chuyện quên giờ.',
    imageUrl: `${import.meta.env.BASE_URL}profiles/minh-anh.webp`,
  },
  {
    id: 'bao-tran',
    name: 'Bảo Trân',
    age: 25,
    bio: 'Hay ghé hiệu sách cũ và luôn mang theo một cuốn sổ nhỏ.',
    imageUrl: `${import.meta.env.BASE_URL}profiles/bao-tran.webp`,
  },
  {
    id: 'thao-vy',
    name: 'Thảo Vy',
    age: 23,
    bio: 'Cuối tuần thích đi dạo, ăn kem và tìm những quán mới.',
    imageUrl: `${import.meta.env.BASE_URL}profiles/thao-vy.webp`,
  },
];

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing React root element');
}

createRoot(container).render(
  <StrictMode>
    <SwipeDeck profiles={profiles} score={0} />
  </StrictMode>,
);
