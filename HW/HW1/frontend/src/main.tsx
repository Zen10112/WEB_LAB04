import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SwipeDeckSession } from './SwipeDeck.jsx';
import './swipe-deck.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing React root element');
}

createRoot(container).render(
  <StrictMode>
    <SwipeDeckSession />
  </StrictMode>,
);
