import { Link, Outlet } from 'react-router';
import './main-layout.css';

export default function MainLayout() {
  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <strong>Lab 4</strong>
          <nav aria-label="Điều hướng chính">
            <Link to="/">Trang chủ</Link>
            <Link to="/people">Thông tin cá nhân</Link>
          </nav>
        </div>
      </header>
      <main className="layout-content">
        <Outlet />
      </main>
    </>
  );
}
