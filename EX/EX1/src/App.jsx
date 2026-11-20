import { lazy, Suspense, useEffect, useId, useState } from 'react';
import PersonDetailSkeleton from './components/PersonDetailSkeleton.jsx';
import './person-detail.css';

const PersonDetail = lazy(() => import('./components/PersonDetail.jsx'));

const samplePerson = { name: 'Nguyễn Minh Anh', role: 'Sinh viên' };
// Reuse these elements when only the accessible status changes.
const personDetail = <PersonDetail person={samplePerson} />;
const skeleton = <PersonDetailSkeleton />;
const statusMessages = {
  idle: '',
  loading: 'Đang tải thông tin cá nhân…',
  loaded: 'Đã tải thông tin cá nhân.',
};

// Report committed Suspense content so the live region stays mounted.
function DetailStatus({ status, onChange }) {
  useEffect(() => {
    onChange(status);
  }, [onChange, status]);

  return null;
}

export default function App() {
  const headingId = useId();
  const [status, setStatus] = useState('idle');

  return (
    <>
      <h1 id={headingId}>Thông tin cá nhân</h1>
      <p className="person-detail-visually-hidden" aria-live="polite" aria-atomic="true">
        {statusMessages[status]}
      </p>
      <section className="person-detail-panel" aria-labelledby={headingId} aria-busy={status !== 'loaded'}>
        <Suspense
          fallback={
            <>
              {skeleton}
              <DetailStatus status="loading" onChange={setStatus} />
            </>
          }
        >
          {personDetail}
          <DetailStatus status="loaded" onChange={setStatus} />
        </Suspense>
      </section>
    </>
  );
}
