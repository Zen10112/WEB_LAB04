import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import FairPlayAppealPortal from './FairPlayAppealPortal.jsx';
import './fair-play-portal.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing React root element');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <FairPlayAppealPortal />
    </BrowserRouter>
  </StrictMode>,
);
