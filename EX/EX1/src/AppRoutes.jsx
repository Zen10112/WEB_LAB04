import { Link, Route, Routes } from 'react-router';
import App from './App.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import NotFound from './pages/NotFound.jsx';

function Home() {
  return (
    <>
      <h1>Trang chủ</h1>
      <Link to="/people">Xem thông tin cá nhân</Link>
    </>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="people" element={<App />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
