import { Link, Route, Routes } from 'react-router';
import SimpleForm from './form/SimpleForm';
import MainLayout from './layouts/MainLayout.jsx';
import NotFound from './pages/NotFound.jsx';

function Home() {
  return (
    <>
      <h1>Trang chủ</h1>
      <Link to="/form">Mở biểu mẫu liên hệ</Link>
    </>
  );
}

function ContactPage() {
  return (
    <>
      <h1>Biểu mẫu liên hệ</h1>
      <SimpleForm />
    </>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="form" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
