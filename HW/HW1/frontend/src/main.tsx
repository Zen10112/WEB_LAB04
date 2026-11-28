import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing React root element');
}

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>Hẹn hò nhưng không yêu</h1>
    </main>
  </StrictMode>,
);
