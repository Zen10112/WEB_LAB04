import { NavLink, Outlet } from 'react-router';
import './main-layout.css';

const navigationLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/people', label: 'Thông tin cá nhân' },
];

export default function MainLayout() {
  return (
    <>
      <header className="layout-header">
        <div className="layout-header-inner">
          <strong>Lab 4</strong>
          <nav aria-label="Điều hướng chính">
            {navigationLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  isActive ? 'layout-nav-link is-active' : 'layout-nav-link'
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="layout-content">
        <Outlet />
      </main>
    </>
  );
}
