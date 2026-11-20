import { lazy, Suspense, useEffect, useId, useMemo, useState } from 'react';
import PersonDetailSkeleton from './components/PersonDetailSkeleton.jsx';
import { samplePerson } from './data/people.js';
import './person-detail.css';

const PersonDetail = lazy(() => import('./components/PersonDetail.jsx'));

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

export default function App({ person = samplePerson }) {
  const headingId = useId();
  const [status, setStatus] = useState('idle');
  // Keep the detail stable when only the accessible status changes.
  const personDetail = useMemo(() => <PersonDetail person={person} />, [person]);

  return (
    <>
      <h2 id={headingId}>Thông tin cá nhân</h2>
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
