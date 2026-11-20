import React, { Suspense, useEffect, useId, useState } from 'react';
import PersonDetailSkeleton from './components/PersonDetailSkeleton.jsx';
import './person-detail.css';

const PersonDetail = React.lazy(() => import('./components/PersonDetail.jsx'));

const samplePerson = { name: 'Nguyễn Minh Anh', role: 'Sinh viên' };

// Report committed Suspense content so the live region stays mounted.
function DetailStatus({ status, onChange }) {
  useEffect(() => {
    onChange(status);
  }, [onChange, status]);

  return null;
}

export default function App() {
  const headingId = useId();
  const [status, setStatus] = useState(null);
  const isLoaded = status === 'loaded';

  return (
    <main className="person-page">
      <h1 id={headingId}>Thông tin cá nhân</h1>
      <p className="person-detail-visually-hidden" aria-live="polite" aria-atomic="true">
        {status === 'loading' && 'Đang tải thông tin cá nhân…'}
        {isLoaded && 'Đã tải thông tin cá nhân.'}
      </p>
      <section className="person-detail-panel" aria-labelledby={headingId} aria-busy={!isLoaded}>
        <Suspense
          fallback={
            <>
              <PersonDetailSkeleton />
              <DetailStatus status="loading" onChange={setStatus} />
            </>
          }
        >
          <PersonDetail person={samplePerson} />
          <DetailStatus status="loaded" onChange={setStatus} />
        </Suspense>
      </section>
    </main>
  );
}
