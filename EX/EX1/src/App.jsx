import React, { Suspense } from 'react';
import PersonDetailSkeleton from './components/PersonDetailSkeleton.jsx';
import './person-detail.css';

const PersonDetail = React.lazy(() => import('./components/PersonDetail.jsx'));

const samplePerson = { name: 'Nguyễn Minh Anh', role: 'Sinh viên' };

export default function App() {
  return (
    <main className="person-page">
      <h1>Thông tin cá nhân</h1>
      <div className="person-detail-panel">
        <Suspense fallback={<PersonDetailSkeleton />}>
          <PersonDetail person={samplePerson} />
        </Suspense>
      </div>
    </main>
  );
}
