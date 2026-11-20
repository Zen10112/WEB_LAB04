export default function PersonDetailSkeleton() {
  return (
    <div className="person-detail-skeleton person-detail-grid" aria-hidden="true">
      <span className="person-detail-placeholder" />
      <span className="person-detail-placeholder person-detail-placeholder--name" />
      <span className="person-detail-placeholder" />
      <span className="person-detail-placeholder person-detail-placeholder--role" />
    </div>
  );
}
