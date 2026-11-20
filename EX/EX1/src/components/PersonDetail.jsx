export default function PersonDetail({ person }) {
  return (
    <dl className="person-detail-grid">
      <dt>Họ và tên</dt>
      <dd>{person.name}</dd>
      <dt>Vai trò</dt>
      <dd>{person.role}</dd>
    </dl>
  );
}
