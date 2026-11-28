import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing React root element');
}

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>Esports Fair-Play Appeal Tribunal</h1>
      <p>Himass &amp; TanVuu Case Study</p>
    </main>
  </StrictMode>,
);
