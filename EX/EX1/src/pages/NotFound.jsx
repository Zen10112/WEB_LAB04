import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="person-page">
      <h1>404 – Không tìm thấy trang</h1>
      <Link to="/">Về trang chủ</Link>
    </main>
  );
}
