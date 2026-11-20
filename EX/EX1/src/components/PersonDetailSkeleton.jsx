import React from 'react';

export default function PersonDetailSkeleton() {
  return (
    <>
      <span className="person-detail-visually-hidden" role="status">
        Đang tải thông tin cá nhân…
      </span>
      <div className="person-detail-skeleton" aria-busy="true" aria-live="polite">
        <div className="person-detail-grid" aria-hidden="true">
          <span className="person-detail-placeholder" />
          <span className="person-detail-placeholder person-detail-placeholder--name" />
          <span className="person-detail-placeholder" />
          <span className="person-detail-placeholder person-detail-placeholder--role" />
        </div>
      </div>
    </>
  );
}
