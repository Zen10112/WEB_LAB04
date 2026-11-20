import React from 'react';

export default function PersonDetailSkeleton() {
  return (
    <div className="person-detail-skeleton" aria-hidden="true">
      <div className="person-detail-grid">
        <span className="person-detail-placeholder" />
        <span className="person-detail-placeholder person-detail-placeholder--name" />
        <span className="person-detail-placeholder" />
        <span className="person-detail-placeholder person-detail-placeholder--role" />
      </div>
    </div>
  );
}
