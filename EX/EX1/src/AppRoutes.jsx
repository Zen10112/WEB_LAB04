import { Link, Route, Routes } from 'react-router';
import App from './App.jsx';
import NotFound from './pages/NotFound.jsx';

function Home() {
  return (
    <main className="person-page">
      <h1>Trang chủ</h1>
      <Link to="/people">Xem thông tin cá nhân</Link>
    </main>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/people" element={<App />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
