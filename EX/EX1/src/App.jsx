import React, { Suspense } from 'react';

const PersonDetail = React.lazy(() => import('./components/PersonDetail.jsx'));

const samplePerson = { name: 'Nguyễn Minh Anh', role: 'Sinh viên' };

export default function App() {
  return (
    <main>
      <h1>Thông tin cá nhân</h1>
      <Suspense
        fallback={
          <p aria-busy="true" aria-live="polite">Đang tải thông tin cá nhân…</p>
        }
      >
        <PersonDetail person={samplePerson} />
      </Suspense>
    </main>
  );
}
